import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

const schema = z.object({ email: z.string().email().max(200) });

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[crypto.randomInt(chars.length)];
  return out;
}

// Platform owner only: create a sign-in for a host. The password is shown once, to the owner.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!auth.ctx.isOwner) {
    return NextResponse.json({ error: "Only the platform owner can add logins" }, { status: 403 });
  }
  const { id } = await params;

  const host = await prisma.host.findUnique({ where: { id } });
  if (!host) return NextResponse.json({ error: "Host not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();
  if (await prisma.adminUser.findUnique({ where: { email } })) {
    return NextResponse.json({ error: "That email already has a login" }, { status: 409 });
  }

  const password = generatePassword();
  await prisma.adminUser.create({
    data: { email, passwordHash: await bcrypt.hash(password, 10), hostId: id },
  });
  return NextResponse.json({ email, password }, { status: 201 });
}
