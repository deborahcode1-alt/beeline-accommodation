import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/ListingCard";
import { SITE_TAGLINE } from "@/lib/site";
import {
  BEDROOM_TIERS,
  PROPERTY_TYPES,
  isPropertyType,
  tierFor,
} from "@/lib/propertyType";

export const dynamic = "force-dynamic";

function filterHref(beds: number | null, type: string | null) {
  const params = new URLSearchParams();
  if (beds) params.set("beds", String(beds));
  if (type) params.set("type", type);
  const qs = params.toString();
  return `/${qs ? `?${qs}` : ""}#listings`;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ beds?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const bedsParam = Number(sp.beds);
  const activeBeds =
    Number.isInteger(bedsParam) && bedsParam >= 1 && bedsParam <= 6 ? bedsParam : null;
  const activeType = isPropertyType(sp.type) ? sp.type : null;

  const all = await prisma.listing.findMany({
    where: { published: true },
    orderBy: { basePrice: "asc" },
    include: { photos: { orderBy: { order: "asc" }, take: 1 } },
  });

  const listings = all.filter(
    (l) =>
      (activeBeds === null || tierFor(l.bedrooms) === activeBeds) &&
      (activeType === null || l.propertyType === activeType)
  );

  // Types with no listings are hidden; every bedroom size (1 to 6+) stays visible.
  const sizeTiles = BEDROOM_TIERS.map((t) => ({
    bedrooms: t.bedrooms,
    count: all.filter((l) => tierFor(l.bedrooms) === t.bedrooms).length,
  }));
  const typeTiles = PROPERTY_TYPES.map((t) => ({
    ...t,
    count: all.filter((l) => l.propertyType === t.value).length,
  }));

  return (
    <div>
      <section className="relative h-[65vh] min-h-[460px] overflow-hidden">
        <Image
          src="/hero-empire.png"
          alt="The Empire, a heritage guesthouse in Gympie"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 flex justify-center px-6 pb-10 sm:justify-start sm:pl-10">
          <div className="max-w-lg rounded-sm bg-header-bg/90 px-8 py-7 text-center text-header-fg shadow-lg backdrop-blur-sm sm:text-left">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{SITE_TAGLINE}</h1>
            <p className="mt-3 text-sm text-header-fg/80">
              Check real-time availability and book direct &mdash; from budget rooms to whole
              houses, all in one place.
            </p>
          </div>
        </div>
      </section>

      <section id="find" className="border-b border-card-border bg-foreground/[0.03]">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <h2 className="text-xl font-semibold">Find your stay</h2>

          <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted">
            How many bedrooms?
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {sizeTiles.map((t) => {
              const label = `${t.bedrooms === 6 ? "6+" : t.bedrooms} bedroom${t.bedrooms === 1 ? "" : "s"}`;
              if (t.count === 0) {
                return (
                  <span
                    key={t.bedrooms}
                    aria-disabled="true"
                    className="cursor-default rounded-sm border border-card-border bg-background px-3 py-3 text-center text-sm font-semibold opacity-40"
                  >
                    {label}
                  </span>
                );
              }
              const active = activeBeds === t.bedrooms;
              return (
                <Link
                  key={t.bedrooms}
                  href={filterHref(active ? null : t.bedrooms, activeType)}
                  scroll={false}
                  aria-current={active ? "true" : undefined}
                  className={`rounded-sm border px-3 py-3 text-center text-sm font-semibold transition ${
                    active
                      ? "border-accent bg-accent text-white"
                      : "border-card-border bg-background hover:border-accent"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <p className="mt-6 text-xs font-medium uppercase tracking-wide text-muted">
            Style of accommodation
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {typeTiles.map((t) => {
              if (t.count === 0) {
                return (
                  <span
                    key={t.value}
                    aria-disabled="true"
                    className="cursor-default rounded-sm border border-card-border bg-background px-4 py-3 opacity-40"
                  >
                    <span className="block text-sm font-semibold">{t.label}</span>
                    <span className="block text-xs text-muted">{t.blurb}</span>
                  </span>
                );
              }
              const active = activeType === t.value;
              return (
                <Link
                  key={t.value}
                  href={filterHref(activeBeds, active ? null : t.value)}
                  scroll={false}
                  aria-current={active ? "true" : undefined}
                  className={`rounded-sm border px-4 py-3 transition ${
                    active
                      ? "border-accent bg-accent text-white"
                      : "border-card-border bg-background hover:border-accent"
                  }`}
                >
                  <span className="block text-sm font-semibold">{t.label}</span>
                  <span className={`block text-xs ${active ? "text-white/80" : "text-muted"}`}>
                    {t.blurb}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="listings" className="mx-auto max-w-5xl px-6 py-16">
        {(activeBeds !== null || activeType !== null) && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">
              {listings.length} place{listings.length === 1 ? "" : "s"} match your choices
            </p>
            <Link href="/#listings" scroll={false} className="text-sm text-accent-deep hover:underline">
              Clear filters
            </Link>
          </div>
        )}
        {all.length === 0 ? (
          <p className="text-center text-muted">No listings published yet. Check back soon.</p>
        ) : listings.length === 0 ? (
          <p className="text-center text-muted">
            Nothing matches that combination &mdash;{" "}
            <Link href="/#listings" className="text-accent-deep hover:underline">
              clear the filters
            </Link>{" "}
            to see everything.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard
                key={l.id}
                slug={l.slug}
                name={l.name}
                tagline={l.tagline}
                basePrice={l.basePrice}
                maxGuests={l.maxGuests}
                bedrooms={l.bedrooms}
                stayType={l.stayType}
                coverPhoto={l.photos[0]?.url ?? null}
              />
            ))}
          </div>
        )}
      </section>

      <section id="contact" className="border-t border-card-border py-16">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-2xl font-semibold">Questions before you book?</h2>
          <p className="mt-2 text-muted">
            Open any listing below and send a request &mdash; the host reviews every booking
            personally.
          </p>
        </div>
      </section>
    </div>
  );
}
