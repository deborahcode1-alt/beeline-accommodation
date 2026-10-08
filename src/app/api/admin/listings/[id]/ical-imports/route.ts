import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { syncListingImports } from "@/lib/syncIcal";
import { requireListingAccess } from "@/lib/adminAuth";

const addSchema = z.object({
  url: z.string().url(),
  label: z.string().min(1).max(100),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await requireListingAccess(id);
  if (access.error) return access.error;
  const body = await req.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const importUrl = await prisma.icalImportUrl.create({
    data: { listingId: id, url: parsed.data.url, label: parsed.data.label },
  });

  await syncListingImports(id);

  return NextResponse.json({ importUrl }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await requireListingAccess(id);
  if (access.error) return access.error;
  const importId = req.nextUrl.searchParams.get("importId");
  if (!importId) return NextResponse.json({ error: "importId required" }, { status: 400 });
  const existing = await prisma.icalImportUrl.findUnique({ where: { id: importId } });
  if (!existing || existing.listingId !== id) {
    return NextResponse.json({ error: "Import not found" }, { status: 404 });
  }
  await prisma.$transaction([
    prisma.blockedDate.deleteMany({ where: { source: importId } }),
    prisma.icalImportUrl.delete({ where: { id: importId } }),
  ]);
  return NextResponse.json({ ok: true });
}
