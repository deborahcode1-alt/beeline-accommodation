// Host subscription prices, in Australian dollars. The same figures must be created as prices in
// Stripe (see the STRIPE_PRICE_ settings in billing.ts). Yearly is the monthly price for 11 months,
// so one month is free. No GST is added because the business is not registered for it.

export type TierKey = "T1" | "T2";

export type Tier = {
  key: TierKey;
  label: string;
  maxListings: number;
  monthly: number;
  yearly: number;
};

export const HOST_TIERS: Tier[] = [
  { key: "T1", label: "1 to 3 listings", maxListings: 3, monthly: 100, yearly: 1100 },
  { key: "T2", label: "4 to 10 listings", maxListings: 10, monthly: 200, yearly: 2200 },
];

export const MAX_LISTINGS_ON_PLANS = 10;

/** The plan that covers a host with this many listings, or null if they need a custom arrangement. */
export function tierForListingCount(count: number): Tier | null {
  return HOST_TIERS.find((t) => count <= t.maxListings) ?? null;
}

export function tierByKey(key: string | null | undefined): Tier | null {
  return HOST_TIERS.find((t) => t.key === key) ?? null;
}

export function formatAud(amount: number) {
  return `A$${amount.toLocaleString("en-AU")}`;
}

/** How many listings a host may have. Owners' own listings and trials have their own rules. */
export function listingLimitFor(host: {
  subscriptionStatus: string;
  planTier: string | null;
}): number {
  if (host.subscriptionStatus === "COMPLIMENTARY") return Number.POSITIVE_INFINITY;
  return tierByKey(host.planTier)?.maxListings ?? HOST_TIERS[0].maxListings;
}
