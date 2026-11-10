import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminContext, canAccessHost } from "@/lib/adminAuth";
import { startOfToday } from "@/lib/retention";
import { ListingForm } from "@/components/admin/ListingForm";
import { getNextStep } from "@/lib/getLive";
import { isPolicyType } from "@/lib/cancellationPolicies";
import { PhotoManager } from "@/components/admin/PhotoManager";
import { BookingsTable } from "@/components/admin/BookingsTable";
import { DeleteListingButton } from "@/components/admin/DeleteListingButton";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { order: "asc" } },
      bookings: { where: { checkOut: { gte: startOfToday() } }, orderBy: { checkIn: "asc" } },
      icalImports: { select: { lastSyncedAt: true, lastError: true } },
      host: { select: { calendarsSkippedAt: true } },
    },
  });
  if (!listing || !canAccessHost(ctx, listing.hostId)) notFound();
  const areas = await prisma.area.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  // What this listing still needs before the host can go live: the same rules as the Get live checklist.
  const gaps: { text: string; href: string }[] = [];
  if (listing.photos.length < 1) gaps.push({ text: "Add at least one photo", href: "#photos" });
  if (listing.description.trim().length < 40) {
    gaps.push({ text: "Write a description of a few sentences", href: "#details" });
  }
  if (!(listing.basePrice > 0)) gaps.push({ text: "Set a nightly price", href: "#details" });
  if (!listing.cancellationPolicy?.trim()) gaps.push({ text: "Choose a cancellation policy", href: "#details" });
  const calendarDone =
    !!listing.host?.calendarsSkippedAt || listing.icalImports.some((i) => i.lastSyncedAt && !i.lastError);
  if (!calendarDone) {
    gaps.push({
      text: "Connect your other calendars, or say you don't list anywhere else",
      href: `/admin/listings/${listing.id}/calendar`,
    });
  }

  // A host who is setting up gets a Next button after saving, once this listing has everything it needs.
  // The owner's view has none.
  const isHostView = !ctx.isOwner && !!ctx.hostId;
  const next = isHostView && gaps.length === 0 ? await getNextStep(ctx.hostId!) : undefined;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{listing.name}</h1>
          <Link
            href={`/listings/${listing.slug}`}
            target="_blank"
            className="text-sm text-muted hover:underline"
          >
            View public page &rarr;
          </Link>
        </div>
        <Link
          href={`/admin/listings/${listing.id}/calendar`}
          className="rounded-md border border-card-border px-4 py-2 text-sm font-medium"
        >
          Calendar &amp; sync
        </Link>
      </div>

      {isHostView && (
        <div
          className={`mt-6 rounded-lg border p-4 text-sm ${gaps.length === 0 ? "border-accent bg-soft" : "border-card-border"}`}
        >
          {gaps.length === 0 ? (
            <p>
              <strong>This listing has everything it needs.</strong> Press Save changes below if you have edited
              anything, then use the Next button.
            </p>
          ) : (
            <>
              <p className="font-medium">Still to do on this listing:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {gaps.map((g) => (
                  <li key={g.text}>
                    <Link href={g.href} className="text-accent-deep underline">
                      {g.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-3">
            <Link href="/admin/get-live" className="text-muted hover:underline">
              &larr; Back to your checklist
            </Link>
          </p>
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Bookings</h2>
        <p className="mt-1 text-sm text-muted">
          Current and upcoming, soonest first.{" "}
          <Link
            href={`/admin/bookings?view=archive&q=${encodeURIComponent(listing.name)}`}
            className="text-accent-deep hover:underline"
          >
            See finished stays in the archive
          </Link>
        </p>
        <div className="mt-3">
          <BookingsTable
            bookings={listing.bookings.map((b) => ({ ...b, listing: { name: listing.name } }))}
            showListingColumn={false}
          />
        </div>
      </section>

      <section id="photos" className="mt-10 scroll-mt-4">
        <h2 className="text-lg font-semibold">Photos</h2>
        <div className="mt-3">
          <PhotoManager listingId={listing.id} photos={listing.photos} />
        </div>
      </section>

      <section id="details" className="mt-10 max-w-2xl scroll-mt-4">
        <h2 className="text-lg font-semibold">Details</h2>
        <div className="mt-3">
          <ListingForm
            areas={areas}
            isOwner={ctx.isOwner}
            next={next}
            initial={{
              id: listing.id,
              name: listing.name,
              tagline: listing.tagline ?? "",
              description: listing.description,
              cancellationPolicy: listing.cancellationPolicy ?? "",
              // Written before the options existed: keep the host's own text as "write my own".
              cancellationPolicyType: isPolicyType(listing.cancellationPolicyType)
                ? listing.cancellationPolicyType
                : listing.cancellationPolicy
                  ? "custom"
                  : "",
              cancellationNotes: listing.cancellationNotes ?? "",
              address: listing.address ?? "",
              stayType: listing.stayType,
              propertyType: listing.propertyType,
              petFriendly: listing.petFriendly,
              parking: listing.parking as "NONE" | "STREET" | "OFF_STREET" | "COVERED",
              bookingMode: listing.bookingMode,
              areaId: listing.areaId,
              maxGuests: listing.maxGuests,
              bedrooms: listing.bedrooms,
              beds: listing.beds,
              baths: listing.baths,
              basePrice: listing.basePrice,
              cleaningFee: listing.cleaningFee,
              minNights: listing.minNights,
              amenities: JSON.parse(listing.amenities || "[]"),
              published: listing.published,
              hostId: listing.hostId,
            }}
          />
        </div>
      </section>

      <div className="mt-10 border-t border-card-border pt-6">
        <DeleteListingButton listingId={listing.id} name={listing.name} />
      </div>
    </div>
  );
}
