import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, canAccessHost } from "@/lib/adminAuth";

// Mark a guest message as handled (or not).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  const body = await req.json().catch(() => null);

  const message = await prisma.hostMessage.findUnique({ where: { id } });
  if (!message || !canAccessHost(auth.ctx, message.hostId)) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }
  const updated = await prisma.hostMessage.update({
    where: { id },
    data: { handled: body?.handled === false ? false : true },
  });
  return NextResponse.json({ message: updated });
}
