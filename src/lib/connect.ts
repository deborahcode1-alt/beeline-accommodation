import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";
import { stripeClient } from "@/lib/stripeClient";
import { recordCardPayment } from "@/lib/stayPayment";
import { refreshReadyForReview } from "@/lib/readyForReview";

// Stripe Connect (Standard accounts, direct charges). Each host links their own Stripe account, so a guest's
// card payment goes straight to that host's Stripe account and bank. Beeline never holds the money and takes
// nothing from it. Beeline's own Stripe account keeps doing the host subscriptions.
//
// It ships switched off. To turn it on:
//   1. In the Stripe dashboard turn on Connect for the platform account and give the secret key the Connect
//      permissions (accounts and account links).
//   2. Add a webhook endpoint at <site>/api/stripe/connect-webhook that listens to events on CONNECTED accounts
//      for: account.updated, checkout.session.completed. Put its signing secret in STRIPE_CONNECT_WEBHOOK_SECRET.
//   3. Set STRIPE_CONNECT_ENABLED=true.

export function isConnectEnabled() {
  return process.env.STRIPE_CONNECT_ENABLED === "true" && !!process.env.STRIPE_SECRET_KEY;
}

export function isConnectWebhookConfigured() {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_CONNECT_WEBHOOK_SECRET);
}

type ConnectFields = {
  stripeAccountId: string | null;
  stripeChargesEnabled: boolean;
};

/** The host has a Stripe account that Stripe has cleared to take card payments. */
export function hostIsConnected(host: Partial<ConnectFields> | null | undefined) {
  return !!host?.stripeAccountId && !!host.stripeChargesEnabled;
}

/** Saves what Stripe says about a connected account. */
export async function applyAccountStatus(account: Stripe.Account) {
  await prisma.host.updateMany({
    where: { stripeAccountId: account.id },
    data: {
      stripeChargesEnabled: !!account.charges_enabled,
      stripeDetailsSubmitted: !!account.details_submitted,
    },
  });
  // Connecting Stripe can finish a host's Get live checklist.
  const host = await prisma.host.findUnique({ where: { stripeAccountId: account.id }, select: { id: true } });
  await refreshReadyForReview(host?.id);
}

/**
 * Where to send a host so they can link (or finish linking) their Stripe account. The first time, this creates a
 * Standard account for them on Stripe; the host then signs up with their own email and bank details on Stripe's pages.
 */
export async function connectOnboardingUrl(hostId: string, returnPath = "/admin/payments"): Promise<string> {
  if (!isConnectEnabled()) throw new Error("Card payments aren't switched on yet.");
  const host = await prisma.host.findUnique({ where: { id: hostId } });
  if (!host) throw new Error("Host not found.");

  const stripe = stripeClient();
  let accountId = host.stripeAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "standard",
      country: "AU",
      email: host.notificationEmail || host.publicEmail || undefined,
      business_profile: { name: host.name },
      metadata: { hostId: host.id },
    });
    accountId = account.id;
    await prisma.host.update({ where: { id: host.id }, data: { stripeAccountId: accountId } });
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${SITE_URL}${returnPath}?connect=refresh`,
    return_url: `${SITE_URL}${returnPath}?connect=return`,
  });
  return link.url;
}

/**
 * Applies one event that Stripe sends about a CONNECTED account (a host's own Stripe account):
 *  - account.updated: the host's account status changed (for example they finished signing up)
 *  - checkout.session.completed: a guest paid for a stay on that host's account
 * Safe to run twice.
 */
export async function handleConnectEvent(event: Stripe.Event) {
  const accountId = event.account;
  if (!accountId) return;

  if (event.type === "account.updated") {
    await applyAccountStatus(event.data.object as Stripe.Account);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode !== "payment") return;
    const bookingId = session.metadata?.bookingId ?? session.client_reference_id;
    if (!bookingId) return;
    // Only believe a payment that really happened on the host's own account for this booking.
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { listing: { select: { host: { select: { stripeAccountId: true } } } } },
    });
    if (booking?.listing.host?.stripeAccountId !== accountId) {
      console.error("Ignored a payment event from an account that is not this booking's host:", accountId, bookingId);
      return;
    }
    await recordCardPayment(session);
  }
}

/** Asks Stripe for the host's account and saves the result. Used when the host returns from Stripe. */
export async function refreshConnectStatus(hostId: string) {
  const host = await prisma.host.findUnique({ where: { id: hostId } });
  if (!host?.stripeAccountId || !process.env.STRIPE_SECRET_KEY) return;
  try {
    const account = await stripeClient().accounts.retrieve(host.stripeAccountId);
    await applyAccountStatus(account);
  } catch (err) {
    console.error("Could not refresh the Stripe account status:", err);
  }
}
