import { NextResponse } from "next/server";
import { createStayCheckout } from "@/lib/stayPayment";

// Starts a card payment for the stay. The guest holds the private manage link, which is the proof it is theirs.
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const { url } = await createStayCheckout(token);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start the payment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
