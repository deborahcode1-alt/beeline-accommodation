import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminAuth";
import { createCheckoutSession, createPortalSession } from "@/lib/billing";

const schema = z.object({
  action: z.enum(["checkout", "portal"]),
  plan: z.enum(["monthly", "yearly"]).default("monthly"),
});

// Starts a subscription (checkout) or opens billing management / cancellation (portal).
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!auth.ctx.hostId) {
    return NextResponse.json({ error: "Only hosts have a subscription" }, { status: 400 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  try {
    const { url } =
      parsed.data.action === "checkout"
        ? await createCheckoutSession({ hostId: auth.ctx.hostId, plan: parsed.data.plan })
        : await createPortalSession({ hostId: auth.ctx.hostId });
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Billing error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
