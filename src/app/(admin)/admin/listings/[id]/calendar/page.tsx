import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getAdminContext, canAccessHost, isOwnersHost } from "@/lib/adminAuth";
import { IcalImportManager } from "@/components/admin/IcalImportManager";
import { BlockedDatesManager } from "@/components/admin/BlockedDatesManager";
import { CopyableUrl } from "@/components/admin/CopyableUrl";

export default async function ListingCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ show?: string }>;
}) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  const { id } = await params;
  const { show } = await searchParams;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { blockedDates: true, icalImports: true, host: { select: { name: true, subscriptionStatus: true } } },
  });
  if (!listing || !canAccessHost(ctx, listing.hostId)) notFound();

  // A host's calendar settings are theirs. The owner opens another host's only when that host needs a correction.
  if (ctx.isOwner && !isOwnersHost(listing.host) && show !== "1") {
    return (
      <div className="max-w-xl">
        <h1 className="text-2xl font-semibold">{listing.name} &mdash; Calendar &amp; sync</h1>
        <div className="mt-6 rounded-lg border border-card-border bg-soft p-5 text-sm">
          <p className="font-medium">This calendar belongs to {listing.host?.name ?? "another host"}.</p>
          <p className="mt-1 text-muted">
            Their connected calendars, blocked dates and links are kept private. Open them only if the host has asked you
            to fix something.
          </p>
          <Link
            href={`/admin/listings/${listing.id}/calendar?show=1`}
            className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover"
          >
            Show calendar settings
          </Link>
        </div>
      </div>
    );
  }

  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const exportUrl = `${protocol}://${host}/api/ical/${listing.icalExportToken}.ics`;

  return (
    <div>
      <h1 className="text-2xl font-semibold">{listing.name} &mdash; Calendar &amp; sync</h1>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Export to other platforms</h2>
        <p className="mt-1 text-sm text-muted">
          Paste this URL into each platform&apos;s &quot;import calendar&quot; setting (Airbnb,
          Booking.com, VRBO, etc.) so direct bookings and manual blocks show up as unavailable
          everywhere.
        </p>
        <div className="mt-3">
          <CopyableUrl url={exportUrl} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Import from other platforms</h2>
        <p className="mt-1 text-sm text-muted">
          Connect each platform&apos;s export calendar so bookings made there block those dates
          here too. Add one per platform &mdash; Airbnb, Booking.com, VRBO, etc.
        </p>
        <div className="mt-3">
          <IcalImportManager listingId={listing.id} imports={listing.icalImports} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Blocked dates</h2>
        <div className="mt-3">
          <BlockedDatesManager
            listingId={listing.id}
            blocked={listing.blockedDates}
            imports={listing.icalImports}
          />
        </div>
      </section>
    </div>
  );
}
