import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { requireAdmin, listingScope } from "@/lib/adminAuth";

const listingSchema = z.object({
  name: z.string().min(1).max(200),
  tagline: z.string().max(300).optional(),
  description: z.string().min(1),
  cancellationPolicy: z.string().max(4000).optional(),
  address: z.string().max(300).optional(),
  stayType: z.enum(["SHORT_TERM", "LONG_TERM"]).default("SHORT_TERM"),
  propertyType: z.enum(["BUDGET", "LUXURY", "APARTMENT", "FARM_STAY", "BOUTIQUE_HOTEL", "HOUSE"]).default("HOUSE"),
  maxGuests: z.coerce.number().int().min(1),
  bedrooms: z.coerce.number().int().min(0),
  beds: z.coerce.number().int().min(0),
  baths: z.coerce.number().min(0),
  basePrice: z.coerce.number().min(0),
  cleaningFee: z.coerce.number().min(0).default(0),
  minNights: z.coerce.number().int().min(1).default(1),
  amenities: z.array(z.string()).default([]),
  published: z.boolean().default(true),
  petFriendly: z.boolean().default(false),
  bookingMode: z.enum(["REQUEST", "INSTANT"]).default("REQUEST"),
  areaId: z.string().nullable().optional(),
  hostId: z.string().optional(),
});

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const listings = await prisma.listing.findMany({
    where: listingScope(auth.ctx),
    orderBy: { createdAt: "desc" },
    include: { photos: true, host: true, _count: { select: { bookings: true } } },
  });
  return NextResponse.json({ listings });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const body = await req.json().catch(() => null);
  const parsed = listingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  // A host can only create listings under their own host account.
  if (!auth.ctx.isOwner) data.hostId = auth.ctx.hostId ?? undefined;

  const baseSlug = slugify(data.name) || "listing";
  let slug = baseSlug;
  let i = 1;
  while (await prisma.listing.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++i}`;
  }

  const listing = await prisma.listing.create({
    data: {
      ...data,
      amenities: JSON.stringify(data.amenities),
      slug,
    },
  });

  return NextResponse.json({ listing }, { status: 201 });
}
