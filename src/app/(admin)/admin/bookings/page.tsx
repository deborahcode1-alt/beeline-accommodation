import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BookingsTable } from "@/components/admin/BookingsTable";
import { getAdminContext, bookingScope } from "@/lib/adminAuth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const TABS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "DECLINED", label: "Declined" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  const { status } = await searchParams;
  const activeStatus = TABS.some((t) => t.value === status) ? status ?? "" : "";

  const bookings = await prisma.booking.findMany({
    where: { ...(activeStatus ? { status: activeStatus as never } : {}), ...bookingScope(ctx) },
    orderBy: { checkIn: "asc" },
    include: { listing: { select: { name: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">All bookings</h1>

      <div className="mt-4 flex gap-1 border-b border-card-border">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/admin/bookings?status=${tab.value}` : "/admin/bookings"}
            className={`rounded-t-md px-3 py-2 text-sm font-medium ${
              activeStatus === tab.value
                ? "border-b-2 border-accent text-accent-deep"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="mt-4">
        <BookingsTable bookings={bookings} />
      </div>
    </div>
  );
}
