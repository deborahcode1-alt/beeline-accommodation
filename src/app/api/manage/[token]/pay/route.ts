import { NextResponse } from "next/server";
import { z } from "zod";
import { createStayCheckout } from "@/lib/stayPayment";

const schema = z.object({ agreed: z.boolean() });

// Starts a card payment for the stay. The guest holds the private manage link, which is the proof it is theirs.
// They must have accepted the cancellation and refund terms; the tick is saved with the booking.
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  try {
    const { url } = await createStayCheckout(token, parsed.success && parsed.data.agreed);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start the payment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
