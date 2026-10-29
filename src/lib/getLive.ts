import { prisma } from "@/lib/prisma";
import { bankDetailsOf } from "@/lib/stayPaymentInfo";

// The "Get live" checklist: what a host does before their listings appear on the site. Every step
// ticks itself from what is saved, except the two the host confirms by hand (agreement, calendars).
// The platform owner then approves, and only approved hosts' listings are shown to guests.

export type GetLiveAction = "agree" | "noCalendars";

export type GetLiveItem = {
  key: string;
  label: string;
  detail: string;
  done: boolean;
  href?: string;
  /** A step the host confirms with a button rather than by filling something in. */
  action?: GetLiveAction;
};

export type GetLiveResult = {
  hostName: string;
  items: GetLiveItem[];
  doneCount: number;
  allDone: boolean;
  approved: boolean;
  listings: { id: string; name: string; exportToken: string }[];
};

export async function getLiveChecklist(hostId: string, opts: { forOwner?: boolean } = {}): Promise<GetLiveResult | null> {
  const host = await prisma.host.findUnique({
    where: { id: hostId },
    include: {
      listings: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          basePrice: true,
          cancellationPolicy: true,
          icalExportToken: true,
          _count: { select: { photos: true } },
          icalImports: { select: { lastSyncedAt: true, lastError: true } },
        },
      },
    },
  });
  if (!host) return null;

  // Hosts edit their own profile; the owner reaches the same form from the host's page.
  const profileHref = opts.forOwner ? `/admin/hosts/${host.id}` : "/admin/profile";
  const listings = host.listings;
  const names = (rows: { name: string }[]) => rows.map((l) => l.name).join(", ");

  const needsDetails = listings.filter(
    (l) => l._count.photos < 1 || l.description.trim().length < 40 || !(l.basePrice > 0)
  );
  const needsPolicy = listings.filter((l) => !l.cancellationPolicy?.trim());
  const needsCalendar = listings.filter(
    (l) => !l.icalImports.some((i) => i.lastSyncedAt && !i.lastError)
  );

  const subscribed =
    host.subscriptionStatus === "ACTIVE" ||
    host.subscriptionStatus === "COMPLIMENTARY" ||
    (host.subscriptionStatus === "TRIAL" && !!host.stripeSubscriptionId);

  const items: GetLiveItem[] = [
    {
      key: "profile",
      label: "Complete your host profile",
      detail: "A photo, a short blurb, and a phone or email guests can use.",
      done: !!host.photoUrl && !!host.blurb?.trim() && !!(host.publicPhone || host.publicEmail),
      href: profileHref,
    },
    {
      key: "alerts",
      label: "Set where booking alerts go",
      detail: "The email address that gets a message when a booking arrives. A mobile number for texts is a bonus.",
      done: !!host.notificationEmail?.trim(),
      href: profileHref,
    },
    {
      key: "bank",
      label: "Add your bank details",
      detail: "So guests can pay by direct bank transfer, with no card surcharge.",
      done: !!bankDetailsOf(host),
      href: profileHref,
    },
    {
      key: "listing",
      label: "Add at least one listing",
      detail: "Each room, house or unit guests can book is one listing.",
      done: listings.length > 0,
      href: "/admin/listings",
    },
    {
      key: "details",
      label: "Finish every listing",
      detail:
        listings.length === 0
          ? "Photos, a description of at least a few sentences, and a nightly price."
          : needsDetails.length === 0
            ? "Photos, description and price are all in."
            : `Still needs photos, a description or a price: ${names(needsDetails)}.`,
      done: listings.length > 0 && needsDetails.length === 0,
      href: "/admin/listings",
    },
    {
      key: "policy",
      label: "Set a cancellation policy on every listing",
      detail:
        listings.length === 0
          ? "Guests see this before they book."
          : needsPolicy.length === 0
            ? "Every listing has its own policy."
            : `Missing on: ${names(needsPolicy)}.`,
      done: listings.length > 0 && needsPolicy.length === 0,
      href: "/admin/listings",
    },
    {
      key: "calendars",
      label: "Connect your other calendars",
      detail: host.calendarsSkippedAt
        ? "You said you do not list anywhere else, so there is nothing to connect."
        : listings.length === 0
          ? "Link Airbnb, Booking.com and others so a booking on one blocks the dates on the rest."
          : needsCalendar.length === 0
            ? "Every listing is connected and syncing."
            : `Not connected yet: ${names(needsCalendar)}.`,
      done: !!host.calendarsSkippedAt || (listings.length > 0 && needsCalendar.length === 0),
      href: listings[0] ? `/admin/listings/${listings[0].id}/calendar` : "/admin/listings",
      action: host.calendarsSkippedAt ? undefined : "noCalendars",
    },
    {
      key: "agreement",
      label: "Read and accept the host agreement",
      detail: "The terms for hosting on Beeline: a simple subscription and no commission.",
      done: !!host.agreedHostTermsAt,
      href: "/host-agreement",
      action: host.agreedHostTermsAt ? undefined : "agree",
    },
    {
      key: "subscription",
      label: "Start your subscription",
      detail: "Billed monthly or yearly through Stripe, with no commission on bookings.",
      done: subscribed,
      href: opts.forOwner ? `/admin/hosts/${host.id}` : "/admin/subscription",
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  return {
    hostName: host.name,
    items,
    doneCount,
    allDone: doneCount === items.length,
    approved: !!host.liveApprovedAt,
    listings: listings.map((l) => ({ id: l.id, name: l.name, exportToken: l.icalExportToken })),
  };
}
