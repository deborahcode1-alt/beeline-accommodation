import { NextRequest, NextResponse } from "next/server";
import { handleConnectEvent, isConnectWebhookConfigured } from "@/lib/connect";
import { stripeClient } from "@/lib/stripeClient";

// Stripe calls this about the hosts' OWN Stripe accounts (they finished signing up, a guest paid them).
// It is a separate endpoint from /api/stripe/webhook, with its own signing secret, because Stripe sends
// events about connected accounts to endpoints set up for that. Every call is checked against the signature.
export async function POST(req: NextRequest) {
  if (!isConnectWebhookConfigured()) {
    return NextResponse.json({ error: "Stripe Connect webhook is not set up" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const body = await req.text(); // the signature covers the exact bytes, so read it as raw text

  let event;
  try {
    event = stripeClient().webhooks.constructEvent(body, signature, process.env.STRIPE_CONNECT_WEBHOOK_SECRET as string);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleConnectEvent(event);
  } catch (err) {
    console.error("Stripe Connect event failed:", event.type, err);
    return NextResponse.json({ error: "Could not process the event" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
