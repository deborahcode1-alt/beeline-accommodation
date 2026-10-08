import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

const schema = z.object({
  headline: z.string().max(300).nullable().optional(),
  heroImage: z.string().max(1000).nullable().optional(),
  published: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!auth.ctx.isOwner) {
    return NextResponse.json({ error: "Only the platform owner can edit areas" }, { status: 403 });
  }
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const area = await prisma.area.update({ where: { id }, data: parsed.data }).catch(() => null);
  if (!area) return NextResponse.json({ error: "Area not found" }, { status: 404 });
  return NextResponse.json({ area });
}
