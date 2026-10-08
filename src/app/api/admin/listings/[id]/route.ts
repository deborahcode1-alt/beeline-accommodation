import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireListingAccess } from "@/lib/adminAuth";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  tagline: z.string().max(300).optional(),
  description: z.string().min(1).optional(),
  cancellationPolicy: z.string().max(4000).optional(),
  address: z.string().max(300).optional(),
  stayType: z.enum(["SHORT_TERM", "LONG_TERM"]).optional(),
  propertyType: z.enum(["BUDGET", "LUXURY", "APARTMENT", "FARM_STAY", "BOUTIQUE_HOTEL", "HOUSE"]).optional(),
  maxGuests: z.coerce.number().int().min(1).optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  beds: z.coerce.number().int().min(0).optional(),
  baths: z.coerce.number().min(0).optional(),
  basePrice: z.coerce.number().min(0).optional(),
  cleaningFee: z.coerce.number().min(0).optional(),
  minNights: z.coerce.number().int().min(1).optional(),
  amenities: z.array(z.string()).optional(),
  published: z.boolean().optional(),
  petFriendly: z.boolean().optional(),
  bookingMode: z.enum(["REQUEST", "INSTANT"]).optional(),
  areaId: z.string().nullable().optional(),
  hostId: z.string().nullable().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await requireListingAccess(id);
  if (access.error) return access.error;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { order: "asc" } },
      blockedDates: true,
      icalImports: true,
      bookings: { orderBy: { checkIn: "asc" } },
      host: true,
    },
  });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ listing });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await requireListingAccess(id);
  if (access.error) return access.error;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { amenities, ...rest } = parsed.data;
  // Only the platform owner can move a listing to a different host.
  if (!access.ctx.isOwner) delete rest.hostId;

  const listing = await prisma.listing.update({
    where: { id },
    data: {
      ...rest,
      ...(amenities ? { amenities: JSON.stringify(amenities) } : {}),
    },
  });

  return NextResponse.json({ listing });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await requireListingAccess(id);
  if (access.error) return access.error;
  await prisma.listing.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
