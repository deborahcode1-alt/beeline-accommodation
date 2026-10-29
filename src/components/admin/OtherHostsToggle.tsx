import Link from "next/link";

// For the platform owner: other hosts' bookings and calendars stay private unless asked for.
export function OtherHostsToggle({
  showAll,
  showHref,
  hideHref,
}: {
  showAll: boolean;
  showHref: string;
  hideHref: string;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-card-border bg-soft px-4 py-2.5 text-sm">
      <span className="text-muted">
        {showAll
          ? "Showing every host's bookings, calendar and messages."
          : "Showing your own listings only. Other hosts' bookings and calendars stay private."}
      </span>
      <Link
        href={showAll ? hideHref : showHref}
        className="rounded-md border border-card-border bg-background px-3 py-1.5 text-xs font-medium hover:border-accent"
      >
        {showAll ? "Hide other hosts" : "Show other hosts (for corrections)"}
      </Link>
    </div>
  );
}
