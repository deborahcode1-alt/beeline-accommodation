import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calcTotalPrice, isRangeAvailable, nightsBetween } from "@/lib/availability";
import { notifyRescheduleRequested } from "@/lib/notifications";

const rescheduleSchema = z.object({
  checkIn: z.coerce.date(),
  checkOut: z.coerce.date(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await req.json().catch(() => null);
  const parsed = rescheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.booking.findUnique({
    where: { manageToken: token },
    include: { listing: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (existing.status === "CANCELLED" || existing.status === "DECLINED") {
    return NextResponse.json({ error: "This booking is no longer active" }, { status: 400 });
  }

  // Dates being held while the guest pays can't be changed, and a card-paid booking is final: changes go through the host.
  if (existing.holdExpiresAt && existing.paymentStatus !== "PAID") {
    return NextResponse.json(
      { error: "Finish paying to confirm these dates, or cancel and start a new booking." },
      { status: 400 }
    );
  }
  if (existing.paymentStatus === "PAID" && existing.paymentMethod === "CARD") {
    return NextResponse.json(
      { error: "Card payments are final. Please contact your host to ask about changing your dates." },
      { status: 400 }
    );
  }

  const { checkIn, checkOut } = parsed.data;
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < existing.listing.minNights) {
    return NextResponse.json(
      { error: `Minimum stay is ${existing.listing.minNights} night(s)` },
      { status: 400 }
    );
  }

  const available = await isRangeAvailable(existing.listingId, checkIn, checkOut, existing.id);
  if (!available) {
    return NextResponse.json({ error: "Those dates aren't available" }, { status: 409 });
  }

  const totalPrice = calcTotalPrice(existing.listing.basePrice, existing.listing.cleaningFee, nights);
  const previousDates = { checkIn: existing.checkIn, checkOut: existing.checkOut };

  const booking = await prisma.booking.update({
    where: { manageToken: token },
    data: { checkIn, checkOut, totalPrice, status: "PENDING" },
    include: { listing: { select: { id: true, name: true, hostId: true } } },
  });

  await notifyRescheduleRequested(booking, previousDates);

  return NextResponse.json({ booking });
}
