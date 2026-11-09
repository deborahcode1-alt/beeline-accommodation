import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
// Google Analytics is only allowed through the policy when a measurement ID is configured.
const analyticsOn = /^G-[A-Z0-9]{6,}$/.test(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "");

// Content-Security-Policy. Scripts stay 'self' plus inline because Next.js injects its own inline bootstrap
// scripts; the rest of the policy is what blocks injected content, framing, and posting forms elsewhere.
// Photos can come from any https host (listing photos are pasted in as links), so img-src allows https.
// connect-src covers our own API and the browser-side photo upload to Vercel Blob.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${analyticsOn ? " https://www.googletagmanager.com" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https://vercel.com https://*.vercel-storage.com${
    analyticsOn ? " https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com" : ""
  }${isDev ? " ws: wss:" : ""}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Only on the live site: a plain http://localhost test build cannot be upgraded to https.
  ...(process.env.VERCEL ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "**" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // The site lives at bookonbeeline.com. The old address sends visitors there, but its /api/ routes keep
  // answering, because calendar links pasted into Airbnb and Booking.com, and the webhooks, may still point at it.
  async redirects() {
    return [
      {
        source: "/:path((?!api/).*)",
        has: [{ type: "host" as const, value: "(www\\.)?beelineaccommodation\\.com" }],
        destination: "https://bookonbeeline.com/:path",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: "www\\.bookonbeeline\\.com" }],
        destination: "https://bookonbeeline.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
