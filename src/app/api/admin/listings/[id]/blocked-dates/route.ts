import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { toDateOnly } from "@/lib/availability";
import { requireListingAccess } from "@/lib/adminAuth";

const addSchema = z.object({
  date: z.coerce.date(),
  reason: z.string().max(200).optional(),
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

  const blocked = await prisma.blockedDate.upsert({
    where: {
      listingId_date_source: {
        listingId: id,
        date: toDateOnly(parsed.data.date),
        source: "manual",
      },
    },
    create: {
      listingId: id,
      date: toDateOnly(parsed.data.date),
      reason: parsed.data.reason,
      source: "manual",
    },
    update: { reason: parsed.data.reason },
  });

  return NextResponse.json({ blocked }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await requireListingAccess(id);
  if (access.error) return access.error;
  const blockedId = req.nextUrl.searchParams.get("blockedId");
  if (!blockedId) return NextResponse.json({ error: "blockedId required" }, { status: 400 });
  const existing = await prisma.blockedDate.findUnique({ where: { id: blockedId } });
  if (!existing || existing.listingId !== id) {
    return NextResponse.json({ error: "Blocked date not found" }, { status: 404 });
  }
  await prisma.blockedDate.delete({ where: { id: blockedId } });
  return NextResponse.json({ ok: true });
}
