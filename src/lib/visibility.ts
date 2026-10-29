import type { Prisma } from "@prisma/client";

/**
 * Which listings guests can see: published, and the host's subscription is in good standing.
 * Hosts also have to be approved (the Get live checklist). A lapsed (cancelled) host's listings drop off the platform until they pay again. PAST_DUE
 * stays visible during the grace period while payment reminders go out.
 */
export function publicListingWhere(): Prisma.ListingWhereInput {
  return {
    published: true,
    OR: [
      { hostId: null },
      {
        host: {
          // A new host is only shown once the platform owner has approved their Get live checklist.
          liveApprovedAt: { not: null },
          OR: [
            { subscriptionStatus: { in: ["ACTIVE", "COMPLIMENTARY", "PAST_DUE"] } },
            {
              subscriptionStatus: "TRIAL",
              OR: [{ trialEndsAt: null }, { trialEndsAt: { gt: new Date() } }],
            },
          ],
        },
      },
    ],
  };
}
