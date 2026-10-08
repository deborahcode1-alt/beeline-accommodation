import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// The signed-in admin. A user with no host is the platform owner and sees everything;
// a user linked to a host only ever sees that host's listings and bookings.
export type AdminContext = {
  email: string;
  hostId: string | null;
  isOwner: boolean;
};

export async function getAdminContext(): Promise<AdminContext | null> {
  const session = await getSession();
  if (!session) return null;
  // Read from the database (not the cookie) so access changes apply immediately.
  const user = await prisma.adminUser.findUnique({
    where: { email: session.email },
    select: { hostId: true },
  });
  if (!user) return null;
  return { email: session.email, hostId: user.hostId, isOwner: user.hostId === null };
}

/** Prisma `where` fragment limiting listings to what this admin may see. */
export function listingScope(ctx: AdminContext) {
  return ctx.isOwner ? {} : { hostId: ctx.hostId };
}

/** Prisma `where` fragment limiting bookings to what this admin may see. */
export function bookingScope(ctx: AdminContext) {
  return ctx.isOwner ? {} : { listing: { hostId: ctx.hostId } };
}

export function canAccessHost(ctx: AdminContext, hostId: string | null) {
  return ctx.isOwner || (hostId !== null && hostId === ctx.hostId);
}

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const notFound = (what: string) => NextResponse.json({ error: `${what} not found` }, { status: 404 });

/** For API routes: the admin context, or a 401 response. */
export async function requireAdmin(): Promise<
  { ctx: AdminContext; error?: undefined } | { ctx?: undefined; error: NextResponse }
> {
  const ctx = await getAdminContext();
  return ctx ? { ctx } : { error: unauthorized() };
}

/** For API routes: confirm the admin may touch this listing. Missing and forbidden both look like 404. */
export async function requireListingAccess(listingId: string) {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, hostId: true },
  });
  if (!listing || !canAccessHost(auth.ctx, listing.hostId)) {
    return { error: notFound("Listing") };
  }
  return { ctx: auth.ctx, listing };
}

/** For API routes: confirm the admin may touch this booking (via its listing's host). */
export async function requireBookingAccess(bookingId: string) {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, listing: { select: { hostId: true } } },
  });
  if (!booking || !canAccessHost(auth.ctx, booking.listing.hostId)) {
    return { error: notFound("Booking") };
  }
  return { ctx: auth.ctx, booking };
}
