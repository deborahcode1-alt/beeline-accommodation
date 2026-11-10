import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminContext, listingScope, bookingScope, messageScope } from "@/lib/adminAuth";
import { OtherHostsToggle } from "@/components/admin/OtherHostsToggle";
import { BookingsTable } from "@/components/admin/BookingsTable";
import { MonthCalendar, parseMonth } from "@/components/admin/MonthCalendar";
import { GuestContactLinks } from "@/components/admin/GuestContactLinks";
import { MarkHandledButton } from "@/components/admin/MarkHandledButton";
import { SubscriptionBadge } from "@/components/admin/SubscriptionBadge";
import { getLiveChecklist } from "@/lib/getLive";
import { refreshAllReadyForReview } from "@/lib/readyForReview";
import { isOnStartingUp } from "@/lib/startingUp";
import {
  BedIcon,
  BellIcon,
  CalendarCheckIcon,
  CalendarIcon,
  CheckIcon,
  HomeIcon,
  IconBadge,
  ListIcon,
  MailIcon,
  NoticeBar,
  SectionCard,
  StatTile,
} from "@/components/admin/DashUI";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; all?: string }>;
}) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  const { month: monthParam, all } = await searchParams;
  const showAll = ctx.isOwner && all === "1";
  const { year, month } = parseMonth(monthParam);

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const in30 = new Date(today.getTime() + 30 * DAY_MS);
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 1));
  const scope = bookingScope(ctx, showAll);
  const withListing = { listing: { select: { name: true } } };

  // Opening the owner's dashboard re-checks which hosts have finished their checklist, so the "Ready to go live"
  // notice is right even if the scheduled check has not run lately. Safe to repeat: it emails once per host.
  if (ctx.isOwner) await refreshAllReadyForReview();

  const [pending, soon, monthBookings, upcomingCount, listingCount, messages, host, enquiries, readyHosts] =
    await Promise.all([
      prisma.booking.findMany({
        where: { status: "PENDING", checkOut: { gte: today }, ...scope },
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
        where: { handled: false, ...messageScope(ctx, showAll) },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      ctx.hostId ? prisma.host.findUnique({ where: { id: ctx.hostId } }) : null,
      // People who asked to become a collaborator (owner only).
      ctx.isOwner ? prisma.hostEnquiry.findMany({ where: { status: "NEW" }, orderBy: { createdAt: "desc" }, take: 5 }) : [],
      // Hosts who have finished every Get live step and are waiting for the owner to approve them.
      ctx.isOwner
        ? prisma.host.findMany({
            where: { readyForReviewAt: { not: null }, liveApprovedAt: null },
            orderBy: { readyForReviewAt: "asc" },
            select: { id: true, name: true },
          })
        : [],
    ]);

  const getLive = ctx.hostId ? await getLiveChecklist(ctx.hostId) : null;

  return (
    <div>
      <div className="flex items-center gap-3">
        <IconBadge className="h-11 w-11">
          <HomeIcon />
        </IconBadge>
        <div>
          <h1 className="text-3xl font-bold leading-none tracking-tight">Dashboard</h1>
          <div className="mt-2 h-1 w-12 rounded-full bg-accent" />
        </div>
      </div>

      {ctx.isOwner && (
        <OtherHostsToggle showAll={showAll} showHref="/admin?all=1" hideHref="/admin" />
      )}

      {ctx.isOwner && (
        <NoticeBar
          icon={<BellIcon />}
          tone={enquiries.length > 0 ? "alert" : "calm"}
          href="/admin/enquiries"
          action={enquiries.length > 0 ? "Review and approve" : "Open requests"}
        >
          <strong>New host requests:</strong>{" "}
          {enquiries.length > 0
            ? `${enquiries.length === 5 ? "5 or more" : enquiries.length} waiting. ${enquiries
                .slice(0, 3)
                .map((e) => e.name)
                .join(", ")}${enquiries.length > 3 ? " and more" : ""}`
            : "none waiting"}
        </NoticeBar>
      )}

      {ctx.isOwner && readyHosts.length > 0 && (
        <NoticeBar
          icon={<CheckIcon />}
          tone="alert"
          href={readyHosts.length === 1 ? `/admin/hosts/${readyHosts[0].id}` : "/admin/hosts"}
          action="Review and approve"
        >
          <strong>Ready to go live:</strong>{" "}
          {readyHosts.length === 1
            ? `${readyHosts[0].name} has finished every step.`
            : `${readyHosts.length} hosts have finished every step. ${readyHosts
                .slice(0, 3)
                .map((h) => h.name)
                .join(", ")}${readyHosts.length > 3 ? " and more" : ""}`}
        </NoticeBar>
      )}

      {getLive && !getLive.approved && (
        <NoticeBar icon={<ListIcon />} tone="alert" href="/admin/get-live" action="Open checklist">
          <strong>Get your listings live:</strong>{" "}
          {getLive.allDone
            ? "all steps done. We’re checking everything over."
            : `${getLive.doneCount} of ${getLive.items.length} steps done.`}
        </NoticeBar>
      )}

      {host && (
        <NoticeBar icon={<CalendarCheckIcon />} href="/admin/subscription" action="Manage">
          Your Beeline subscription:{" "}
          <SubscriptionBadge status={host.subscriptionStatus} startingUp={isOnStartingUp(host)} />
        </NoticeBar>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Pending requests" value={pending.length} icon={<CalendarIcon />} tone="honey" href="/admin/bookings" />
        <StatTile label="Upcoming stays" value={upcomingCount} icon={<CalendarCheckIcon />} tone="dark" href="/admin/bookings" />
        <StatTile label="New messages" value={messages.length} icon={<MailIcon />} tone="cream" href="#messages" />
        <StatTile label="Listings" value={listingCount} icon={<BedIcon />} tone="dark" href="/admin/listings" />
      </div>

      {pending.length > 0 && (
        <SectionCard icon={<BellIcon />} title="Needs your response" subtitle="Booking requests waiting for a yes or no.">
          <BookingsTable bookings={pending} />
        </SectionCard>
      )}

      <SectionCard
        icon={<CalendarCheckIcon />}
        title="Next 30 days"
        subtitle="Stays arriving or in progress, soonest first."
        decorated
      >
        <BookingsTable bookings={soon} />
      </SectionCard>

      <SectionCard id="calendar" icon={<CalendarIcon />} title="Calendar">
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
      </SectionCard>

      {messages.length > 0 && (
        <SectionCard id="messages" icon={<MailIcon />} title="Messages from guests">
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.id} className="rounded-xl border border-card-border bg-soft/40 p-4 text-sm">
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
        </SectionCard>
      )}
    </div>
  );
}
