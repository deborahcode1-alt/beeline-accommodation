import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { getAdminContext, listingScope } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  const { q: rawQ } = await searchParams;
  const q = (rawQ ?? "").trim().slice(0, 100);

  const listings = await prisma.listing.findMany({
    where: {
      ...listingScope(ctx),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { host: { name: { contains: q, mode: "insensitive" } } },
              { area: { name: { contains: q, mode: "insensitive" } } },
              { address: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      area: { select: { id: true, name: true } },
      host: { select: { id: true, name: true } },
      _count: { select: { bookings: true } },
    },
  });

  // Area -> host -> listings, each level in alphabetical order. Unplaced ones go last.
  type Row = (typeof listings)[number];
  const areas = new Map<string, { title: string; hosts: Map<string, { name: string; rows: Row[] }> }>();
  for (const l of listings) {
    const areaKey = l.area?.id ?? "none";
    const areaEntry = areas.get(areaKey) ?? {
      title: l.area ? `${l.area.name} Accommodation` : "No area",
      hosts: new Map(),
    };
    const hostKey = l.host?.id ?? "none";
    const hostEntry = areaEntry.hosts.get(hostKey) ?? { name: l.host?.name ?? "No host", rows: [] };
    hostEntry.rows.push(l);
    areaEntry.hosts.set(hostKey, hostEntry);
    areas.set(areaKey, areaEntry);
  }
  const sortedAreas = [...areas.entries()].sort(([ak, a], [bk, b]) =>
    ak === "none" ? 1 : bk === "none" ? -1 : a.title.localeCompare(b.title)
  );

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

      <form method="get" className="mt-4 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by area, host name or listing, e.g. Gympie or Reuben"
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
            href="/admin/listings"
            className="rounded-md border border-card-border px-4 py-2 text-sm font-medium hover:border-accent"
          >
            Clear
          </Link>
        )}
      </form>
      {q && (
        <p className="mt-2 text-sm text-muted">
          {listings.length} listing{listings.length === 1 ? "" : "s"} matching &ldquo;{q}&rdquo;
        </p>
      )}

      <div className="mt-6 space-y-8">
        {sortedAreas.map(([areaKey, area]) => (
          <section key={areaKey}>
            <h2 className="border-b border-card-border pb-1 text-lg font-semibold">{area.title}</h2>
            <div className="mt-4 space-y-5">
              {[...area.hosts.entries()]
                .sort(([ak, a], [bk, b]) =>
                  ak === "none" ? 1 : bk === "none" ? -1 : a.name.localeCompare(b.name)
                )
                .map(([hostKey, host]) => (
                  <div key={hostKey}>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                      {hostKey !== "none" && ctx.isOwner ? (
                        <Link href={`/admin/hosts/${hostKey}`} className="hover:underline">
                          {host.name}
                        </Link>
                      ) : (
                        host.name
                      )}
                    </h3>
                    <div className="mt-2 space-y-2">
                      {host.rows
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((l) => (
                          <Link
                            key={l.id}
                            href={`/admin/listings/${l.id}`}
                            className="flex items-center justify-between rounded-lg border border-card-border p-4 hover:border-accent"
                          >
                            <div>
                              <p className="font-medium">
                                {l.name}{" "}
                                {!l.published && <span className="text-xs text-muted">(draft)</span>}
                              </p>
                              <p className="text-sm text-muted">
                                {formatMoney(l.basePrice)}/night &middot; {l._count.bookings} booking(s)
                              </p>
                            </div>
                            <span className="text-sm text-muted">Manage &rarr;</span>
                          </Link>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        ))}
        {listings.length === 0 && (
          <p className="text-sm text-muted">
            {q
              ? "Nothing matches that search."
              : "No listings yet. Create your first one to start taking bookings."}
          </p>
        )}
      </div>
    </div>
  );
}
