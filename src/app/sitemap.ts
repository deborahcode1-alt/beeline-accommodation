import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { publicListingWhere } from "@/lib/visibility";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://beeline-accommodation.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [areas, listings] = await Promise.all([
    prisma.area.findMany({ where: { published: true }, select: { slug: true } }),
    prisma.listing.findMany({
      where: publicListingWhere(),
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/host`, changeFrequency: "monthly", priority: 0.5 },
    ...areas.map((a) => ({
      url: `${SITE_URL}/${a.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...listings.map((l) => ({
      url: `${SITE_URL}/listings/${l.slug}`,
      lastModified: l.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
