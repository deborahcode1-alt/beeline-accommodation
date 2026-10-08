import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGuest } from "@/lib/guestSession";
import { checkGuestCode, clearCode } from "@/lib/guestCodes";

export async function POST(req: NextRequest) {
  const guest = await getGuest();
  if (!guest) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : "";

  const result = await checkGuestCode(guest, code);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  // Verified: link every booking already made with this email to the account.
  await prisma.$transaction([
    prisma.guest.update({
      where: { id: guest.id },
      data: { emailVerifiedAt: new Date(), ...clearCode },
    }),
    prisma.booking.updateMany({
      where: {
        guestAccountId: null,
        guestEmail: { equals: guest.email, mode: "insensitive" },
      },
      data: { guestAccountId: guest.id },
    }),
  ]);
  return NextResponse.json({ ok: true });
}
