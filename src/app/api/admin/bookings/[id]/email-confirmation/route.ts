import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { confirmationEmailContent } from "@/lib/notifications";
import { requireBookingAccess } from "@/lib/adminAuth";

const include = { listing: { select: { id: true, name: true, hostId: true } } } as const;

// GET: the draft email, so the host can read it (and add to it) before anything is sent.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await requireBookingAccess(id);
  if (access.error) return access.error;

  const booking = await prisma.booking.findUnique({ where: { id }, include });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const { subject, text } = confirmationEmailContent(booking);
  return NextResponse.json({
    to: booking.guestEmail,
    subject,
    text,
    configured: isEmailConfigured(),
  });
}

const sendSchema = z.object({
  subject: z.string().trim().min(1).max(200).optional(),
  text: z.string().trim().min(1).max(10000).optional(),
});

// POST: send the email, using the host's edited subject and body when provided.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await requireBookingAccess(id);
  if (access.error) return access.error;

  const parsed = sendSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "The subject or message is empty or too long." }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id }, include });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "Email isn't set up yet — add Resend credentials to enable it." },
      { status: 400 }
    );
  }

  const draft = confirmationEmailContent(booking);
  const subject = parsed.data.subject ?? draft.subject;
  const text = parsed.data.text ?? draft.text;

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
