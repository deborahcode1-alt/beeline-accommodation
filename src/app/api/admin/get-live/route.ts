import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

const schema = z.object({ action: z.enum(["agree", "noCalendars", "undoNoCalendars"]) });

// The two checklist steps a host confirms with a button. Hosts only, and only for their own host.
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!auth.ctx.hostId) {
    return NextResponse.json({ error: "This is for hosts. Owners approve hosts from the Hosts page." }, { status: 400 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  const data =
    parsed.data.action === "agree"
      ? { agreedHostTermsAt: new Date() }
      : parsed.data.action === "noCalendars"
        ? { calendarsSkippedAt: new Date() }
        : { calendarsSkippedAt: null };
  await prisma.host.update({ where: { id: auth.ctx.hostId }, data });
  return NextResponse.json({ ok: true });
}
