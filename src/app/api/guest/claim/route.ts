import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGuest } from "@/lib/guestSession";

// Add a stay to the signed-in guest's account. Having the booking's private manage link is the
// proof that it is theirs, so this works even before their email is verified.
export async function POST(req: NextRequest) {
  const guest = await getGuest();
  if (!guest) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const booking = token ? await prisma.booking.findUnique({ where: { manageToken: token } }) : null;
  if (!booking) return NextResponse.json({ error: "Stay not found" }, { status: 404 });
  if (booking.guestAccountId && booking.guestAccountId !== guest.id) {
    return NextResponse.json({ error: "That stay is already on another account." }, { status: 409 });
  }
  await prisma.booking.update({ where: { id: booking.id }, data: { guestAccountId: guest.id } });
  return NextResponse.json({ ok: true });
}
