import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { AddHostForm } from "@/components/admin/AddHostForm";
import { SubscriptionBadge } from "@/components/admin/SubscriptionBadge";

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

  return (
    <div>
      <h1 className="text-2xl font-semibold">Hosts</h1>

      <div className="mt-4">
        <AddHostForm />
      </div>

      <div className="mt-6 space-y-3">
        {hosts.map((h) => (
          <Link
            key={h.id}
            href={`/admin/hosts/${h.id}`}
            className="flex items-center justify-between rounded-lg border border-card-border p-4 hover:border-accent"
          >
            <div>
              <p className="font-medium">{h.name}</p>
              <p className="text-sm text-muted">
                {h._count.listings} listing(s) &middot; {h._count.adminUsers} sign-in(s)
              </p>
            </div>
            <SubscriptionBadge status={h.subscriptionStatus} />
          </Link>
        ))}
      </div>

      <h2 className="mt-12 text-lg font-semibold">People asking to list</h2>
      <p className="mt-1 text-sm text-muted">From the List your property page, newest first.</p>
      <div className="mt-3 space-y-3">
        {enquiries.length === 0 && <p className="text-sm text-muted">None yet.</p>}
        {enquiries.map((e) => {
          const photos: string[] = JSON.parse(e.photoUrls || "[]");
          return (
          <div key={e.id} className="rounded-lg border border-card-border p-4 text-sm">
            <p className="font-medium">
              {e.name} <span className="font-normal text-muted">&middot; {e.area}</span>
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
    </div>
  );
}
