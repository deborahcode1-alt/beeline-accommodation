import { NextResponse } from "next/server";
import { getGuest } from "@/lib/guestSession";
import { sendGuestCode } from "@/lib/guestCodes";
import { rateLimit } from "@/lib/rateLimit";

export async function POST() {
  const guest = await getGuest();
  if (!guest) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  if (guest.emailVerifiedAt) return NextResponse.json({ ok: true, alreadyVerified: true });
  const blocked = await rateLimit(
    [{ name: "verify-send", subject: guest.id, limit: 5, windowSeconds: 60 * 60 }],
    "A few codes have already been sent. Please check your email, or try again in a while."
  );
  if (blocked) return blocked;
  try {
    await sendGuestCode(guest, "verify");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not send the code";
    return NextResponse.json({ error: message }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
