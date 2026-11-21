import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HOLD_MINUTES, cardPaymentsOn } from "@/lib/stayPaymentInfo";

export { HOLD_MINUTES };

// Pay at booking. An instant listing whose host can take card payments does not confirm a booking until it is
// paid. The booking is created as a "hold": PENDING with an expiry. It blocks the dates for HOLD_MINUTES while the
// guest pays by card. Paid in time: it is confirmed. Not paid: the hold lapses and the dates are free again.
// Hosts never see an unpaid hold, so they cannot confirm an unpaid booking by mistake.

export function holdExpiry(from = new Date()) {
  return new Date(from.getTime() + HOLD_MINUTES * 60 * 1000);
}

/** Whether a booking on this listing is paid for at the moment of booking. */
export function takesPaymentAtBooking(
  listing: { bookingMode: string },
  host: Parameters<typeof cardPaymentsOn>[0]
) {
  return listing.bookingMode === "INSTANT" && cardPaymentsOn(host);
}

/**
 * Prisma filter for bookings that block dates: confirmed ones, and pending ones except a payment hold that has
 * run out. Use it anywhere dates are checked, so an expired hold frees its dates straight away.
 */
export function blockingBookingWhere(now = new Date()): Prisma.BookingWhereInput {
  return {
    OR: [
      { status: "CONFIRMED" },
      { status: "PENDING", OR: [{ holdExpiresAt: null }, { holdExpiresAt: { gt: now } }] },
    ],
  };
}

/** If this booking was a payment hold that has run out unpaid, cancel it. Returns true when it was released. */
export async function releaseHoldIfExpired(bookingId: string): Promise<boolean> {
  const released = await prisma.booking.updateMany({
    where: {
      id: bookingId,
      status: "PENDING",
      paymentStatus: "UNPAID",
      holdExpiresAt: { lte: new Date() },
    },
    data: { status: "CANCELLED" },
  });
  return released.count > 0;
}

/** Cancels every payment hold that has run out. The dates were already free; this tidies the records. */
export async function releaseExpiredHolds() {
  try {
    await prisma.booking.updateMany({
      where: { status: "PENDING", paymentStatus: "UNPAID", holdExpiresAt: { lte: new Date() } },
      data: { status: "CANCELLED" },
    });
  } catch (err) {
    console.error("Could not release expired holds:", err);
  }
}
