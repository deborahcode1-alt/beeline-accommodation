import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireListingAccess } from "@/lib/adminAuth";

const addSchema = z.object({
  url: z.string().url(),
  alt: z.string().max(200).optional(),
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

  const count = await prisma.photo.count({ where: { listingId: id } });
  const photo = await prisma.photo.create({
    data: {
      listingId: id,
      url: parsed.data.url,
      alt: parsed.data.alt ?? "",
      order: count,
    },
  });

  return NextResponse.json({ photo }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await requireListingAccess(id);
  if (access.error) return access.error;
  const photoId = req.nextUrl.searchParams.get("photoId");
  if (!photoId) return NextResponse.json({ error: "photoId required" }, { status: 400 });

  const existing = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!existing || existing.listingId !== id) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }
  const photo = await prisma.photo.delete({ where: { id: photoId } });

  if (photo.url.includes(".public.blob.vercel-storage.com/")) {
    await del(photo.url).catch(() => {
      // Best-effort — the DB record is already gone either way.
    });
  }

  return NextResponse.json({ ok: true });
}
