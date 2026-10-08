import { NextResponse } from "next/server";
import { getGuest } from "@/lib/guestSession";
import { sendGuestCode } from "@/lib/guestCodes";

export async function POST() {
  const guest = await getGuest();
  if (!guest) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  if (guest.emailVerifiedAt) return NextResponse.json({ ok: true, alreadyVerified: true });
  try {
    await sendGuestCode(guest, "verify");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not send the code";
    return NextResponse.json({ error: message }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
