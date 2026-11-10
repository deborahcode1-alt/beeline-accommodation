import Link from "next/link";
import { InfoIcon, NoticeBar } from "@/components/admin/DashUI";

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
    <NoticeBar icon={<InfoIcon />}>
      <span className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-muted">
          {showAll
            ? "Showing every host's bookings, calendar and messages."
            : "Showing your own listings only. Other hosts' bookings and calendars stay private."}
        </span>
        <Link
          href={showAll ? hideHref : showHref}
          className="rounded-full border border-accent bg-white px-3.5 py-1.5 text-xs font-semibold transition hover:bg-accent/20"
        >
          {showAll ? "Hide other hosts" : "Show other hosts (for corrections)"}
        </Link>
      </span>
    </NoticeBar>
  );
}
