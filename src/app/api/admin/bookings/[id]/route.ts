import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calcTotalPrice, isRangeAvailable, nightsBetween } from "@/lib/availability";
import { notifyBookingConfirmed, notifyBookingDeclined } from "@/lib/notifications";
import { requireBookingAccess } from "@/lib/adminAuth";

const patchSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "DECLINED", "CANCELLED"]).optional(),
  paymentStatus: z.enum(["UNPAID", "PAID", "REFUNDED"]).optional(),
  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional(),
  guests: z.coerce.number().int().min(1).max(50).optional(),
  guestName: z.string().min(1).max(200).optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().max(50).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await requireBookingAccess(id);
  if (access.error) return access.error;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.booking.findUnique({ where: { id }, include: { listing: true } });
  if (!existing) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (data.guestName !== undefined) updateData.guestName = data.guestName;
  if (data.guestEmail !== undefined) updateData.guestEmail = data.guestEmail;
  if (data.guestPhone !== undefined) updateData.guestPhone = data.guestPhone;
  if (data.message !== undefined) updateData.message = data.message;
  if (data.guests !== undefined) updateData.guests = data.guests;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;

  const datesChanged = data.checkIn !== undefined || data.checkOut !== undefined;
  if (datesChanged) {
    const checkIn = data.checkIn ?? existing.checkIn;
    const checkOut = data.checkOut ?? existing.checkOut;
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
    updateData.checkIn = checkIn;
    updateData.checkOut = checkOut;
    updateData.totalPrice = calcTotalPrice(existing.listing.basePrice, existing.listing.cleaningFee, nights);
  }

  const booking = await prisma.booking.update({
    where: { id },
    data: updateData,
    include: { listing: { select: { id: true, name: true, hostId: true } } },
  });

  if (data.status !== undefined && data.status !== existing.status) {
    if (data.status === "CONFIRMED") await notifyBookingConfirmed(booking);
    else if (data.status === "DECLINED") await notifyBookingDeclined(booking);
  }

  return NextResponse.json({ booking });
}
