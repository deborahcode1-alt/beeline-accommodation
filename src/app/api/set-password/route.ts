import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { destroyGuestSession } from "@/lib/guestSession";
import { findInvitedLogin } from "@/lib/hostInvite";

const schema = z.object({ token: z.string().min(1).max(200), password: z.string().min(8).max(200) });

// A newly approved host chooses their own password from the emailed link, then lands signed in.
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please choose a password of at least 8 characters." }, { status: 400 });
  }
  const login = await findInvitedLogin(parsed.data.token);
  if (!login) {
    return NextResponse.json(
      { error: "This link has expired or has already been used. Ask us to send you a new one." },
      { status: 400 }
    );
  }
  await prisma.adminUser.update({
    where: { id: login.id },
    data: {
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      inviteTokenHash: null,
      inviteExpiresAt: null,
    },
  });
  await destroyGuestSession();
  await createSession(login.email);
  return NextResponse.json({ ok: true, redirect: "/admin/get-live" });
}
