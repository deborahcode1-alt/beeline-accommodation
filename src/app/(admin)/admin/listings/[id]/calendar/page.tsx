import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAdminContext, canAccessHost } from "@/lib/adminAuth";
import { IcalImportManager } from "@/components/admin/IcalImportManager";
import { BlockedDatesManager } from "@/components/admin/BlockedDatesManager";
import { CopyableUrl } from "@/components/admin/CopyableUrl";

export default async function ListingCalendarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { blockedDates: true, icalImports: true },
  });
  if (!listing || !canAccessHost(ctx, listing.hostId)) notFound();

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
