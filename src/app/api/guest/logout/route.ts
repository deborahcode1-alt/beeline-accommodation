import { NextResponse } from "next/server";
import { destroyGuestSession } from "@/lib/guestSession";

export async function POST() {
  await destroyGuestSession();
  return NextResponse.json({ ok: true });
}
