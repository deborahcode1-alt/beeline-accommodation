import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookingsTable } from "@/components/admin/BookingsTable";
import { getAdminContext, bookingScope } from "@/lib/adminAuth";
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
  searchParams: Promise<{ status?: string; view?: string; q?: string }>;
}) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  const { status, view, q: rawQ } = await searchParams;
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
      ...bookingScope(ctx),
    },
    orderBy: { checkIn: archive ? "desc" : "asc" },
    include: { listing: { select: { name: true } } },
    ...(archive ? { take: 200 } : {}),
  });

  const href = (params: Record<string, string>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    const qs = sp.toString();
    return `/admin/bookings${qs ? `?${qs}` : ""}`;
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{archive ? "Archived stays" : "Bookings"}</h1>
        <div className="flex gap-1 rounded-lg border border-card-border p-1 text-sm">
          <Link
            href="/admin/bookings"
            className={`rounded-md px-3 py-1.5 font-medium ${
              !archive ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"
            }`}
          >
            Current &amp; upcoming
          </Link>
          <Link
            href="/admin/bookings?view=archive"
            className={`rounded-md px-3 py-1.5 font-medium ${
              archive ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"
            }`}
          >
            Archive
          </Link>
        </div>
      </div>

      {archive ? (
        <>
          <p className="mt-2 text-sm text-muted">
            Stays that have finished. Customer details stay available here for {RETENTION_YEARS}{" "}
            years after their last stay, then are deleted automatically.
          </p>
          <form method="get" className="mt-4 flex flex-wrap gap-2">
            <input type="hidden" name="view" value="archive" />
            {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by customer name, email, phone or listing"
              className="min-w-64 flex-1 rounded-md border border-card-border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover"
            >
              Search
            </button>
            {q && (
              <Link
                href={href({ view: "archive", status: activeStatus })}
                className="rounded-md border border-card-border px-4 py-2 text-sm font-medium hover:border-accent"
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

      <div className="mt-4 flex gap-1 border-b border-card-border">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={href({ view: archive ? "archive" : "", status: tab.value, q })}
            className={`rounded-t-md px-3 py-2 text-sm font-medium ${
              activeStatus === tab.value
                ? "border-b-2 border-accent text-accent-deep"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="mt-4">
        {archive && bookings.length === 200 && (
          <p className="mb-2 text-xs text-muted">Showing the 200 most recent. Search to narrow it down.</p>
        )}
        <BookingsTable bookings={bookings} archived={archive} />
      </div>
    </div>
  );
}
