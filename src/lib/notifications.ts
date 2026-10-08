import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { SITE_NAME } from "@/lib/site";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { isSmsConfigured, sendSms } from "@/lib/sms";

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
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://beeline-accommodation.vercel.app";
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
  await tryEmail(
    host.email,
    `New instant booking: ${booking.listing.name}`,
    `${booking.guestName} booked ${booking.listing.name} for ${dates} (${formatMoney(booking.totalPrice)}). ` +
      `It was confirmed automatically. Contact the guest to arrange payment: ${booking.guestEmail}${booking.guestPhone ? ", " + booking.guestPhone : ""}.`
  );
  await trySms(
    host.phone,
    `New instant booking: ${booking.guestName}, ${booking.listing.name}, ${dates}. Check your dashboard.`
  );
}

export function confirmationEmailContent(booking: BookingWithListing) {
  const dates = `${fmtDate(booking.checkIn)} - ${fmtDate(booking.checkOut)}`;
  const link = manageUrl(booking.manageToken);
  return {
    subject: `Your booking at ${booking.listing.name} is confirmed!`,
    text:
      `Hi ${booking.guestName.split(" ")[0]},\n\nYour stay at ${booking.listing.name} (${dates}) is confirmed. ` +
      `The host will be in touch about payment.\n\nNeed to change or cancel? Manage your booking here: ${link}\n\n- ${SITE_NAME}`,
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
  const { subject, text } = confirmationEmailContent(booking);
  await tryEmail(booking.guestEmail, subject, text);
  await trySms(booking.guestPhone, confirmationSmsContent(booking));
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
