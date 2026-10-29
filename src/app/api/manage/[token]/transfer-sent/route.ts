import { NextResponse } from "next/server";
import { markTransferSent } from "@/lib/stayPayment";

// The guest says they have sent the bank transfer, so the host knows to look for it.
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    await markTransferSent(token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not tell the host.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
