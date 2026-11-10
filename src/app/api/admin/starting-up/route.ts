import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { SITE_URL } from "@/lib/site";
import { setStartingUpOffered } from "@/lib/settings";
import { isOnStartingUp } from "@/lib/startingUp";
import { sendStartingUpInviteEmail } from "@/lib/notifications";

// Owner only. Two things for the free Starting up tier:
//   setOffered: switch the option on or off for new hosts (hosts already on it keep their time)
//   invite:     email a host on the tier an invitation to subscribe
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("setOffered"), offered: z.boolean() }),
  z.object({ action: z.literal("invite"), hostId: z.string().min(1) }),
]);

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!auth.ctx.isOwner) return NextResponse.json({ error: "Owners only" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  if (parsed.data.action === "setOffered") {
    await setStartingUpOffered(parsed.data.offered);
    return NextResponse.json({ ok: true });
  }

  const host = await prisma.host.findUnique({
    where: { id: parsed.data.hostId },
    include: { adminUsers: { select: { email: true }, take: 1 } },
  });
  if (!host) return NextResponse.json({ error: "Host not found" }, { status: 404 });
  if (!isOnStartingUp(host)) {
    return NextResponse.json({ error: "That host is not on Starting up." }, { status: 400 });
  }
  const to = host.notificationEmail || host.adminUsers[0]?.email;
  if (!to) return NextResponse.json({ error: "That host has no email address on file." }, { status: 400 });

  const link = `${SITE_URL}/admin/subscription`;
  const emailed = await sendStartingUpInviteEmail({ to, name: host.name, endsAt: host.startingUpEndsAt, link }).catch(
    (err) => {
      console.error("Starting up invite email failed:", err);
      return false;
    }
  );
  if (!emailed) {
    return NextResponse.json({ error: "The email could not be sent. Check email is set up and try again." }, { status: 502 });
  }
  await prisma.host.update({ where: { id: host.id }, data: { startingUpInvitedAt: new Date() } });
  return NextResponse.json({ ok: true, sentTo: to });
}
