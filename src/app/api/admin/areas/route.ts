import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { slugify } from "@/lib/slugify";

// URL paths already used by the site; an area can't take one of these as its address.
const RESERVED = new Set(["admin", "api", "listings", "manage", "host", "terms", "privacy", "host-agreement", "about", "search", "sitemap.xml", "robots.txt"]);

const schema = z.object({
  name: z.string().min(1).max(100),
  state: z.string().min(2).max(10).default("QLD"),
  headline: z.string().max(300).optional(),
  heroImage: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!auth.ctx.isOwner) {
    return NextResponse.json({ error: "Only the platform owner can add areas" }, { status: 403 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, state, headline, heroImage } = parsed.data;
  const slug = slugify(name);
  if (!slug || RESERVED.has(slug)) {
    return NextResponse.json({ error: "Choose a different area name" }, { status: 400 });
  }
  if (await prisma.area.findUnique({ where: { slug } })) {
    return NextResponse.json({ error: "That area already exists" }, { status: 409 });
  }
  const area = await prisma.area.create({
    data: { slug, name, state: state.toUpperCase(), headline, heroImage: heroImage || null },
  });
  return NextResponse.json({ area }, { status: 201 });
}
