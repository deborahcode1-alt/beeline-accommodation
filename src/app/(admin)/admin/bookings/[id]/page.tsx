import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminContext, canAccessHost } from "@/lib/adminAuth";
import { formatDate, formatMoney } from "@/lib/format";
import { manageUrl } from "@/lib/notifications";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { BookingActions } from "@/components/admin/BookingActions";
import { BookingEditForm } from "@/components/admin/BookingEditForm";
import { CopyableUrl } from "@/components/admin/CopyableUrl";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { listing: { select: { id: true, name: true, slug: true, hostId: true } } },
  });
  if (!booking || !canAccessHost(ctx, booking.listing.hostId)) notFound();

  return (
    <div>
      <Link href="/admin/bookings" className="text-sm text-muted hover:underline">
        &larr; All bookings
      </Link>

      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{booking.guestName}</h1>
        <StatusBadge status={booking.status} />
      </div>
      <p className="mt-1 text-sm text-muted">
        {booking.listing.name} &middot; requested {formatDate(booking.createdAt)} &middot;{" "}
        {formatMoney(booking.totalPrice)} total
      </p>
      <div className="mt-1 flex gap-4 text-sm">
        <Link href={`/admin/listings/${booking.listing.id}`} className="text-accent-deep hover:underline">
          View listing in admin
        </Link>
        <Link href={`/listings/${booking.listing.slug}`} target="_blank" className="text-accent-deep hover:underline">
          View public page
        </Link>
      </div>

      <div className="mt-6">
        <BookingActions
          bookingId={booking.id}
          status={booking.status}
          guestPhone={booking.guestPhone}
          confirmationTextSentAt={booking.confirmationTextSentAt}
          confirmationEmailSentAt={booking.confirmationEmailSentAt}
          showViewLink={false}
        />
      </div>

      <section className="mt-8 max-w-lg">
        <h2 className="text-lg font-semibold">Details</h2>
        <div className="mt-3">
          <BookingEditForm
            bookingId={booking.id}
            checkIn={toISODate(booking.checkIn)}
            checkOut={toISODate(booking.checkOut)}
            guests={booking.guests}
            guestName={booking.guestName}
            guestEmail={booking.guestEmail}
            guestPhone={booking.guestPhone ?? ""}
            message={booking.message ?? ""}
          />
        </div>
      </section>

      <section className="mt-8 max-w-lg">
        <h2 className="text-lg font-semibold">Guest self-service link</h2>
        <p className="mt-1 text-sm text-muted">
          This is where the guest can cancel or request new dates themselves &mdash; it&apos;s
          also included in their confirmation email/text.
        </p>
        <div className="mt-3">
          <CopyableUrl url={manageUrl(booking.manageToken)} />
        </div>
      </section>
    </div>
  );
}
