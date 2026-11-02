import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Fixed-window rate limiting kept in Postgres. The site runs as many short-lived serverless instances,
// so counters held in memory would not add up; one atomic upsert per check does.

export type Rule = {
  /** Where the limit applies, e.g. "sign-in". Different forms never share a counter. */
  name: string;
  /** Who is counted: an IP address, an email address, anything. */
  subject: string;
  limit: number;
  windowSeconds: number;
};

/** The visitor's IP address. Vercel sets these headers itself, so a visitor cannot choose their own. */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return req.headers.get("x-real-ip")?.trim() || forwarded || "unknown";
}

/** Counts one attempt against a rule. Returns true when the attempt is over the limit. */
async function overLimit(rule: Rule): Promise<boolean> {
  const key = `${rule.name}:${rule.subject.toLowerCase().slice(0, 200)}`;
  const now = new Date();
  const resetAt = new Date(now.getTime() + rule.windowSeconds * 1000);
  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."resetAt" < ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" < ${now} THEN ${resetAt} ELSE "RateLimit"."resetAt" END
      RETURNING "count"`;
    return (rows[0]?.count ?? 0) > rule.limit;
  } catch (err) {
    // If the database hiccups, let people through rather than locking everyone out.
    console.error("Rate limit check failed:", err);
    return false;
  }
}

/**
 * Checks every rule and returns a ready-made 429 response if any is over its limit, otherwise null.
 * Usage: `const blocked = await rateLimit(req, [{ name: "enquiry", subject: clientIp(req), limit: 5, windowSeconds: 3600 }]);
 *         if (blocked) return blocked;`
 */
export async function rateLimit(
  rules: Rule[],
  message = "Too many attempts. Please wait a little while and try again."
): Promise<NextResponse | null> {
  for (const rule of rules) {
    if (await overLimit(rule)) {
      return NextResponse.json(
        { error: message },
        { status: 429, headers: { "Retry-After": String(rule.windowSeconds) } }
      );
    }
  }
  return null;
}

/** Deletes counters whose window has ended. Called from the daily cleanup. */
export async function purgeExpiredRateLimits() {
  const { count } = await prisma.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } });
  return count;
}
