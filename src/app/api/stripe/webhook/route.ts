import { NextRequest, NextResponse } from "next/server";
import { handleStripeEvent, isWebhookConfigured, stripeClient } from "@/lib/billing";

// Stripe calls this whenever a host's subscription changes (started, paid, failed, cancelled).
// Every call is checked against Stripe's signature, so nothing can fake a payment.
export async function POST(req: NextRequest) {
  if (!isWebhookConfigured()) {
    return NextResponse.json({ error: "Stripe webhook is not set up" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // The signature covers the exact bytes Stripe sent, so read the body as raw text.
  const body = await req.text();

  let event;
  try {
    event = stripeClient().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleStripeEvent(event);
  } catch (err) {
    // A 500 makes Stripe retry later, which is what we want for a temporary fault.
    console.error("Stripe event failed:", event.type, err);
    return NextResponse.json({ error: "Could not process the event" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
