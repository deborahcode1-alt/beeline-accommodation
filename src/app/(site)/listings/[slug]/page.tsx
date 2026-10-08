import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { publicListingWhere } from "@/lib/visibility";
import { getUnavailableNights } from "@/lib/availability";
import { PhotoGallery } from "@/components/PhotoGallery";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { ContactHostForm } from "@/components/ContactHostForm";
import { stayTypeLabel } from "@/lib/stayType";
import { propertyTypeLabel } from "@/lib/propertyType";
import { bedroomLabel, bathroomLabel, parkingShort } from "@/lib/listingFacts";
import { profileFacts } from "@/lib/hostProfile";
import { DEFAULT_CANCELLATION_POLICY } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await prisma.listing.findFirst({
    where: { slug, ...publicListingWhere() },
    select: { name: true, tagline: true, description: true },
  });
  if (!listing) return {};

  const description = listing.tagline || listing.description.slice(0, 155);
  return {
    title: listing.name,
    description,
    openGraph: { title: listing.name, description },
  };
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = await prisma.listing.findFirst({
    where: { slug, ...publicListingWhere() },
    include: { photos: { orderBy: { order: "asc" } }, host: true, area: true },
  });

  if (!listing) notFound();

  const unavailableSet = await getUnavailableNights(listing.id);
  const amenities: string[] = JSON.parse(listing.amenities || "[]");
  const policy = listing.cancellationPolicy || DEFAULT_CANCELLATION_POLICY;
  const policyParagraphs = policy.split("\n\n").filter(Boolean);
  const host = listing.host;
  const phone = host?.publicPhone?.replace(/[^\d+]/g, "");
  const backHref = listing.area ? `/${listing.area.slug}` : "/";

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <nav className="text-sm text-muted">
        <Link href="/" className="hover:underline">Beeline</Link>
        {listing.area && (
          <>
            {" / "}
            <Link href={backHref} className="hover:underline">
              {listing.area.name} Accommodation
            </Link>
          </>
        )}
      </nav>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-header-bg px-2.5 py-1 text-xs font-medium text-header-fg">
          {propertyTypeLabel(listing.propertyType)}
        </span>
        <span className="rounded-full bg-soft px-2.5 py-1 text-xs font-medium">
          {stayTypeLabel(listing.stayType)}
        </span>
        {listing.petFriendly && (
          <span className="rounded-full bg-soft px-2.5 py-1 text-xs font-medium">Pet friendly</span>
        )}
        <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-fg">
          {listing.bookingMode === "INSTANT" ? "Instant booking" : "Request to book"}
        </span>
      </div>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{listing.name}</h1>
      {listing.tagline && <p className="mt-1 text-muted">{listing.tagline}</p>}
      {listing.address && <p className="mt-1 text-sm text-muted">{listing.address}</p>}

      <div className="mt-6">
        <PhotoGallery photos={listing.photos} name={listing.name} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap gap-4 border-b border-card-border pb-6 text-sm">
            <span>{bedroomLabel(listing.bedrooms)}</span>
            <span>&middot;</span>
            <span>{bathroomLabel(listing.baths)}</span>
            <span>&middot;</span>
            <span>{propertyTypeLabel(listing.propertyType)}</span>
            <span>&middot;</span>
            <span>{listing.petFriendly ? "Pet friendly" : "No pets"}</span>
            <span>&middot;</span>
            <span>{parkingShort(listing.parking) ?? "No parking"}</span>
            <span>&middot;</span>
            <span>{listing.beds} bed{listing.beds === 1 ? "" : "s"}, sleeps {listing.maxGuests}</span>
          </div>

          <div className="prose prose-neutral mt-6 max-w-none whitespace-pre-line">
            {listing.description}
          </div>

          {amenities.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold">Amenities</h2>
              <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted">
                {amenities.map((a) => (
                  <li key={a}>&bull; {a}</li>
                ))}
              </ul>
            </div>
          )}

          <section id="host" className="mt-10 rounded-xl border border-card-border bg-soft p-6">
            <h2 className="text-lg font-semibold">Talk to your host</h2>
            <p className="mt-1 text-sm text-muted">
              Ask a question or make arrangements before you book. You&apos;re dealing with the
              host directly.
            </p>
            {host && (
              <div className="mt-4 flex items-start gap-4">
                {host.photoUrl && (
                  <Image
                    src={host.photoUrl}
                    alt={host.name}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                )}
                <div className="text-sm">
                  <p className="font-semibold">Hosted by {host.name}</p>
                  {host.blurb && <p className="mt-1 italic">&ldquo;{host.blurb}&rdquo;</p>}
                  {host.bio && <p className="mt-2 whitespace-pre-line text-muted">{host.bio}</p>}
                </div>
              </div>
            )}
            {host && profileFacts(host).length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2 text-xs">
                {profileFacts(host).map((fact) => (
                  <li key={fact} className="rounded-full border border-card-border bg-background px-3 py-1">
                    {fact}
                  </li>
                ))}
              </ul>
            )}
            {host && (phone || host.publicEmail || host.website) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover"
                  >
                    Call {host.publicPhone}
                  </a>
                )}
                {phone && (
                  <a
                    href={`sms:${phone}`}
                    className="rounded-md border border-card-border bg-background px-4 py-2 text-sm font-semibold transition hover:border-accent"
                  >
                    Text
                  </a>
                )}
                {host.publicEmail && (
                  <a
                    href={`mailto:${host.publicEmail}`}
                    className="rounded-md border border-card-border bg-background px-4 py-2 text-sm font-semibold transition hover:border-accent"
                  >
                    Email
                  </a>
                )}
                {host.website && (
                  <a
                    href={host.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-card-border bg-background px-4 py-2 text-sm font-semibold transition hover:border-accent"
                  >
                    Visit their website
                  </a>
                )}
              </div>
            )}
            <div className="mt-5 border-t border-card-border pt-5">
              <h3 className="text-sm font-semibold">Send the host a message</h3>
              <div className="mt-3">
                <ContactHostForm listingId={listing.id} />
              </div>
            </div>
          </section>

          <div className="mt-8">
            <h2 className="text-lg font-semibold">Terms &amp; conditions</h2>
            <div className="mt-3 space-y-2 text-sm text-muted">
              {policyParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>

        <div>
          <AvailabilityCalendar
            slug={listing.slug}
            instant={listing.bookingMode === "INSTANT"}
            basePrice={listing.basePrice}
            cleaningFee={listing.cleaningFee}
            minNights={listing.minNights}
            maxGuests={listing.maxGuests}
            unavailableNights={[...unavailableSet]}
          />
        </div>
      </div>

      <div className="mt-12 border-t border-card-border pt-8 text-center">
        <Link
          href={backHref}
          className="inline-block rounded-md border border-card-border px-5 py-2.5 text-sm font-medium transition hover:bg-foreground/5"
        >
          &larr; Back to {listing.area ? `${listing.area.name} Accommodation` : "home"}
        </Link>
      </div>
    </div>
  );
}
