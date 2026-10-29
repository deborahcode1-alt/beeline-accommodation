import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { SITE_NAME } from "@/lib/site";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { isSmsConfigured, sendSms } from "@/lib/sms";
import {
  bankDetailsOf,
  bookingReference,
  cardPaymentsOn,
  paymentInstructionsText,
} from "@/lib/stayPaymentInfo";

type BookingWithListing = {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  checkIn: Date;
  checkOut: Date;
  totalPrice: number;
  manageToken: string;
  listing: {
    id: string;
    name: string;
    hostId: string | null;
  };
};

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-AU", { month: "short", day: "numeric", timeZone: "UTC" }).format(d);
}

export function manageUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://beelineaccommodation.com";
  return `${base}/manage/${token}`;
}

async function hostContact(hostId: string | null) {
  const host = hostId ? await prisma.host.findUnique({ where: { id: hostId } }) : null;
  return {
    email: host?.notificationEmail || process.env.ADMIN_EMAIL || null,
    phone: host?.notificationPhone || null,
  };
}

// Every notification is best-effort: log and swallow errors (including "not
// configured yet") rather than let a failed text/email break the booking flow.
async function tryEmail(to: string | null | undefined, subject: string, text: string) {
  if (!to || !isEmailConfigured()) return;
  try {
    await sendEmail({ to, subject, text });
  } catch (err) {
    console.error("email notification failed:", err);
  }
}

async function trySms(to: string | null | undefined, body: string) {
  if (!to || !isSmsConfigured()) return;
  try {
    await sendSms(to, body);
  } catch (err) {
    console.error("sms notification failed:", err);
  }
}

export async function notifyNewBooking(booking: BookingWithListing) {
  const dates = `${fmtDate(booking.checkIn)} - ${fmtDate(booking.checkOut)}`;

  await tryEmail(
    booking.guestEmail,
    `Your request for ${booking.listing.name} has been sent`,
    `Hi ${booking.guestName.split(" ")[0]},\n\nYour booking request for ${booking.listing.name} ` +
      `(${dates}, ${formatMoney(booking.totalPrice)} total) has been sent to the host for approval. ` +
      `You'll hear back soon.\n\nManage this request: ${manageUrl(booking.manageToken)}\n\n- ${SITE_NAME}`
  );
  await trySms(
    booking.guestPhone,
    `Hi ${booking.guestName.split(" ")[0]}, your request for ${booking.listing.name} (${dates}) ` +
      `has been sent to the host for approval. - ${SITE_NAME}`
  );

  const host = await hostContact(booking.listing.hostId);
  await tryEmail(
    host.email,
    `New booking request: ${booking.listing.name}`,
    `${booking.guestName} requested ${booking.listing.name} for ${dates} ` +
      `(${formatMoney(booking.totalPrice)}). Review it in the admin dashboard.`
  );
  await trySms(
    host.phone,
    `New request: ${booking.guestName} wants ${booking.listing.name}, ${dates}. Check your dashboard.`
  );
}

export async function notifyInstantBooking(booking: BookingWithListing) {
  // Guest: straight to the confirmation. Host: a heads-up that it's already confirmed.
  await notifyBookingConfirmed(booking);
  const dates = `${fmtDate(booking.checkIn)} - ${fmtDate(booking.checkOut)}`;
  const host = await hostContact(booking.listing.hostId);
  const pay = await paymentOptionsFor(booking);
  await tryEmail(
    host.email,
    `New instant booking: ${booking.listing.name}`,
    `${booking.guestName} booked ${booking.listing.name} for ${dates} (${formatMoney(booking.totalPrice)}). ` +
      `It was confirmed automatically. ` +
      (pay.bank || pay.cardAvailable
        ?`The guest has been emailed how to pay (reference ${bookingReference(booking.id)}). `
        : `Contact the guest to arrange payment: ${booking.guestEmail}${booking.guestPhone ? ", " + booking.guestPhone : ""}. `)
  );
  await trySms(
    host.phone,
    `New instant booking: ${booking.guestName}, ${booking.listing.name}, ${dates}. Check your dashboard.`
  );
}

/** How the guest can pay for this stay, from the host's bank details and card setting. */
async function paymentOptionsFor(booking: BookingWithListing) {
  const row = await prisma.booking.findUnique({
    where: { id: booking.id },
    select: { paymentStatus: true, totalPrice: true, listing: { select: { host: true } } },
  });
  const host = row?.listing.host ?? null;
  return {
    paid: row?.paymentStatus === "PAID",
    total: row?.totalPrice ?? booking.totalPrice,
    bank: bankDetailsOf(host),
    cardAvailable: cardPaymentsOn(host),
  };
}

export async function confirmationEmailContent(booking: BookingWithListing) {
  const dates = `${fmtDate(booking.checkIn)} - ${fmtDate(booking.checkOut)}`;
  const link = manageUrl(booking.manageToken);
  const pay = await paymentOptionsFor(booking);
  const instructions = pay.paid
    ? ""
    : paymentInstructionsText({
        total: pay.total,
        reference: bookingReference(booking.id),
        bank: pay.bank,
        cardAvailable: pay.cardAvailable,
        payLink: link,
      });
  const paymentPart = pay.paid
    ? "Your payment has been received. Thank you!"
    : instructions || "The host will be in touch about payment.";
  return {
    subject: `Your booking at ${booking.listing.name} is confirmed!`,
    text:
      `Hi ${booking.guestName.split(" ")[0]},\n\nYour stay at ${booking.listing.name} (${dates}) is confirmed.\n\n` +
      `${paymentPart}\n\nNeed to change, cancel or pay? Manage your booking here: ${link}\n\n- ${SITE_NAME}`,
  };
}

export function confirmationSmsContent(booking: BookingWithListing) {
  const dates = `${fmtDate(booking.checkIn)} - ${fmtDate(booking.checkOut)}`;
  const link = manageUrl(booking.manageToken);
  return (
    `Hi ${booking.guestName.split(" ")[0]}, your booking at ${booking.listing.name} (${dates}) is confirmed! ` +
    `Manage it: ${link} - ${SITE_NAME}`
  );
}

export async function notifyBookingConfirmed(booking: BookingWithListing) {
  const { subject, text } = await confirmationEmailContent(booking);
  await tryEmail(booking.guestEmail, subject, text);
  await trySms(booking.guestPhone, confirmationSmsContent(booking));
}

/** A guest's card payment came through: a receipt to the guest and a heads-up to the host. */
export async function notifyPaymentReceived(
  booking: BookingWithListing,
  paid: { amount: number; surcharge: number }
) {
  const dates = `${fmtDate(booking.checkIn)} - ${fmtDate(booking.checkOut)}`;
  const ref = bookingReference(booking.id);
  await tryEmail(
    booking.guestEmail,
    `Payment received for ${booking.listing.name}`,
    `Hi ${booking.guestName.split(" ")[0]},\n\nThanks, we've received your card payment of ${formatMoney(paid.amount)} ` +
      `for ${booking.listing.name} (${dates}). That is ${formatMoney(paid.amount - paid.surcharge)} for your stay plus a ` +
      `${formatMoney(paid.surcharge)} card surcharge. Reference ${ref}.\n\nStripe will also email you a receipt.\n\n` +
      `Manage your booking: ${manageUrl(booking.manageToken)}\n\n- ${SITE_NAME}`
  );
  const host = await hostContact(booking.listing.hostId);
  await tryEmail(
    host.email,
    `Paid by card: ${booking.listing.name}`,
    `${booking.guestName} paid ${formatMoney(paid.amount)} by card for ${booking.listing.name}, ${dates} ` +
      `(includes a ${formatMoney(paid.surcharge)} surcharge). Reference ${ref}. The booking is marked paid.`
  );
  await trySms(host.phone, `${booking.guestName} paid ${formatMoney(paid.amount)} by card for ${booking.listing.name}, ${dates}.`);
}

/** A guest says they have sent a bank transfer. The host still ticks "paid" once the money arrives. */
export async function notifyTransferSent(booking: BookingWithListing) {
  const dates = `${fmtDate(booking.checkIn)} - ${fmtDate(booking.checkOut)}`;
  const host = await hostContact(booking.listing.hostId);
  await tryEmail(
    host.email,
    `Bank transfer on its way: ${booking.listing.name}`,
    `${booking.guestName} says they have sent ${formatMoney(booking.totalPrice)} by bank transfer for ` +
      `${booking.listing.name}, ${dates}. Look for reference ${bookingReference(booking.id)} in your account, ` +
      `then tick "Mark paid" on the booking in your dashboard.`
  );
  await trySms(
    host.phone,
    `${booking.guestName} says they sent a bank transfer for ${booking.listing.name}, ref ${bookingReference(booking.id)}. Tick paid when it arrives.`
  );
}

export async function notifyBookingDeclined(booking: BookingWithListing) {
  const dates = `${fmtDate(booking.checkIn)} - ${fmtDate(booking.checkOut)}`;
  await tryEmail(
    booking.guestEmail,
    `Update on your request for ${booking.listing.name}`,
    `Hi ${booking.guestName.split(" ")[0]},\n\nUnfortunately the host isn't able to confirm ${booking.listing.name} ` +
      `for ${dates}. Feel free to try different dates on the site.\n\n- ${SITE_NAME}`
  );
}

export async function notifyGuestCancelled(booking: BookingWithListing) {
  const dates = `${fmtDate(booking.checkIn)} - ${fmtDate(booking.checkOut)}`;
  const host = await hostContact(booking.listing.hostId);
  await tryEmail(
    host.email,
    `Booking cancelled: ${booking.listing.name}`,
    `${booking.guestName} cancelled their booking for ${booking.listing.name}, ${dates}.`
  );
  await trySms(host.phone, `${booking.guestName} cancelled ${booking.listing.name}, ${dates}.`);
}

export async function notifyRescheduleRequested(
  booking: BookingWithListing,
  previousDates: { checkIn: Date; checkOut: Date }
) {
  const oldDates = `${fmtDate(previousDates.checkIn)} - ${fmtDate(previousDates.checkOut)}`;
  const newDates = `${fmtDate(booking.checkIn)} - ${fmtDate(booking.checkOut)}`;
  const host = await hostContact(booking.listing.hostId);
  await tryEmail(
    host.email,
    `Reschedule request: ${booking.listing.name}`,
    `${booking.guestName} asked to move their booking for ${booking.listing.name} from ${oldDates} to ` +
      `${newDates}. It's back to pending — review it in the admin dashboard.`
  );
  await trySms(
    host.phone,
    `${booking.guestName} wants to reschedule ${booking.listing.name} to ${newDates}. Check your dashboard.`
  );
}
