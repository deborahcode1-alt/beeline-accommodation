import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { publicListingWhere } from "@/lib/visibility";
import { ListingCard } from "@/components/ListingCard";
import { BEDROOM_TIERS, PROPERTY_TYPES, isPropertyType, tierFor } from "@/lib/propertyType";

export const dynamic = "force-dynamic";

async function getArea(slug: string) {
  const area = await prisma.area.findUnique({ where: { slug } });
  return area && area.published ? area : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ area: string }>;
}): Promise<Metadata> {
  const { area: slug } = await params;
  const area = await getArea(slug);
  if (!area) return {};
  const title = `${area.name} Accommodation`;
  const description =
    area.headline ??
    `Rooms, houses and farm stays in ${area.name}. Contact local hosts directly or book fast.`;
  return {
    title,
    description,
    alternates: { canonical: `/${area.slug}` },
    openGraph: { title, description },
  };
}

function filterHref(slug: string, beds: number | null, type: string | null, pets: boolean) {
  const params = new URLSearchParams();
  if (beds) params.set("beds", String(beds));
  if (type) params.set("type", type);
  if (pets) params.set("pets", "1");
  const qs = params.toString();
  return `/${slug}${qs ? `?${qs}` : ""}#stays`;
}

const tile = (active: boolean) =>
  `rounded-lg border px-3 py-3 text-center text-sm font-semibold transition ${
    active
      ? "border-accent bg-accent text-accent-fg"
      : "border-card-border bg-background hover:border-accent"
  }`;

export default async function AreaPage({
  params,
  searchParams,
}: {
  params: Promise<{ area: string }>;
  searchParams: Promise<{ beds?: string; type?: string; pets?: string }>;
}) {
  const { area: slug } = await params;
  const sp = await searchParams;
  const area = await getArea(slug);
  if (!area) notFound();

  const bedsParam = Number(sp.beds);
  const activeBeds =
    Number.isInteger(bedsParam) && bedsParam >= 1 && bedsParam <= 6 ? bedsParam : null;
  const activeType = isPropertyType(sp.type) ? sp.type : null;
  const activePets = sp.pets === "1";

  const all = await prisma.listing.findMany({
    where: { ...publicListingWhere(), areaId: area.id },
    orderBy: { basePrice: "asc" },
    include: { photos: { orderBy: { order: "asc" }, take: 1 } },
  });

  const listings = all.filter(
    (l) =>
      (activeBeds === null || tierFor(l.bedrooms) === activeBeds) &&
      (activeType === null || l.propertyType === activeType) &&
      (!activePets || l.petFriendly)
  );
  const filtering = activeBeds !== null || activeType !== null || activePets;

  const sizeTiles = BEDROOM_TIERS.map((t) => ({
    bedrooms: t.bedrooms,
    count: all.filter((l) => tierFor(l.bedrooms) === t.bedrooms).length,
  }));
  const typeTiles = PROPERTY_TYPES.map((t) => ({
    ...t,
    count: all.filter((l) => l.propertyType === t.value).length,
  }));
  const petCount = all.filter((l) => l.petFriendly).length;

  return (
    <div>
      <section className="relative overflow-hidden bg-header-bg text-header-fg">
        {area.heroImage && (
          <Image
            src={area.heroImage}
            alt={`${area.name} accommodation`}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-60"
          />
        )}
        <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            {area.name}, {area.state}
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
            {area.name} Accommodation
          </h1>
          {area.headline && (
            <p className="mt-3 max-w-2xl text-lg text-header-fg/90">{area.headline}</p>
          )}
        </div>
      </section>

      <section className="border-b border-card-border bg-soft">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 py-6 text-sm sm:grid-cols-3">
          <p>
            <strong className="block text-base">Talk to the host first</strong>
            Every listing has the host&apos;s own contact details. Ask questions and make
            arrangements directly.
          </p>
          <p>
            <strong className="block text-base">Fast booking</strong>
            Some stays confirm instantly. Others are request-to-book, answered by the host
            personally.
          </p>
          <p>
            <strong className="block text-base">Local hosts, no commission</strong>
            You deal with the host, and they keep what you pay.
          </p>
        </div>
      </section>

      <section id="find" className="mx-auto max-w-6xl px-6 pt-10">
        <h2 className="text-xl font-semibold">Find your stay in {area.name}</h2>

        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">Bedrooms</p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {sizeTiles.map((t) => {
            const label = `${t.bedrooms === 6 ? "6+" : t.bedrooms} bedroom${t.bedrooms === 1 ? "" : "s"}`;
            if (t.count === 0) {
              return (
                <span
                  key={t.bedrooms}
                  aria-disabled="true"
                  className={`${tile(false)} cursor-default opacity-40`}
                >
                  {label}
                </span>
              );
            }
            const active = activeBeds === t.bedrooms;
            return (
              <Link
                key={t.bedrooms}
                href={filterHref(area.slug, active ? null : t.bedrooms, activeType, activePets)}
                scroll={false}
                aria-current={active ? "true" : undefined}
                className={tile(active)}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-muted">
          Style of accommodation
        </p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {typeTiles.map((t) => {
            if (t.count === 0) {
              return (
                <span
                  key={t.value}
                  aria-disabled="true"
                  className={`${tile(false)} cursor-default opacity-40`}
                >
                  {t.label}
                </span>
              );
            }
            const active = activeType === t.value;
            return (
              <Link
                key={t.value}
                href={filterHref(area.slug, activeBeds, active ? null : t.value, activePets)}
                scroll={false}
                aria-current={active ? "true" : undefined}
                className={tile(active)}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-6">
          {petCount === 0 ? (
            <span
              aria-disabled="true"
              className={`${tile(false)} inline-block cursor-default opacity-40`}
            >
              Pet friendly
            </span>
          ) : (
            <Link
              href={filterHref(area.slug, activeBeds, activeType, !activePets)}
              scroll={false}
              aria-current={activePets ? "true" : undefined}
              className={`${tile(activePets)} inline-block`}
            >
              Pet friendly
            </Link>
          )}
        </div>
      </section>

      <section id="stays" className="mx-auto max-w-6xl px-6 py-12">
        {filtering && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">
              {listings.length} place{listings.length === 1 ? "" : "s"} match your choices
            </p>
            <Link
              href={`/${area.slug}#stays`}
              scroll={false}
              className="text-sm text-accent-deep hover:underline"
            >
              Clear filters
            </Link>
          </div>
        )}
        {all.length === 0 ? (
          <p className="text-center text-muted">
            No stays listed in {area.name} yet. Check back soon.
          </p>
        ) : listings.length === 0 ? (
          <p className="text-center text-muted">
            Nothing matches that combination &mdash;{" "}
            <Link href={`/${area.slug}#stays`} className="text-accent-deep hover:underline">
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
                areaName={`${area.name}, ${area.state}`}
                basePrice={l.basePrice}
                bedrooms={l.bedrooms}
                baths={l.baths}
                parking={l.parking}
                propertyType={l.propertyType}
                petFriendly={l.petFriendly}
                coverPhoto={l.photos[0]?.url ?? null}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
