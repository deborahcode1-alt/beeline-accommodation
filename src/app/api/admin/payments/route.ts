import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { connectOnboardingUrl } from "@/lib/connect";

// Starts (or resumes) linking a host's own Stripe account and returns the Stripe page to go to. A host does this
// for themselves. The owner may open it for a host, to set it up together: the host enters their own details.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const body = (await req.json().catch(() => null)) as { hostId?: unknown } | null;
  // A host can only ever start their own, whatever is sent. Only the owner may name a host.
  const asOwner = !auth.ctx.hostId && auth.ctx.isOwner && typeof body?.hostId === "string";
  const hostId = auth.ctx.hostId ?? (asOwner ? (body!.hostId as string) : null);
  if (!hostId) {
    return NextResponse.json({ error: "Choose which host is linking a Stripe account." }, { status: 400 });
  }
  try {
    const url = await connectOnboardingUrl(
      hostId,
      asOwner ? `/admin/hosts/${encodeURIComponent(hostId)}` : undefined
    );
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Stripe connect start failed:", err);
    const message = err instanceof Error ? err.message : "Could not start the Stripe set-up.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
