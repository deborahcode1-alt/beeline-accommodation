import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { createInviteLink, unusablePasswordHash } from "@/lib/hostInvite";
import { sendEnquiryDeclinedEmail, sendHostInviteEmail } from "@/lib/notifications";

// Owner only. One endpoint for the three things you can do with a host request:
//   approve: creates the host and their login, and emails them a link to set their password
//   resend:  a fresh set-password link for an already-approved request
//   decline: marks it declined, optionally with a polite email
const schema = z.object({
  action: z.enum(["approve", "resend", "decline"]),
  sendEmail: z.boolean().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!auth.ctx.isOwner) return NextResponse.json({ error: "Owners only" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  const { id } = await params;
  const enquiry = await prisma.hostEnquiry.findUnique({ where: { id } });
  if (!enquiry) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  const email = enquiry.email.trim().toLowerCase();

  if (parsed.data.action === "decline") {
    if (enquiry.status === "APPROVED") {
      return NextResponse.json({ error: "This one is already approved." }, { status: 400 });
    }
    await prisma.hostEnquiry.update({ where: { id }, data: { status: "DECLINED", handledAt: new Date() } });
    if (parsed.data.sendEmail) await sendEnquiryDeclinedEmail({ to: email, name: enquiry.name });
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "resend") {
    const login = enquiry.hostId
      ? await prisma.adminUser.findFirst({ where: { hostId: enquiry.hostId }, select: { id: true } })
      : null;
    if (!login) return NextResponse.json({ error: "There is no login to send an invite for." }, { status: 400 });
    const link = await createInviteLink(login.id);
    const emailed = await sendHostInviteEmail({ to: email, name: enquiry.name, link }).catch(() => false);
    return NextResponse.json({ ok: true, emailed, ...(emailed ? {} : { inviteLink: link }) });
  }

  // approve
  if (enquiry.status === "APPROVED") {
    return NextResponse.json({ error: "This one is already approved." }, { status: 400 });
  }
  const [existingAdmin, existingGuest] = await Promise.all([
    prisma.adminUser.findUnique({ where: { email }, select: { id: true } }),
    prisma.guest.findUnique({ where: { email }, select: { id: true } }),
  ]);
  if (existingAdmin) {
    return NextResponse.json({ error: "That email already has an admin login." }, { status: 400 });
  }
  if (existingGuest) {
    return NextResponse.json(
      { error: "That email already has a guest account. Ask them for a different email for their host account." },
      { status: 400 }
    );
  }

  const passwordHash = await unusablePasswordHash();
  const { host, login } = await prisma.$transaction(async (tx) => {
    const host = await tx.host.create({
      data: { name: enquiry.name, notificationEmail: email, notificationPhone: enquiry.phone ?? null },
    });
    const login = await tx.adminUser.create({ data: { email, passwordHash, hostId: host.id } });
    await tx.hostEnquiry.update({
      where: { id },
      data: { status: "APPROVED", hostId: host.id, handledAt: new Date() },
    });
    return { host, login };
  });

  const link = await createInviteLink(login.id);
  const emailed = await sendHostInviteEmail({ to: email, name: enquiry.name, link }).catch((err) => {
    console.error("host invite email failed:", err);
    return false;
  });
  return NextResponse.json({ ok: true, hostId: host.id, emailed, ...(emailed ? {} : { inviteLink: link }) });
}
