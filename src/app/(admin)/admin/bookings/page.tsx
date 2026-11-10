import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookingsTable } from "@/components/admin/BookingsTable";
import { getAdminContext, bookingScope } from "@/lib/adminAuth";
import { OtherHostsToggle } from "@/components/admin/OtherHostsToggle";
import { CalendarCheckIcon, PageHeader } from "@/components/admin/DashUI";
import { RETENTION_YEARS, startOfToday } from "@/lib/retention";

export const dynamic = "force-dynamic";

const TABS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "DECLINED", label: "Declined" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string; q?: string; all?: string }>;
}) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  const { status, view, q: rawQ, all } = await searchParams;
  const showAll = ctx.isOwner && all === "1";
  const archive = view === "archive";
  const q = (rawQ ?? "").trim().slice(0, 100);
  const activeStatus = TABS.some((t) => t.value === status) ? status ?? "" : "";
  const today = startOfToday();

  // Current and upcoming = stays that have not ended yet. Once the stay's last day has passed it
  // moves to the archive, where it stays searchable for 7 years.
  const bookings = await prisma.booking.findMany({
    where: {
      ...(archive ? { checkOut: { lt: today } } : { checkOut: { gte: today } }),
      ...(activeStatus ? { status: activeStatus as never } : {}),
      ...(archive && q
        ? {
            OR: [
              { guestName: { contains: q, mode: "insensitive" } },
              { guestEmail: { contains: q, mode: "insensitive" } },
              { guestPhone: { contains: q } },
              { listing: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...bookingScope(ctx, showAll),
    },
    orderBy: { checkIn: archive ? "desc" : "asc" },
    include: { listing: { select: { name: true } } },
    ...(archive ? { take: 200 } : {}),
  });

  const href = (params: Record<string, string>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (showAll) sp.set("all", "1");
    const qs = sp.toString();
    return `/admin/bookings${qs ? `?${qs}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        icon={<CalendarCheckIcon />}
        title={archive ? "Archived stays" : "Bookings"}
        action={
          <div className="flex gap-1 rounded-full border border-card-border bg-white p-1 text-sm shadow-sm">
            <Link
              href={href({})}
              className={`rounded-full px-4 py-1.5 font-medium ${
                !archive ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"
              }`}
            >
              Current &amp; upcoming
            </Link>
            <Link
              href={href({ view: "archive" })}
              className={`rounded-full px-4 py-1.5 font-medium ${
                archive ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"
              }`}
            >
              Archive
            </Link>
          </div>
        }
      />

      {ctx.isOwner && (
        <OtherHostsToggle
          showAll={showAll}
          showHref={href({ view: archive ? "archive" : "", status: activeStatus, q, all: "1" })}
          hideHref={`/admin/bookings${archive ? "?view=archive" : ""}`}
        />
      )}

      {archive ? (
        <>
          <p className="mt-2 text-sm text-muted">
            Stays that have finished. Customer details stay available here for {RETENTION_YEARS}{" "}
            years after their last stay, then are deleted automatically.
          </p>
          <form method="get" className="mt-4 flex flex-wrap gap-2">
            <input type="hidden" name="view" value="archive" />
            {showAll && <input type="hidden" name="all" value="1" />}
            {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by customer name, email, phone or listing"
              className="min-w-64 flex-1 rounded-full border border-card-border bg-white px-4 py-2 text-sm shadow-sm"
            />
            <button
              type="submit"
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover"
            >
              Search
            </button>
            {q && (
              <Link
                href={href({ view: "archive", status: activeStatus })}
                className="rounded-full border border-card-border bg-white px-4 py-2 text-sm font-medium hover:border-accent"
              >
                Clear
              </Link>
            )}
          </form>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">
          Stays that are happening now or still to come. Finished stays move to the Archive.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={href({ view: archive ? "archive" : "", status: tab.value, q })}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              activeStatus === tab.value
                ? "border-header-bg bg-header-bg text-header-fg"
                : "border-card-border bg-white text-muted hover:border-accent hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-card-border bg-white p-3 shadow-sm sm:p-4">
        {archive && bookings.length === 200 && (
          <p className="mb-2 text-xs text-muted">Showing the 200 most recent. Search to narrow it down.</p>
        )}
        <BookingsTable bookings={bookings} archived={archive} />
      </div>
    </div>
  );
}
