import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { publicListingWhere } from "@/lib/visibility";
import { BookingForm } from "@/components/BookingForm";
import { DEFAULT_CANCELLATION_POLICY } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book your stay",
  robots: { index: false, follow: false },
};

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;

  const listing = await prisma.listing.findFirst({
    where: { slug, ...publicListingWhere() },
  });
  if (!listing) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Book {listing.name}</h1>
      <p className="mt-1 text-sm text-muted">
        {listing.bookingMode === "INSTANT"
          ? "This is an instant booking — your dates are confirmed as soon as you submit."
          : "This sends a request to the host — it isn't confirmed until they accept."}
      </p>

      <div className="mt-8">
        <BookingForm
          listingId={listing.id}
          listingName={listing.name}
          instant={listing.bookingMode === "INSTANT"}
          basePrice={listing.basePrice}
          cleaningFee={listing.cleaningFee}
          minNights={listing.minNights}
          maxGuests={listing.maxGuests}
          cancellationPolicy={listing.cancellationPolicy || DEFAULT_CANCELLATION_POLICY}
          initialCheckIn={query.checkIn || ""}
          initialCheckOut={query.checkOut || ""}
          initialGuests={query.guests ? Number(query.guests) : 1}
        />
      </div>

      <div className="mt-12 border-t border-card-border pt-8 text-center">
        <Link
          href="/"
          className="inline-block rounded-md border border-card-border px-5 py-2.5 text-sm font-medium transition hover:bg-foreground/5"
        >
          &larr; Back to home
        </Link>
      </div>
    </div>
  );
}
