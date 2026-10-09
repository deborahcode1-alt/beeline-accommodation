import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

// Customer details are kept for 7 years after their last stay. If a customer has not stayed (or
// signed in) for 7 years, their personal details are deleted. The booking's dates, price and
// listing are kept without any name or contact so a host's own history and totals still add up.
export const RETENTION_YEARS = 7;
export const REDACTED_NAME = "Deleted customer";
export const REDACTED_EMAIL = "deleted@deleted.invalid";

export function retentionCutoff(now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - RETENTION_YEARS);
  return cutoff;
}

/** The date a stay's customer details will be deleted, if the customer stays no more. */
export function keptUntil(checkOut: Date) {
  const d = new Date(checkOut);
  d.setUTCFullYear(d.getUTCFullYear() + RETENTION_YEARS);
  return d;
}

/** Start of today (UTC): stays that ended before this are archived. */
export function startOfToday(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function purgeExpiredCustomerData(now = new Date()) {
  const cutoff = retentionCutoff(now);
  let customers = 0;
  let bookings = 0;

  // Customers whose old stays are past retention...
  const candidates = await prisma.booking.findMany({
    where: { checkOut: { lt: cutoff }, NOT: { guestEmail: REDACTED_EMAIL } },
    select: { guestEmail: true },
    distinct: ["guestEmail"],
  });

  for (const { guestEmail } of candidates) {
    const sameCustomer = { guestEmail: { equals: guestEmail, mode: "insensitive" as const } };
    // ...unless they have stayed (or have a stay coming up) more recently: that is "action".
    const recent = await prisma.booking.count({
      where: { ...sameCustomer, checkOut: { gte: cutoff } },
    });
    if (recent > 0) continue;
    const result = await prisma.booking.updateMany({
      where: sameCustomer,
      data: {
        guestName: REDACTED_NAME,
        guestEmail: REDACTED_EMAIL,
        guestPhone: null,
        message: null,
        guestAccountId: null,
      },
    });
    customers += 1;
    bookings += result.count;
  }

  // Guest accounts nobody has used for 7 years (no sign-in, no recent stay).
  const staleAccounts = await prisma.guest.findMany({
    where: {
      OR: [{ lastLoginAt: { lt: cutoff } }, { lastLoginAt: null, createdAt: { lt: cutoff } }],
      bookings: { none: { checkOut: { gte: cutoff } } },
    },
    select: { id: true },
  });
  const accounts = await prisma.guest.deleteMany({
    where: { id: { in: staleAccounts.map((g) => g.id) } },
  });

  // Old guest messages and host enquiries also contain personal details.
  const messages = await prisma.hostMessage.deleteMany({ where: { createdAt: { lt: cutoff } } });
  // ...and so do the house photos attached to host enquiries, which are removed from storage too.
  const oldEnquiries = await prisma.hostEnquiry.findMany({
    where: { createdAt: { lt: cutoff } },
    select: { id: true, photoUrls: true },
  });
  for (const enquiry of oldEnquiries) {
    const urls: string[] = JSON.parse(enquiry.photoUrls || "[]");
    if (urls.length) await del(urls).catch((err) => console.error("Could not delete enquiry photos:", err));
  }
  const enquiries = await prisma.hostEnquiry.deleteMany({
    where: { id: { in: oldEnquiries.map((e) => e.id) } },
  });

  return {
    customersDeleted: customers,
    bookingsAnonymised: bookings,
    accountsDeleted: accounts.count,
    messagesDeleted: messages.count,
    enquiriesDeleted: enquiries.count,
  };
}
