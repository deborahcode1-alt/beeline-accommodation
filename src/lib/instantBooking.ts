import { prisma } from "@/lib/prisma";
import { canTakeInstantBookings } from "@/lib/stayPaymentInfo";

// Instant booking confirms a stay straight away, and card payment is how a stay is secured up front, so a host
// can only switch instant booking on once their own Stripe account is connected.

export const INSTANT_BOOKING_NEEDS_CARDS =
  "Instant booking needs your own Stripe account connected. Connect it from the Payments tab first.";

/** A plain-language reason this host cannot use instant booking yet, or null when they can. */
export async function instantBookingProblem(hostId: string | null | undefined): Promise<string | null> {
  if (!hostId) return null; // a listing with no host is the platform's own; no rule to apply
  const host = await prisma.host.findUnique({ where: { id: hostId } });
  if (!host) return null;
  return canTakeInstantBookings(host) ? null : INSTANT_BOOKING_NEEDS_CARDS;
}
