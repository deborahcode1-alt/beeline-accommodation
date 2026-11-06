// Google Analytics (GA4) settings shared by the analytics component and the security headers.
// Analytics stays completely off until NEXT_PUBLIC_GA_MEASUREMENT_ID is set (it looks like G-ABC123XYZ4)
// and, for each visitor, until they press Accept on the banner.

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

export const GA_ENABLED = /^G-[A-Z0-9]{6,}$/.test(GA_MEASUREMENT_ID);

/** Where a visitor's Accept or Decline is remembered, in their own browser only. */
export const CONSENT_KEY = "beeline-analytics-consent";

/** Fired by the footer's "Analytics choices" link to bring the banner back. */
export const REOPEN_EVENT = "beeline:analytics-choices";

/**
 * Pages whose address holds a private link or token (a booking's manage link, a host's set-password link).
 * These are never sent to Google, however the visitor answered.
 */
export function isPrivatePath(pathname: string): boolean {
  return pathname === "/manage" || pathname.startsWith("/manage/") || pathname.startsWith("/set-password");
}

/** The address Google is told about: the path plus campaign tags (utm_...), and nothing else from the query. */
export function reportedLocation(origin: string, pathname: string, search: string): string {
  const params = new URLSearchParams(search);
  const kept = new URLSearchParams();
  params.forEach((value, key) => {
    if (key.toLowerCase().startsWith("utm_")) kept.set(key, value);
  });
  const query = kept.toString();
  return `${origin}${pathname}${query ? `?${query}` : ""}`;
}
