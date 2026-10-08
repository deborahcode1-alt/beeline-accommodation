import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminContext, listingScope, bookingScope } from "@/lib/adminAuth";
import { BookingsTable } from "@/components/admin/BookingsTable";
import { MonthCalendar, parseMonth } from "@/components/admin/MonthCalendar";
import { GuestContactLinks } from "@/components/admin/GuestContactLinks";
import { MarkHandledButton } from "@/components/admin/MarkHandledButton";
import { SubscriptionBadge } from "@/components/admin/SubscriptionBadge";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  const { month: monthParam } = await searchParams;
  const { year, month } = parseMonth(monthParam);

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const in30 = new Date(today.getTime() + 30 * DAY_MS);
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 1));
  const scope = bookingScope(ctx);
  const withListing = { listing: { select: { name: true } } };

  const [pending, soon, monthBookings, upcomingCount, listingCount, messages, host] =
    await Promise.all([
      prisma.booking.findMany({
        where: { status: "PENDING", ...scope },
        orderBy: { createdAt: "desc" },
        include: withListing,
      }),
      prisma.booking.findMany({
        where: {
          status: { in: ["CONFIRMED", "PENDING"] },
          checkOut: { gte: today },
          checkIn: { lte: in30 },
          ...scope,
        },
        orderBy: { checkIn: "asc" },
        include: withListing,
      }),
      prisma.booking.findMany({
        where: {
          status: { in: ["CONFIRMED", "PENDING"] },
          checkIn: { lt: monthEnd },
          checkOut: { gt: monthStart },
          ...scope,
        },
        orderBy: { checkIn: "asc" },
        include: withListing,
      }),
      prisma.booking.count({
        where: { status: "CONFIRMED", checkOut: { gte: today }, ...scope },
      }),
      prisma.listing.count({ where: listingScope(ctx) }),
      prisma.hostMessage.findMany({
        where: { handled: false, ...(ctx.isOwner ? {} : { hostId: ctx.hostId }) },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      ctx.hostId ? prisma.host.findUnique({ where: { id: ctx.hostId } }) : null,
    ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {host && (
        <Link
          href="/admin/subscription"
          className="mt-4 flex items-center justify-between rounded-lg border border-card-border bg-soft px-4 py-3 text-sm hover:border-accent"
        >
          <span>
            Your Beeline subscription: <SubscriptionBadge status={host.subscriptionStatus} />
          </span>
          <span className="text-muted">Manage &rarr;</span>
        </Link>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-card-border p-4">
          <p className="text-xs uppercase text-muted">Pending requests</p>
          <p className="mt-1 text-2xl font-semibold">{pending.length}</p>
        </div>
        <div className="rounded-lg border border-card-border p-4">
          <p className="text-xs uppercase text-muted">Upcoming stays</p>
          <p className="mt-1 text-2xl font-semibold">{upcomingCount}</p>
        </div>
        <div className="rounded-lg border border-card-border p-4">
          <p className="text-xs uppercase text-muted">New messages</p>
          <p className="mt-1 text-2xl font-semibold">{messages.length}</p>
        </div>
        <div className="rounded-lg border border-card-border p-4">
          <p className="text-xs uppercase text-muted">Listings</p>
          <p className="mt-1 text-2xl font-semibold">{listingCount}</p>
        </div>
      </div>

      {pending.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Needs your response</h2>
          <div className="mt-3">
            <BookingsTable bookings={pending} />
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Next 30 days</h2>
        <p className="mt-1 text-sm text-muted">Stays arriving or in progress, soonest first.</p>
        <div className="mt-3">
          <BookingsTable bookings={soon} />
        </div>
      </section>

      <section id="calendar" className="mt-10">
        <h2 className="text-lg font-semibold">Calendar</h2>
        <div className="mt-3">
          <MonthCalendar
            year={year}
            month={month}
            bookings={monthBookings.map((b) => ({
              id: b.id,
              checkIn: b.checkIn,
              checkOut: b.checkOut,
              guestName: b.guestName,
              listingName: b.listing.name,
              status: b.status,
            }))}
          />
        </div>
      </section>

      {messages.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Messages from guests</h2>
          <div className="mt-3 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className="rounded-lg border border-card-border p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {m.name}
                    {m.listingName && (
                      <span className="font-normal text-muted"> about {m.listingName}</span>
                    )}
                  </p>
                  <MarkHandledButton messageId={m.id} />
                </div>
                <p className="mt-2 whitespace-pre-line">{m.message}</p>
                <div className="mt-3">
                  <GuestContactLinks phone={m.phone} email={m.email} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
