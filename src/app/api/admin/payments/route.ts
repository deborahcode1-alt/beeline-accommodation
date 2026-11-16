import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { connectOnboardingUrl } from "@/lib/connect";

// A host starts linking (or finishes linking) their own Stripe account. Returns the Stripe page to send them to.
export async function POST() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!auth.ctx.hostId) {
    return NextResponse.json({ error: "Only hosts link a Stripe account." }, { status: 400 });
  }
  try {
    const url = await connectOnboardingUrl(auth.ctx.hostId);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Stripe connect start failed:", err);
    const message = err instanceof Error ? err.message : "Could not start the Stripe set-up.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
