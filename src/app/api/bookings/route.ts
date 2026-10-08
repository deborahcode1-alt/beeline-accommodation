import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { publicListingWhere } from "@/lib/visibility";
import { calcTotalPrice, isRangeAvailable, nightsBetween } from "@/lib/availability";
import { notifyNewBooking, notifyInstantBooking } from "@/lib/notifications";

const bookingSchema = z.object({
  listingId: z.string().min(1),
  guestName: z.string().min(1).max(200),
  guestEmail: z.string().email(),
  guestPhone: z.string().max(50).optional(),
  checkIn: z.coerce.date(),
  checkOut: z.coerce.date(),
  guests: z.coerce.number().int().min(1).max(50),
  message: z.string().max(2000).optional(),
  agreedToTerms: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const listing = await prisma.listing.findFirst({
    where: { id: data.listingId, ...publicListingWhere() },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const nights = nightsBetween(data.checkIn, data.checkOut);
  if (nights < listing.minNights) {
    return NextResponse.json(
      { error: `Minimum stay is ${listing.minNights} night(s)` },
      { status: 400 }
    );
  }
  if (data.guests > listing.maxGuests) {
    return NextResponse.json(
      { error: `This listing sleeps a maximum of ${listing.maxGuests} guests` },
      { status: 400 }
    );
  }

  const available = await isRangeAvailable(listing.id, data.checkIn, data.checkOut);
  if (!available) {
    return NextResponse.json(
      { error: "Selected dates are no longer available" },
      { status: 409 }
    );
  }

  const totalPrice = calcTotalPrice(listing.basePrice, listing.cleaningFee, nights);

  const booking = await prisma.booking.create({
    data: {
      listingId: listing.id,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: data.guests,
      message: data.message,
      totalPrice,
      // Hosts choose per listing: confirm straight away, or review each request.
      status: listing.bookingMode === "INSTANT" ? "CONFIRMED" : "PENDING",
      agreedToTerms: data.agreedToTerms,
    },
    include: { listing: { select: { id: true, name: true, hostId: true } } },
  });

  if (booking.status === "CONFIRMED") await notifyInstantBooking(booking);
  else await notifyNewBooking(booking);

  return NextResponse.json({ booking }, { status: 201 });
}
