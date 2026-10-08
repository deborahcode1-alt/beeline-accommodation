import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";
import {
  createGuestSession,
  destroyGuestSession,
  safeNext,
  MAX_FAILED_LOGINS,
  LOCK_MINUTES,
} from "@/lib/guestSession";

// One sign-in for everyone. Owners, collaborators and hosts go to the admin area; guests go to
// their stays. The response never says which kind of account an email belongs to.
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.4KuJ3dZ9uYyYV3tq0Zr3uCq1XQ2W";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }
  const failure = () =>
    NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });

  // 1. Owner, collaborator or host.
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (admin) {
    if (!(await bcrypt.compare(password, admin.passwordHash))) return failure();
    await destroyGuestSession();
    await createSession(admin.email);
    return NextResponse.json({
      ok: true,
      role: admin.hostId ? "host" : "owner",
      redirect: safeNext(body?.next, ["/admin"]) ?? "/admin",
    });
  }

  // 2. Guest.
  const guest = await prisma.guest.findUnique({ where: { email } });
  if (!guest) {
    await bcrypt.compare(password, DUMMY_HASH); // keep timing similar for unknown emails
    return failure();
  }
  if (guest.lockedUntil && guest.lockedUntil > new Date()) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again in a few minutes." },
      { status: 429 }
    );
  }
  if (!(await bcrypt.compare(password, guest.passwordHash))) {
    const failed = guest.failedLogins + 1;
    await prisma.guest.update({
      where: { id: guest.id },
      data:
        failed >= MAX_FAILED_LOGINS
          ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000) }
          : { failedLogins: failed },
    });
    return failure();
  }

  await prisma.guest.update({ where: { id: guest.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
  await destroySession();
  await createGuestSession(guest.id);
  return NextResponse.json({
    ok: true,
    role: "guest",
    redirect: safeNext(body?.next, ["/account", "/manage", "/listings"]) ?? "/account",
  });
}
