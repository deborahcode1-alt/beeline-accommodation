import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getLiveChecklist } from "@/lib/getLive";
import { sendHostChecklistEmail } from "@/lib/notifications";
import { isEmailConfigured } from "@/lib/email";

// Owner only: email a host their Get live checklist with what is still to do.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!auth.ctx.isOwner) return NextResponse.json({ error: "Owners only" }, { status: 403 });
  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "Email isn't set up yet." }, { status: 400 });
  }
  const { id } = await params;
  const result = await getLiveChecklist(id, { forOwner: true });
  if (!result) return NextResponse.json({ error: "Host not found" }, { status: 404 });

  const sent = await sendHostChecklistEmail(
    id,
    result.items.filter((i) => !i.done).map((i) => i.label)
  );
  if (sent.length === 0) {
    return NextResponse.json({ error: "This host has no sign-in or alert email to send to yet." }, { status: 400 });
  }
  return NextResponse.json({ sent });
}
