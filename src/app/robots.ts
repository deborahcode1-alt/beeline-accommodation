import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://beelineaccommodation.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/account", "/sign-in", "/sign-up", "/forgot-password", "/manage"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
