import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isSmsConfigured, sendSms, bookingConfirmationMessage } from "@/lib/sms";
import { SITE_NAME } from "@/lib/site";
import { requireBookingAccess } from "@/lib/adminAuth";

function draftMessage(booking: {
  guestName: string;
  checkIn: Date;
  checkOut: Date;
  listing: { name: string };
}) {
  return bookingConfirmationMessage({
    guestName: booking.guestName,
    listingName: booking.listing.name,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    siteName: SITE_NAME,
  });
}

// GET: the text message as it would be sent, so the host can read it first.
export async function GET(
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
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  return NextResponse.json({
    to: booking.guestPhone,
    message: draftMessage(booking),
    configured: isSmsConfigured(),
  });
}

const sendSchema = z.object({ message: z.string().trim().min(1).max(1000).optional() });

// POST: send the text, using the host's edited wording when provided.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await requireBookingAccess(id);
  if (access.error) return access.error;

  const parsed = sendSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "The message is empty or too long." }, { status: 400 });
  }

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

  const message = parsed.data.message ?? draftMessage(booking);

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
