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
  for (let i = 0; i < 12; i++) out += chars[crypto.randomInt(chars.length)];
  return out;
}

// Owner-only: add a collaborator. They get full admin access (every host, listing and booking)
// through the same sign-in page, with their own password. The password is shown once.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!auth.ctx.isOwner) {
    return NextResponse.json({ error: "Only an owner can add collaborators" }, { status: 403 });
  }

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
    data: { email, passwordHash: await bcrypt.hash(password, 10), hostId: null },
  });
  return NextResponse.json({ email, password }, { status: 201 });
}
