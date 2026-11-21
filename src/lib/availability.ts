import { prisma } from "@/lib/prisma";
import { blockingBookingWhere } from "@/lib/holds";

export function toDateOnly(d: Date | string) {
  const date = new Date(d);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function nightsBetween(checkIn: Date, checkOut: Date) {
  const ms = toDateOnly(checkOut).getTime() - toDateOnly(checkIn).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function eachNight(checkIn: Date, checkOut: Date): Date[] {
  const nights: Date[] = [];
  const cursor = toDateOnly(checkIn);
  const end = toDateOnly(checkOut);
  while (cursor < end) {
    nights.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return nights;
}

// Set of ISO "YYYY-MM-DD" nights that are already taken for a listing
// (an occupied "night" is the night starting on that date, i.e. checkIn <= night < checkOut).
// Pass excludeBookingId when checking availability for a guest changing their own
// existing booking, so their current dates don't block them from keeping/shifting them.
export async function getUnavailableNights(
  listingId: string,
  excludeBookingId?: string
): Promise<Set<string>> {
  const [bookings, blocked] = await Promise.all([
    prisma.booking.findMany({
      where: {
        listingId,
        // Confirmed and pending bookings take the dates. A payment hold that has run out does not.
        ...blockingBookingWhere(),
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
      select: { checkIn: true, checkOut: true },
    }),
    prisma.blockedDate.findMany({
      where: { listingId },
      select: { date: true },
    }),
  ]);

  const nights = new Set<string>();
  for (const b of bookings) {
    for (const n of eachNight(b.checkIn, b.checkOut)) {
      nights.add(n.toISOString().slice(0, 10));
    }
  }
  for (const b of blocked) {
    nights.add(toDateOnly(b.date).toISOString().slice(0, 10));
  }
  return nights;
}

export async function isRangeAvailable(
  listingId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string
) {
  const unavailable = await getUnavailableNights(listingId, excludeBookingId);
  return eachNight(checkIn, checkOut).every(
    (n) => !unavailable.has(n.toISOString().slice(0, 10))
  );
}

export function calcTotalPrice(basePrice: number, cleaningFee: number, nights: number) {
  return Math.round((basePrice * nights + cleaningFee) * 100) / 100;
}
