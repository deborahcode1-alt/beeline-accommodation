import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSmsConfigured, sendSms, bookingConfirmationMessage } from "@/lib/sms";
import { SITE_NAME } from "@/lib/site";
import { requireBookingAccess } from "@/lib/adminAuth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await requireBookingAccess(id);
  if (access.error) return access.error;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { listing: { select: { name: true } } },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (!booking.guestPhone) {
    return NextResponse.json({ error: "This guest didn't provide a phone number" }, { status: 400 });
  }
  if (!isSmsConfigured()) {
    return NextResponse.json(
      { error: "Texting isn't set up yet — add Twilio credentials to enable it." },
      { status: 400 }
    );
  }

  const message = bookingConfirmationMessage({
    guestName: booking.guestName,
    listingName: booking.listing.name,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    siteName: SITE_NAME,
  });

  try {
    await sendSms(booking.guestPhone, message);
  } catch (err) {
    const messageText = err instanceof Error ? err.message : "Failed to send text";
    return NextResponse.json({ error: messageText }, { status: 502 });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { confirmationTextSentAt: new Date() },
  });

  return NextResponse.json({ booking: updated });
}
