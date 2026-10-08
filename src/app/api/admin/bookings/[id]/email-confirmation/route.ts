import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { confirmationEmailContent } from "@/lib/notifications";
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
    include: { listing: { select: { id: true, name: true, hostId: true } } },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "Email isn't set up yet — add Resend credentials to enable it." },
      { status: 400 }
    );
  }

  const { subject, text } = confirmationEmailContent(booking);

  try {
    await sendEmail({ to: booking.guestEmail, subject, text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { confirmationEmailSentAt: new Date() },
  });

  return NextResponse.json({ booking: updated });
}
