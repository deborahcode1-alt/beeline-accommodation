import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { AddHostForm } from "@/components/admin/AddHostForm";
import { SubscriptionBadge } from "@/components/admin/SubscriptionBadge";
import { StartingUpAdmin } from "@/components/admin/StartingUpAdmin";
import { InboxIcon, PageHeader, SectionCard, UsersIcon, rowCard } from "@/components/admin/DashUI";
import { formatDate } from "@/lib/format";
import { STARTING_UP_MONTHS } from "@/lib/pricing";
import { startingUpOffered } from "@/lib/settings";
import { daysUntil, isOnStartingUp } from "@/lib/startingUp";

export const dynamic = "force-dynamic";

export default async function HostsPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  if (!ctx.isOwner) redirect("/admin");

  const [hosts, enquiries] = await Promise.all([
    prisma.host.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { listings: true, adminUsers: true } } },
    }),
    prisma.hostEnquiry.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  const offered = await startingUpOffered();
  const startingUpRows = hosts
    .filter((h) => isOnStartingUp(h))
    .sort((a, b) => (a.startingUpEndsAt?.getTime() ?? 0) - (b.startingUpEndsAt?.getTime() ?? 0))
    .map((h) => ({
      id: h.id,
      name: h.name,
      endsLabel: h.startingUpEndsAt ? `free until ${formatDate(h.startingUpEndsAt)}` : "free",
      daysLeft: h.startingUpEndsAt ? daysUntil(h.startingUpEndsAt) : null,
      invitedLabel: h.startingUpInvitedAt ? formatDate(h.startingUpInvitedAt) : null,
    }));

  return (
    <div>
      <PageHeader icon={<UsersIcon />} title="Hosts" />

      <div className="mt-4">
        <AddHostForm />
      </div>

      <StartingUpAdmin offered={offered} rows={startingUpRows} months={STARTING_UP_MONTHS} />

      <div className="mt-6 space-y-3">
        {hosts.map((h) => (
          <Link
            key={h.id}
            href={`/admin/hosts/${h.id}`}
            className={`flex items-center justify-between gap-3 ${rowCard} ${
              h.readyForReviewAt && !h.liveApprovedAt
                ? "!border-accent/70 bg-gradient-to-r from-accent/20 via-soft to-white"
                : ""
            }`}
          >
            <div>
              <p className="font-medium">
                {h.name}{" "}
                {h.readyForReviewAt && !h.liveApprovedAt && (
                  <span className="rounded-full bg-header-bg px-2 py-0.5 text-xs font-semibold text-accent">
                    Ready to go live
                  </span>
                )}
              </p>
              <p className="text-sm text-muted">
                {h._count.listings} listing(s) &middot; {h._count.adminUsers} sign-in(s)
              </p>
            </div>
            <SubscriptionBadge status={h.subscriptionStatus} startingUp={isOnStartingUp(h)} />
          </Link>
        ))}
      </div>

      <SectionCard
        icon={<InboxIcon />}
        title="People asking to list"
        subtitle="From the Become a collaborator page, newest first."
      >
      <p className="-mt-2 mb-3 text-sm">
        <Link href="/admin/enquiries" className="text-accent-deep underline">
          Review and approve them here
        </Link>
      </p>
      <div className="space-y-3">
        {enquiries.length === 0 && <p className="text-sm text-muted">None yet.</p>}
        {enquiries.map((e) => {
          const photos: string[] = JSON.parse(e.photoUrls || "[]");
          return (
          <div key={e.id} className="rounded-xl border border-card-border bg-soft/40 p-4 text-sm">
            <p className="flex flex-wrap items-center gap-2 font-medium">
              <span>
                {e.name} <span className="font-normal text-muted">&middot; {e.area}</span>
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  e.status === "NEW" ? "bg-accent text-accent-fg" : "bg-foreground/10 text-muted"
                }`}
              >
                {e.status === "NEW" ? "New" : e.status === "APPROVED" ? "Approved" : e.status === "DECLINED" ? "Declined" : e.status}
              </span>
            </p>
            <p className="mt-1">
              <a href={`mailto:${e.email}`} className="text-accent-deep underline">
                {e.email}
              </a>
              {e.phone && <span className="text-muted"> &middot; {e.phone}</span>}
            </p>
            {e.details && <p className="mt-2 whitespace-pre-line text-muted">{e.details}</p>}
            {photos.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted">{photos.length} photo(s), click to open full size</p>
                <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {photos.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="relative block aspect-square overflow-hidden rounded-md border border-card-border">
                      <Image src={url} alt="House photo" fill sizes="120px" className="object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>
      </SectionCard>
    </div>
  );
}
