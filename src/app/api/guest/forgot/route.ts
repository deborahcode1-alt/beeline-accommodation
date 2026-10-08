import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendGuestCode, checkGuestCode, clearCode } from "@/lib/guestCodes";
import { MIN_PASSWORD_LENGTH } from "@/lib/guestSession";

// Step 1 (POST {email}): email a reset code. Always answers the same, so it can't be used to
// discover which emails have accounts.
// Step 2 (POST {email, code, newPassword}): set the new password.
const resetSchema = z.object({
  email: z.string().trim().email(),
  code: z.string().min(1),
  newPassword: z.string().min(MIN_PASSWORD_LENGTH).max(200),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (body && typeof body.code === "string") {
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: `Enter the code and a new password of at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 }
      );
    }
    const guest = await prisma.guest.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (!guest) return NextResponse.json({ error: "That code is not right." }, { status: 400 });
    const result = await checkGuestCode(guest, parsed.data.code);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    await prisma.guest.update({
      where: { id: guest.id },
      data: {
        passwordHash: await bcrypt.hash(parsed.data.newPassword, 10),
        failedLogins: 0,
        lockedUntil: null,
        ...clearCode,
      },
    });
    return NextResponse.json({ ok: true });
  }

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ error: "Enter your email." }, { status: 400 });
  const guest = await prisma.guest.findUnique({ where: { email } });
  if (guest) {
    try {
      await sendGuestCode(guest, "reset");
    } catch (err) {
      console.error("Guest reset code failed:", err);
    }
  }
  return NextResponse.json({ ok: true });
}
