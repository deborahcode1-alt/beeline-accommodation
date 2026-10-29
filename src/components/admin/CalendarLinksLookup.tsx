import Link from "next/link";
import { CopyableUrl } from "@/components/admin/CopyableUrl";
import { SITE_URL } from "@/lib/site";

// Beeline's calendar link for each listing, for pasting into Airbnb, Booking.com and the others.
export function CalendarLinksLookup({ listings }: { listings: { id: string; name: string; exportToken: string }[] }) {
  if (listings.length === 0) {
    return (
      <p className="text-sm text-muted">
        Your calendar links appear here as soon as you add a listing, one link for each listing.
      </p>
    );
  }
  return (
    <div>
      <p className="text-sm text-muted">
        Each listing has its own Beeline calendar link. Paste it into that listing&apos;s{" "}
        <strong>Import calendar</strong> on Airbnb, Booking.com or any other site you use, so a booking made on
        Beeline blocks those dates there. Keep the links private: anyone with a link can see that listing&apos;s
        booked dates.
      </p>
      <div className="mt-4 space-y-4">
        {listings.map((l) => (
          <div key={l.id} className="rounded-lg border border-card-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{l.name}</p>
              <Link
                href={`/admin/listings/${l.id}/calendar`}
                className="text-xs text-accent-deep underline"
              >
                Connect their calendars into Beeline
              </Link>
            </div>
            <div className="mt-2">
              <CopyableUrl url={`${SITE_URL}/api/ical/${l.exportToken}.ics`} />
            </div>
          </div>
        ))}
      </div>
      <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-muted">
        <li>
          <strong>Airbnb:</strong> Calendar, pick the listing, Availability settings, Connect calendars, Import
          calendar. Paste the link and name it Beeline.
        </li>
        <li>
          <strong>Booking.com:</strong> Rates &amp; Availability, Sync calendars, Import calendar. Paste the link.
        </li>
        <li>
          Then do the reverse: copy each site&apos;s <strong>Export calendar</strong> link and paste it into the
          listing&apos;s calendar page here, so their bookings block dates on Beeline.
        </li>
      </ol>
    </div>
  );
}
