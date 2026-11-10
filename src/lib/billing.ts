import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";
import { HOST_TIERS, TRIAL_DAYS, tierForListingCount, type TierKey } from "@/lib/pricing";
import { stripeClient } from "@/lib/stripeClient";
import { recordCardPayment } from "@/lib/stayPayment";

// Host subscriptions are billed through Stripe Billing on the platform owner's own Stripe
// account (not Stripe Connect, and Beeline takes no commission). Guests paying for a stay by card
// go through the same account for hosts with acceptsCardPayments set (see stayPayment.ts); other
// hosts are paid by bank transfer or their own method. To switch it on, set these in the environment:
//   STRIPE_SECRET_KEY       the account's secret key (test key while testing)
//   STRIPE_PRICE_T1_MONTHLY / STRIPE_PRICE_T1_YEARLY   prices for 1 to 3 listings (A$100 a month, A$1,100 a year)
//   STRIPE_PRICE_T2_MONTHLY / STRIPE_PRICE_T2_YEARLY   prices for 4 to 10 listings (A$200 a month, A$2,200 a year)
//   (the amounts live in src/lib/pricing.ts and must match the prices created in Stripe)
//   STRIPE_WEBHOOK_SECRET   the signing secret of the webhook endpoint
// Then in the Stripe dashboard add a webhook endpoint at <site>/api/stripe/webhook listening for:
//   checkout.session.completed, customer.subscription.created, customer.subscription.updated,
//   customer.subscription.deleted, invoice.paid, invoice.payment_failed
// and turn on the customer portal (so hosts can update a card or cancel).

export type Plan = "monthly" | "yearly";

const PRICE_ENV: Record<TierKey, Record<Plan, string>> = {
  T1: { monthly: "STRIPE_PRICE_T1_MONTHLY", yearly: "STRIPE_PRICE_T1_YEARLY" },
  T2: { monthly: "STRIPE_PRICE_T2_MONTHLY", yearly: "STRIPE_PRICE_T2_YEARLY" },
};

export function priceIdFor(tier: TierKey, plan: Plan) {
  return process.env[PRICE_ENV[tier][plan]];
}

/** Which of our plans a Stripe price belongs to, so the tier follows whatever the host pays for. */
export function tierFromPriceId(priceId: string | null | undefined): TierKey | null {
  if (!priceId) return null;
  for (const tier of HOST_TIERS) {
    if (priceIdFor(tier.key, "monthly") === priceId || priceIdFor(tier.key, "yearly") === priceId) {
      return tier.key;
    }
  }
  return null;
}

export function isBillingConfigured() {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    HOST_TIERS.every((t) => priceIdFor(t.key, "monthly") && priceIdFor(t.key, "yearly"))
  );
}

export function isWebhookConfigured() {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export { stripeClient };

const NOT_CONFIGURED = "Billing isn't switched on yet. Stripe has not been connected.";

async function customerFor(hostId: string) {
  const host = await prisma.host.findUnique({ where: { id: hostId } });
  if (!host) throw new Error("Host not found.");
  if (host.stripeCustomerId) return { host, customerId: host.stripeCustomerId };

  const customer = await stripeClient().customers.create({
    name: host.name,
    email: host.notificationEmail || host.publicEmail || undefined,
    metadata: { hostId: host.id },
  });
  await prisma.host.update({ where: { id: host.id }, data: { stripeCustomerId: customer.id } });
  return { host, customerId: customer.id };
}

/**
 * What free time a host gets when they subscribe:
 *  - "owner": the platform owner gave them a trial end date that is still comfortably ahead, so first payment waits for it
 *  - "freeMonth": the standard 30 days free, card entered now, first payment after. Once per host, and not for a host
 *    who has already had the Starting up tier.
 *  - "none": no free time; the first payment is taken straight away.
 * The subscription page uses this too, so what it promises matches what checkout does.
 */
export function trialTerms(host: {
  trialEndsAt: Date | null;
  trialUsedAt: Date | null;
  startingUpAt: Date | null;
}): { kind: "owner"; trialEnd: number } | { kind: "freeMonth"; days: number } | { kind: "none" } {
  // Stripe needs the trial end to be at least 48 hours away, so allow a little extra.
  if (host.trialEndsAt && host.trialEndsAt.getTime() > Date.now() + 72 * 60 * 60 * 1000) {
    return { kind: "owner", trialEnd: Math.floor(host.trialEndsAt.getTime() / 1000) };
  }
  if (!host.trialUsedAt && !host.startingUpAt) return { kind: "freeMonth", days: TRIAL_DAYS };
  return { kind: "none" };
}

/** A Stripe-hosted page where the host enters their card and starts the subscription. */
export async function createCheckoutSession(params: {
  hostId: string;
  plan: Plan;
}): Promise<{ url: string }> {
  if (!isBillingConfigured()) throw new Error(NOT_CONFIGURED);

  const { host, customerId } = await customerFor(params.hostId);
  if (host.subscriptionStatus === "COMPLIMENTARY") {
    throw new Error("These listings belong to the platform owner, so no subscription is needed.");
  }
  if (host.stripeSubscriptionId) {
    throw new Error("You already have a subscription. Use Manage billing to change or cancel it.");
  }

  // The plan is chosen by how many listings the host has (1 to 3, or 4 to 10).
  const listingCount = await prisma.listing.count({ where: { hostId: host.id } });
  const tier = tierForListingCount(listingCount);
  if (!tier) {
    throw new Error(
      "You have more than 10 listings, which needs a custom plan. Please contact us to arrange it."
    );
  }
  const price = priceIdFor(tier.key, params.plan);

  // Free time before the first payment (see trialTerms). The card is always collected now.
  const trial = trialTerms(host);

  const session = await stripeClient().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: host.id,
    line_items: [{ price, quantity: 1 }],
    allow_promotion_codes: true,
    payment_method_collection: "always",
    subscription_data: {
      metadata: { hostId: host.id },
      ...(trial.kind === "owner"
        ? { trial_end: trial.trialEnd }
        : trial.kind === "freeMonth"
          ? { trial_period_days: trial.days }
          : {}),
    },
    success_url: `${SITE_URL}/admin/subscription?checkout=success`,
    cancel_url: `${SITE_URL}/admin/subscription?checkout=cancelled`,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout address. Please try again.");
  return { url: session.url };
}

/** A Stripe-hosted page where the host updates their card, sees invoices or cancels. */
export async function createPortalSession(params: { hostId: string }): Promise<{ url: string }> {
  if (!isBillingConfigured()) throw new Error(NOT_CONFIGURED);

  const host = await prisma.host.findUnique({ where: { id: params.hostId } });
  if (!host?.stripeCustomerId) {
    throw new Error("There is no billing account to manage yet. Subscribe first.");
  }
  const session = await stripeClient().billingPortal.sessions.create({
    customer: host.stripeCustomerId,
    return_url: `${SITE_URL}/admin/subscription`,
    ...(process.env.STRIPE_PORTAL_CONFIG ? { configuration: process.env.STRIPE_PORTAL_CONFIG } : {}),
  });
  return { url: session.url };
}

// ---- Keeping each host's status in step with Stripe ----------------------------------------

type HostStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED";

/** What a Stripe subscription status means for Beeline. Unknown or in-between states change nothing. */
export function statusFromStripe(status: Stripe.Subscription.Status): HostStatus | null {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIAL";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
      return "CANCELLED";
    default:
      return null; // incomplete, paused
  }
}

function idOf(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : (value?.id ?? null);
}

async function findHost(customer: string | null, hostId?: string | null) {
  if (customer) {
    const byCustomer = await prisma.host.findFirst({ where: { stripeCustomerId: customer } });
    if (byCustomer) return byCustomer;
  }
  if (hostId) return prisma.host.findUnique({ where: { id: hostId } });
  return null;
}

async function applySubscription(sub: Stripe.Subscription) {
  const host = await findHost(idOf(sub.customer), sub.metadata?.hostId);
  // The platform owner's own listings are free and never driven by Stripe.
  if (!host || host.subscriptionStatus === "COMPLIMENTARY") return;

  const status = statusFromStripe(sub.status);
  if (!status) return;

  // Newer Stripe versions keep the period on the subscription item; older ones on the subscription.
  const periodEnd =
    sub.items?.data?.[0]?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;
  const ended = status === "CANCELLED";
  const tier = tierFromPriceId(sub.items?.data?.[0]?.price?.id);

  await prisma.host.update({
    where: { id: host.id },
    data: {
      subscriptionStatus: status,
      stripeCustomerId: idOf(sub.customer) ?? host.stripeCustomerId,
      stripeSubscriptionId: ended ? null : sub.id,
      planTier: ended ? null : (tier ?? host.planTier),
      subscriptionRenewsAt: !ended && periodEnd ? new Date(periodEnd * 1000) : null,
      ...(status === "TRIAL" && sub.trial_end ? { trialEndsAt: new Date(sub.trial_end * 1000) } : {}),
      // Remember that the free month has been given, so cancelling and re-subscribing does not earn another.
      ...(sub.trial_end && !host.trialUsedAt ? { trialUsedAt: new Date() } : {}),
    },
  });
}

/** Applies one event from Stripe. Safe to run twice: each one just sets the current state. */
export async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "payment") {
        // A guest paying for a stay by card.
        await recordCardPayment(session);
        return;
      }
      if (session.mode !== "subscription") return;
      const subId = idOf(session.subscription);
      if (!subId) return;
      const sub = await stripeClient().subscriptions.retrieve(subId);
      if (!sub.metadata?.hostId && session.client_reference_id) {
        sub.metadata = { ...sub.metadata, hostId: session.client_reference_id };
      }
      await applySubscription(sub);
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await applySubscription(event.data.object as Stripe.Subscription);
      return;
    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      // A free trial starts with a zero-dollar invoice; that is not a payment, so ignore it.
      if (event.type === "invoice.paid" && !(invoice.amount_paid > 0)) return;
      const customer = idOf(invoice.customer as string | { id: string } | null);
      const host = await findHost(customer);
      if (!host || host.subscriptionStatus === "COMPLIMENTARY") return;
      await prisma.host.update({
        where: { id: host.id },
        data: { subscriptionStatus: event.type === "invoice.paid" ? "ACTIVE" : "PAST_DUE" },
      });
      return;
    }
    default:
      return;
  }
}
