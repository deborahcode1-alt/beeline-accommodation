import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createGuestSession, destroyGuestSession, safeNext, MIN_PASSWORD_LENGTH } from "@/lib/guestSession";
import { destroySession } from "@/lib/session";

const schema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(200),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(200),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: `Enter your name, a valid email and a password of at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    );
  }
  const email = parsed.data.email.toLowerCase();

  // Host and owner emails can never be used for a guest account.
  const taken =
    (await prisma.adminUser.findUnique({ where: { email } })) ||
    (await prisma.guest.findUnique({ where: { email } }));
  if (taken) {
    return NextResponse.json(
      { error: "An account with that email already exists. Try signing in instead." },
      { status: 409 }
    );
  }

  const guest = await prisma.guest.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      lastLoginAt: new Date(),
    },
  });
  await destroySession();
  await destroyGuestSession();
  await createGuestSession(guest.id);
  return NextResponse.json(
    { ok: true, redirect: safeNext(body?.next, ["/account", "/manage", "/listings"]) ?? "/account" },
    { status: 201 }
  );
}
