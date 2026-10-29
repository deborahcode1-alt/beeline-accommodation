import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";
import { formatDate } from "@/lib/format";
import { stripeClient } from "@/lib/stripeClient";
import { notifyPaymentReceived, notifyTransferSent } from "@/lib/notifications";
import { bookingReference, cardPaymentsOn, cardSurcharge, surchargeLabel } from "@/lib/stayPaymentInfo";

// Paying for a stay by card. The guest is sent to a Stripe-hosted page, where the invoice shows the
// stay and a separate "card payment surcharge" line. Stripe tells us (webhook) when it is paid, and the
// manage page also checks on return, so the booking is marked paid either way.

const bookingInclude = { listing: { select: { id: true, name: true, hostId: true } } } as const;

function idOf(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : (value?.id ?? null);
}

/** A Stripe-hosted card payment page for one stay. Throws a plain-language message when it can't be offered. */
export async function createStayCheckout(token: string): Promise<{ url: string }> {
  const booking = await prisma.booking.findUnique({
    where: { manageToken: token },
    include: { listing: { include: { host: true } } },
  });
  if (!booking) throw new Error("We couldn't find that booking.");
  if (booking.status !== "CONFIRMED") throw new Error("You can pay once the host has confirmed your booking.");
  if (booking.paymentStatus === "PAID") throw new Error("This booking is already paid. Thank you!");
  if (!cardPaymentsOn(booking.listing.host)) {
    throw new Error("Card payment isn't available for this stay. Please pay by bank transfer.");
  }

  const total = booking.totalPrice;
  const surcharge = cardSurcharge(total);
  const ref = bookingReference(booking.id);
  const dates = `${formatDate(booking.checkIn)} to ${formatDate(booking.checkOut)}`;

  const session = await stripeClient().checkout.sessions.create({
    mode: "payment",
    customer_email: booking.guestEmail,
    client_reference_id: booking.id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "aud",
          unit_amount: Math.round(total * 100),
          product_data: {
            name: `Stay at ${booking.listing.name}`,
            description: `${dates}. Reference ${ref}`,
          },
        },
      },
      {
        quantity: 1,
        price_data: {
          currency: "aud",
          unit_amount: Math.round(surcharge * 100),
          product_data: {
            name: "Card payment surcharge",
            description: `${surchargeLabel()}. Pay by bank transfer to avoid this.`,
          },
        },
      },
    ],
    payment_intent_data: {
      description: `Stay at ${booking.listing.name}, ${dates} (${ref})`,
      receipt_email: booking.guestEmail,
      metadata: { bookingId: booking.id, reference: ref },
    },
    invoice_creation: {
      enabled: true,
      invoice_data: {
        description: `Stay at ${booking.listing.name}, ${dates}. Reference ${ref}.`,
        metadata: { bookingId: booking.id, reference: ref },
      },
    },
    metadata: { bookingId: booking.id, reference: ref, surchargeCents: String(Math.round(surcharge * 100)) },
    success_url: `${SITE_URL}/manage/${token}?paid=card&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/manage/${token}?paid=cancelled`,
  });

  if (!session.url) throw new Error("Stripe did not return a payment address. Please try again.");
  return { url: session.url };
}

/** Marks a booking paid by card. Safe to run twice (the webhook and the return page both call it). */
export async function recordCardPayment(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId ?? session.client_reference_id;
  if (!bookingId || session.payment_status !== "paid") return;

  const amount = (session.amount_total ?? 0) / 100;
  const surcharge = Number(session.metadata?.surchargeCents ?? 0) / 100;

  // Only the first caller flips the booking, so the receipt emails go out once.
  const changed = await prisma.booking.updateMany({
    where: { id: bookingId, paymentStatus: { not: "PAID" } },
    data: {
      paymentStatus: "PAID",
      paymentMethod: "CARD",
      cardSurcharge: surcharge,
      amountPaid: amount,
      paidAt: new Date(),
      stripePaymentIntentId: idOf(session.payment_intent),
    },
  });
  if (changed.count === 0) return;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: bookingInclude });
  if (booking) await notifyPaymentReceived(booking, { amount, surcharge });
}

/** Called when the guest lands back on the manage page: asks Stripe directly in case the webhook is slow. */
export async function confirmCheckoutSession(token: string, sessionId: string) {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId) || !process.env.STRIPE_SECRET_KEY) return;
  const booking = await prisma.booking.findUnique({ where: { manageToken: token }, select: { id: true } });
  if (!booking) return;
  try {
    const session = await stripeClient().checkout.sessions.retrieve(sessionId);
    if (session.metadata?.bookingId !== booking.id) return; // a session for some other booking
    await recordCardPayment(session);
  } catch (err) {
    console.error("could not confirm checkout session:", err);
  }
}

/** The guest says they have sent a bank transfer: tell the host to look out for it. */
export async function markTransferSent(token: string) {
  const booking = await prisma.booking.findUnique({ where: { manageToken: token }, include: bookingInclude });
  if (!booking) throw new Error("We couldn't find that booking.");
  if (booking.paymentStatus === "PAID") return;
  if (booking.transferNotifiedAt) return; // already told the host
  await prisma.booking.update({
    where: { id: booking.id },
    data: { transferNotifiedAt: new Date(), paymentMethod: "BANK" },
  });
  await notifyTransferSent(booking);
}
