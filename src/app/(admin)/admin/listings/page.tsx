import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { getAdminContext, listingScope } from "@/lib/adminAuth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminListingsPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  const listings = await prisma.listing.findMany({
    where: listingScope(ctx),
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bookings: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Listings</h1>
        <Link
          href="/admin/listings/new"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent-hover"
        >
          New listing
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {listings.map((l) => (
          <Link
            key={l.id}
            href={`/admin/listings/${l.id}`}
            className="flex items-center justify-between rounded-lg border border-card-border p-4 hover:bg-foreground/5"
          >
            <div>
              <p className="font-medium">
                {l.name} {!l.published && <span className="text-xs text-muted">(draft)</span>}
              </p>
              <p className="text-sm text-muted">
                {formatMoney(l.basePrice)}/night &middot; {l._count.bookings} booking(s)
              </p>
            </div>
            <span className="text-sm text-muted">Manage &rarr;</span>
          </Link>
        ))}
        {listings.length === 0 && (
          <p className="text-sm text-muted">
            No listings yet. Create your first one to start taking bookings.
          </p>
        )}
      </div>
    </div>
  );
}
