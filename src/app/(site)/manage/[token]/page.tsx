import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUnavailableNights } from "@/lib/availability";
import { getGuest } from "@/lib/guestSession";
import { ManageBookingClient } from "@/components/ManageBookingClient";
import { ClaimStayButton } from "@/components/guest/ClaimStayButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage your booking",
  robots: { index: false, follow: false },
};

export default async function ManageBookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const booking = await prisma.booking.findUnique({
    where: { manageToken: token },
    include: { listing: true },
  });
  if (!booking) notFound();

  const [unavailableSet, guest] = await Promise.all([
    getUnavailableNights(booking.listing.id, booking.id),
    getGuest(),
  ]);

  // Offer to keep this stay on the guest's account. Holding the private link proves it is theirs.
  const onYourAccount = !!guest && booking.guestAccountId === guest.id;
  const available = !booking.guestAccountId || (guest && booking.guestAccountId === guest.id);

  return (
    <div>
      {available && (
        <div className="mx-auto max-w-2xl px-6 pt-8">
          <div className="rounded-xl border border-card-border bg-soft p-4 text-sm">
            {onYourAccount ? (
              <p>
                This stay is on your account.{" "}
                <Link href="/account" className="font-semibold text-accent-deep hover:underline">
                  View my stays
                </Link>
              </p>
            ) : guest ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p>Keep this stay with the rest of your trips.</p>
                <ClaimStayButton token={token} />
              </div>
            ) : (
              <p>
                Want all your stays in one place?{" "}
                <Link
                  href={`/sign-in?next=${encodeURIComponent(`/manage/${token}`)}`}
                  className="font-semibold text-accent-deep hover:underline"
                >
                  Sign in
                </Link>{" "}
                or{" "}
                <Link
                  href={`/sign-up?next=${encodeURIComponent(`/manage/${token}`)}`}
                  className="font-semibold text-accent-deep hover:underline"
                >
                  create an account
                </Link>
                , then add this stay.
              </p>
            )}
          </div>
        </div>
      )}
      <ManageBookingClient
        token={token}
        status={booking.status}
        listingName={booking.listing.name}
        listingSlug={booking.listing.slug}
        checkIn={booking.checkIn.toISOString()}
        checkOut={booking.checkOut.toISOString()}
        guests={booking.guests}
        totalPrice={booking.totalPrice}
        basePrice={booking.listing.basePrice}
        cleaningFee={booking.listing.cleaningFee}
        minNights={booking.listing.minNights}
        unavailableNights={[...unavailableSet]}
      />
    </div>
  );
}
