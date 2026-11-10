import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { slugify } from "@/lib/slugify";
import { rateLimit } from "@/lib/rateLimit";

// URL paths already used by the site; an area can't take one of these as its address.
const RESERVED = new Set(["admin", "api", "listings", "manage", "host", "terms", "privacy", "host-agreement", "about", "search", "sitemap.xml", "robots.txt"]);

const schema = z.object({
  name: z.string().min(1).max(100),
  state: z.string().min(2).max(10).default("QLD"),
  headline: z.string().max(300).optional(),
  heroImage: z.string().max(1000).optional(),
});

// The platform owner adds areas that go live straight away. A host who needs a place that is not listed yet can
// add it from their listing form, but it stays hidden until the owner has looked it over and published it.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const isOwner = auth.ctx.isOwner;
  if (!isOwner) {
    const blocked = await rateLimit(
      [{ name: "area-add", subject: auth.ctx.email, limit: 5, windowSeconds: 24 * 60 * 60 }],
      "You've added a few areas today already. Ask Beeline to add any others."
    );
    if (blocked) return blocked;
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { state, headline, heroImage } = parsed.data;
  // The site adds "Accommodation" itself, so keep just the place name (also catches the usual misspelling).
  const name = parsed.data.name.replace(/\s+accom+od\w*\s*$/i, "").trim();
  if (!name) return NextResponse.json({ error: "Enter the name of the town or area" }, { status: 400 });
  const slug = slugify(name);
  if (!slug || RESERVED.has(slug)) {
    return NextResponse.json({ error: "Choose a different area name" }, { status: 400 });
  }
  const existing = await prisma.area.findUnique({ where: { slug } });
  if (existing) {
    // Hands the existing one back so a host's form can simply pick it instead of making a duplicate.
    return NextResponse.json(
      { error: "That area already exists", existing: { id: existing.id, name: existing.name } },
      { status: 409 }
    );
  }
  const area = await prisma.area.create({
    data: {
      slug,
      name,
      state: state.toUpperCase(),
      // Only the owner can set a headline, photo or publish straight away.
      headline: isOwner ? headline : undefined,
      heroImage: isOwner ? heroImage || null : null,
      published: isOwner,
    },
  });
  return NextResponse.json({ area: { id: area.id, name: area.name, published: area.published } }, { status: 201 });
}
