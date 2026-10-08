import { formatDate, formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { BookingActions } from "@/components/admin/BookingActions";
import { PaidCheckbox } from "@/components/admin/PaidCheckbox";
import { GuestContactLinks } from "@/components/admin/GuestContactLinks";
import Link from "next/link";
import { keptUntil } from "@/lib/retention";

type Row = {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  confirmationTextSentAt: Date | null;
  confirmationEmailSentAt: Date | null;
  listing: { name: string };
};

export function BookingsTable({
  bookings,
  showListingColumn = true,
  archived = false,
}: {
  bookings: Row[];
  showListingColumn?: boolean;
  archived?: boolean;
}) {
  if (bookings.length === 0) {
    return (
      <p className="text-sm text-muted">
        {archived ? "No archived stays match." : "No current or upcoming bookings."}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-card-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-foreground/5 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3">Guest</th>
            {showListingColumn && <th className="px-4 py-3">Listing</th>}
            <th className="px-4 py-3">Dates</th>
            <th className="px-4 py-3">Guests</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="border-t border-card-border">
              <td className="px-4 py-3">
                <div className="font-medium">{b.guestName}</div>
                <div className="text-xs text-muted">{b.guestEmail}</div>
                <div className="mt-1.5">
                  <GuestContactLinks phone={b.guestPhone} email={b.guestEmail} />
                </div>
              </td>
              {showListingColumn && <td className="px-4 py-3">{b.listing.name}</td>}
              <td className="px-4 py-3">
                {formatDate(b.checkIn)} &rarr; {formatDate(b.checkOut)}
                {archived && (
                  <div className="mt-1 text-xs text-muted">
                    Details kept until {formatDate(keptUntil(b.checkOut))}
                  </div>
                )}
              </td>
              <td className="px-4 py-3">{b.guests}</td>
              <td className="px-4 py-3">{formatMoney(b.totalPrice)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={b.status} />
                {(b.status === "CONFIRMED" || b.status === "PENDING") && (
                  <div className="mt-2">
                    <PaidCheckbox bookingId={b.id} paymentStatus={b.paymentStatus} />
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                {archived ? (
                  <Link
                    href={`/admin/bookings/${b.id}`}
                    className="rounded-md border border-card-border px-3 py-1.5 text-xs font-medium"
                  >
                    View
                  </Link>
                ) : (
                  <BookingActions
                    bookingId={b.id}
                    status={b.status}
                    guestPhone={b.guestPhone}
                    confirmationTextSentAt={b.confirmationTextSentAt}
                    confirmationEmailSentAt={b.confirmationEmailSentAt}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
