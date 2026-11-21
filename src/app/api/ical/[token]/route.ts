import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildIcalFeed } from "@/lib/ical";
import { blockingBookingWhere } from "@/lib/holds";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token: rawToken } = await params;
  const token = rawToken.replace(/\.ics$/i, "");

  const listing = await prisma.listing.findUnique({
    where: { icalExportToken: token },
    include: {
      // Every unavailable date goes out on this one feed — including dates that came in
      // from another connected platform — so pasting it into Airbnb, Booking.com, etc.
      // keeps all of them in sync with each other, not just with direct bookings.
      bookings: { where: blockingBookingWhere() },
      blockedDates: true,
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const feed = buildIcalFeed({
    listingName: listing.name,
    bookings: listing.bookings,
    blockedDates: listing.blockedDates,
  });

  return new NextResponse(feed, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${listing.slug}.ics"`,
    },
  });
}
