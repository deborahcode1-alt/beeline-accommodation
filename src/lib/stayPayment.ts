import type Stripe from "stripe";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";
import { formatDate } from "@/lib/format";
import { stripeClient } from "@/lib/stripeClient";
import {
  notifyInstantBooking,
  notifyPaidAfterRelease,
  notifyPaymentReceived,
  notifyTransferSent,
} from "@/lib/notifications";
import { isRangeAvailable } from "@/lib/availability";
import { releaseHoldIfExpired } from "@/lib/holds";
import {
  bookingReference,
  cardPaymentsOn,
  cardSurcharge,
  paysIntoOwnStripe,
  surchargeLabel,
} from "@/lib/stayPaymentInfo";

// Paying for a stay by card. The guest is sent to a Stripe-hosted page, where the invoice shows the
// stay and a separate "service fee" line. Stripe tells us (webhook) when it is paid, and the
// manage page also checks on return, so the booking is marked paid either way.

const bookingInclude = { listing: { select: { id: true, name: true, hostId: true } } } as const;

function idOf(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : (value?.id ?? null);
}

/** A Stripe-hosted card payment page for one stay. Throws a plain-language message when it can't be offered. */
export async function createStayCheckout(token: string, agreedToCardTerms: boolean): Promise<{ url: string }> {
  const booking = await prisma.booking.findUnique({
    where: { manageToken: token },
    include: { listing: { include: { host: true } } },
  });
  if (!booking) throw new Error("We couldn't find that booking.");
  if (booking.paymentStatus === "PAID") throw new Error("This booking is already paid. Thank you!");
  // A payment hold (instant booking, paid at booking) can be paid while it lasts. Once it has run out the dates are
  // released, so the guest has to book again.
  const wasHold = !!booking.holdExpiresAt;
  if (wasHold && (booking.status !== "PENDING" || booking.holdExpiresAt! <= new Date())) {
    await releaseHoldIfExpired(booking.id);
    throw new Error("Your 30 minute hold has ended and the dates were released. Please book again.");
  }
  if (!wasHold && booking.status !== "CONFIRMED") {
    throw new Error("You can pay once the host has confirmed your booking.");
  }
  if (!cardPaymentsOn(booking.listing.host)) {
    throw new Error("Card payment isn't available for this stay. Please pay by bank transfer.");
  }
  // The guest must have accepted the cancellation and refund terms before paying. The time is kept as proof.
  if (!agreedToCardTerms) {
    throw new Error("Please tick the box to accept the host's cancellation policy.");
  }
  await prisma.booking.update({ where: { id: booking.id }, data: { cardTermsAgreedAt: new Date() } });

  // A host with their own linked Stripe account is paid there directly (a "direct charge"). Otherwise the
  // payment goes through the main account, as it always has.
  const hostAccount = paysIntoOwnStripe(booking.listing.host) ? (booking.listing.host?.stripeAccountId ?? null) : null;

  const total = booking.totalPrice;
  const surcharge = cardSurcharge(total);
  const ref = bookingReference(booking.id);
  const dates = `${formatDate(booking.checkIn)} to ${formatDate(booking.checkOut)}`;

  const session = await stripeClient().checkout.sessions.create(
    {
    mode: "payment",
    // The payment page lapses with the hold. Stripe needs at least 30 minutes, so it can run a little past the hold,
    // and a payment that lands after the hold is handled when it arrives (see settlePaidHold).
    ...(wasHold
      ? { expires_at: Math.floor(Math.max(booking.holdExpiresAt!.getTime(), Date.now() + 31 * 60 * 1000) / 1000) }
      : {}),
    // Cards only (Apple Pay and Google Pay run on cards). The service fee is sized to the card fee, and
    // buy-now-pay-later methods the live account switches on cost more than that.
    allowed_payment_method_types: ["card"],
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
            name: "Service fee",
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
    },
    hostAccount ? { stripeAccount: hostAccount } : undefined
  );

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
  if (!booking) return;

  // Pay at booking: this payment is what confirms the held dates. If the hold had run out and the dates were taken
  // meanwhile, the guest is refunded instead.
  if (booking.holdExpiresAt) {
    if ((await settlePaidHold(booking)) === "refunded") return;
    await notifyInstantBooking(booking);
  }
  await notifyPaymentReceived(booking, { amount, surcharge });
}

type BookingRow = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;

/** Refunds a card payment in full, on the host's own Stripe account when that is where it was taken. */
async function refundCardPayment(bookingId: string): Promise<boolean> {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { listing: { include: { host: true } } },
  });
  if (!b?.stripePaymentIntentId) return false;
  const account = paysIntoOwnStripe(b.listing.host) ? b.listing.host?.stripeAccountId : null;
  try {
    await stripeClient().refunds.create(
      { payment_intent: b.stripePaymentIntentId },
      account ? { stripeAccount: account } : undefined
    );
    return true;
  } catch (err) {
    console.error("Automatic refund failed:", bookingId, err);
    return false;
  }
}

/**
 * A held booking has just been paid. If its dates are still free, confirm it. If the hold had run out and someone
 * else took the dates, refund the guest and tell them and the host.
 */
async function settlePaidHold(booking: BookingRow): Promise<"confirmed" | "refunded"> {
  const stillFree = await isRangeAvailable(booking.listingId, booking.checkIn, booking.checkOut, booking.id);
  if (stillFree) {
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "CONFIRMED", holdExpiresAt: null } });
    return "confirmed";
  }
  const refunded = await refundCardPayment(booking.id);
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED", ...(refunded ? { paymentStatus: "REFUNDED" } : {}) },
  });
  await notifyPaidAfterRelease(booking, refunded);
  return "refunded";
}

/** Called when the guest lands back on the manage page: asks Stripe directly in case the webhook is slow. */
export async function confirmCheckoutSession(token: string, sessionId: string) {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId) || !process.env.STRIPE_SECRET_KEY) return;
  const booking = await prisma.booking.findUnique({
    where: { manageToken: token },
    select: { id: true, listing: { select: { host: { select: { stripeAccountId: true, stripeChargesEnabled: true, acceptsCardPayments: true } } } } },
  });
  if (!booking) return;
  // The payment lives on the host's own Stripe account when they have linked one.
  const hostAccount = paysIntoOwnStripe(booking.listing.host) ? booking.listing.host?.stripeAccountId : null;
  try {
    const session = await stripeClient().checkout.sessions.retrieve(
      sessionId,
      {},
      hostAccount ? { stripeAccount: hostAccount } : undefined
    );
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
