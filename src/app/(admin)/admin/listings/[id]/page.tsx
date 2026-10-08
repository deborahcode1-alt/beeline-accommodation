import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminContext, canAccessHost } from "@/lib/adminAuth";
import { ListingForm } from "@/components/admin/ListingForm";
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
      bookings: { orderBy: { checkIn: "asc" } },
    },
  });
  if (!listing || !canAccessHost(ctx, listing.hostId)) notFound();
  const areas = await prisma.area.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

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

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Bookings</h2>
        <p className="mt-1 text-sm text-muted">Soonest upcoming first.</p>
        <div className="mt-3">
          <BookingsTable
            bookings={listing.bookings.map((b) => ({ ...b, listing: { name: listing.name } }))}
            showListingColumn={false}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Photos</h2>
        <div className="mt-3">
          <PhotoManager listingId={listing.id} photos={listing.photos} />
        </div>
      </section>

      <section className="mt-10 max-w-2xl">
        <h2 className="text-lg font-semibold">Details</h2>
        <div className="mt-3">
          <ListingForm
            areas={areas}
            isOwner={ctx.isOwner}
            initial={{
              id: listing.id,
              name: listing.name,
              tagline: listing.tagline ?? "",
              description: listing.description,
              cancellationPolicy: listing.cancellationPolicy ?? "",
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
