import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

// Owner-only: remove a collaborator's login. You can't remove yourself, and the last owner
// login can never be removed.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!auth.ctx.isOwner) {
    return NextResponse.json({ error: "Only an owner can remove collaborators" }, { status: 403 });
  }
  const { id } = await params;

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target || target.hostId !== null) {
    return NextResponse.json({ error: "Collaborator not found" }, { status: 404 });
  }
  if (target.email === auth.ctx.email) {
    return NextResponse.json({ error: "You can't remove your own login" }, { status: 400 });
  }
  const owners = await prisma.adminUser.count({ where: { hostId: null } });
  if (owners <= 1) {
    return NextResponse.json({ error: "There must be at least one owner login" }, { status: 400 });
  }

  await prisma.adminUser.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
