import { prisma } from "@/lib/prisma";
import { cardPaymentsOn } from "@/lib/stayPaymentInfo";

// Instant booking confirms a stay straight away, and card payment is how a stay is secured up front, so a host
// can only switch instant booking on once they can take card payments (a connected Stripe account).

export const INSTANT_BOOKING_NEEDS_CARDS =
  "Instant booking needs card payments switched on. Connect your Stripe account from the Payments tab first.";

/** A plain-language reason this host cannot use instant booking yet, or null when they can. */
export async function instantBookingProblem(hostId: string | null | undefined): Promise<string | null> {
  if (!hostId) return null; // a listing with no host is the platform's own; no rule to apply
  const host = await prisma.host.findUnique({ where: { id: hostId } });
  if (!host) return null;
  return cardPaymentsOn(host) ? null : INSTANT_BOOKING_NEEDS_CARDS;
}
