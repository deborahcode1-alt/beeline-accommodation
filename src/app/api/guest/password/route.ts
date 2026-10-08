import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getGuest, MIN_PASSWORD_LENGTH } from "@/lib/guestSession";

export async function POST(req: NextRequest) {
  const guest = await getGuest();
  if (!guest) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const current = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const next = typeof body?.newPassword === "string" ? body.newPassword : "";
  if (next.length < MIN_PASSWORD_LENGTH || next.length > 200) {
    return NextResponse.json(
      { error: `Your new password needs at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    );
  }
  if (!(await bcrypt.compare(current, guest.passwordHash))) {
    return NextResponse.json({ error: "Your current password is not right." }, { status: 400 });
  }
  await prisma.guest.update({
    where: { id: guest.id },
    data: { passwordHash: await bcrypt.hash(next, 10) },
  });
  return NextResponse.json({ ok: true });
}
