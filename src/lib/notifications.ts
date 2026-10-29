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
      `(${dates}, ${formatMoney(booking.totalPrice)} total) has been sent to the host.\n\n` +
      `Your booking is not confirmed yet. The host will confirm it, and we'll email you as soon as they do. ` +
      `You don't need to pay anything until then.\n\nSee your request: ${manageUrl(booking.manageToken)}\n\n- ${SITE_NAME}`
  );
  await trySms(
    booking.guestPhone,
    `Hi ${booking.guestName.split(" ")[0]}, your request for ${booking.listing.name} (${dates}) ` +
      `has been sent. The host will confirm your booking and we'll let you know. - ${SITE_NAME}`
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

// ---- Hosts: going live ------------------------------------------------------------------------

async function hostLoginEmails(hostId: string) {
  const [host, logins] = await Promise.all([
    prisma.host.findUnique({ where: { id: hostId }, select: { name: true, notificationEmail: true } }),
    prisma.adminUser.findMany({ where: { hostId }, select: { email: true } }),
  ]);
  const emails = new Set<string>(logins.map((l) => l.email));
  if (host?.notificationEmail) emails.add(host.notificationEmail);
  return { name: host?.name ?? "there", emails: [...emails] };
}

/** The owner has approved a host: their listings are now on the site. */
export async function notifyHostLive(hostId: string) {
  const { name, emails } = await hostLoginEmails(hostId);
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://beelineaccommodation.com";
  for (const to of emails) {
    await tryEmail(
      to,
      `You're live on ${SITE_NAME}`,
      `Hi ${name},\n\nGreat news: your listings are now live on ${SITE_NAME} and guests can find and book them.\n\n` +
        `Check how they look: ${site}\nManage bookings and calendars: ${site}/admin\n\n- ${SITE_NAME}`
    );
  }
}

/** The owner sends a host their setup checklist, with what is still to do. */
export async function sendHostChecklistEmail(hostId: string, remaining: string[]) {
  const { name, emails } = await hostLoginEmails(hostId);
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://beelineaccommodation.com";
  const todo = remaining.length
    ? `Still to do:\n${remaining.map((r) => `  - ${r}`).join("\n")}`
    : "Every step is already done. We'll check it over and switch your listings on.";
  const text =
    `Hi ${name},\n\nHere is your ${SITE_NAME} checklist. Work through it and your listings go live on the site once ` +
    `every step is done and we've approved it.\n\nSign in and open "Get live": ${site}/admin/get-live\n\n${todo}\n\n` +
    `The page also shows your Beeline calendar link for each listing, ready to paste into Airbnb, Booking.com and the others.\n\n- ${SITE_NAME}`;
  const sent: string[] = [];
  for (const to of emails) {
    if (!isEmailConfigured()) break;
    try {
      await sendEmail({ to, subject: `Your ${SITE_NAME} checklist: get your listings live`, text });
      sent.push(to);
    } catch (err) {
      console.error("checklist email failed:", err);
    }
  }
  return sent;
}

/** A connected calendar stopped syncing: tell the host once, not on every retry. */
export async function notifySyncFailed(params: { hostId: string | null; listingName: string; label: string; error: string }) {
  if (!params.hostId) return;
  const { emails } = await hostLoginEmails(params.hostId);
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://beelineaccommodation.com";
  for (const to of emails) {
    await tryEmail(
      to,
      `Calendar problem: ${params.listingName}`,
      `Your ${params.label} calendar for ${params.listingName} stopped syncing with ${SITE_NAME}, so bookings made there may not be blocking dates here.\n\n` +
        `What we saw: ${params.error}\n\nOpen the listing's Calendar & sync page and check the link is the calendar (.ics) link from ${params.label}: ${site}/admin\n\n- ${SITE_NAME}`
    );
  }
}

// ---- Host requests (Become a collaborator) ----------------------------------------------------

/** The applicant gets an acknowledgement that says what happens next. */
export async function notifyEnquiryReceived(params: { name: string; email: string }) {
  await tryEmail(
    params.email,
    `We've got your request to join ${SITE_NAME}`,
    `Hi ${params.name.split(" ")[0]},\n\nThanks for asking to list your place on ${SITE_NAME}. We have your request.\n\n` +
      `What happens next:\n  1. We review it, usually within a day or two.\n  2. If it's a good fit, you'll get an email with a link to set your password.\n` +
      `  3. You then work through a short checklist (your profile, bank details, listings and calendars), and we switch your listings on.\n\n` +
      `Questions? Just reply to this email.\n\n- ${SITE_NAME}`
  );
}

/** Tells the platform owner a request has come in, with a link that takes them straight to approving it. */
export async function notifyOwnerOfEnquiry(params: {
  name: string;
  email: string;
  phone?: string | null;
  area: string;
  details?: string | null;
  photoCount: number;
}) {
  const to = process.env.ADMIN_EMAIL;
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://beelineaccommodation.com";
  await tryEmail(
    to,
    `New host request: ${params.name} (${params.area})`,
    `${params.name} wants to list on ${SITE_NAME}.\n\n` +
      `Email: ${params.email}${params.phone ? `\nPhone: ${params.phone}` : ""}\nArea: ${params.area}\n` +
      `${params.details ? `\n${params.details}\n` : ""}${params.photoCount ? `\nPhotos: ${params.photoCount} (see them in the admin)\n` : ""}\n` +
      `Review and approve (or decline) with one click: ${site}/admin/enquiries\n\n` +
      `Approving creates their host account and emails them a link to set their password and start the checklist.`
  );
}

/** The invitation sent when a request is approved. */
export async function sendHostInviteEmail(params: { to: string; name: string; link: string }) {
  if (!isEmailConfigured()) return false;
  await sendEmail({
    to: params.to,
    subject: `You're approved: set up your ${SITE_NAME} host account`,
    text:
      `Hi ${params.name.split(" ")[0]},\n\nGood news: we'd love to have you on ${SITE_NAME}.\n\n` +
      `1. Choose your password (the link works for 7 days):\n   ${params.link}\n\n` +
      `2. You'll land on your "Get live" checklist: your profile, bank details, listings and photos, cancellation policy, calendar links, the host agreement and your subscription. Each step ticks itself off.\n\n` +
      `3. When every step is done we check it over and switch your listings on. There's no commission on your bookings.\n\n` +
      `Any questions, reply to this email.\n\n- ${SITE_NAME}`,
  });
  return true;
}

/** A polite no, only sent when the owner chooses to. */
export async function sendEnquiryDeclinedEmail(params: { to: string; name: string }) {
  await tryEmail(
    params.to,
    `About your request to join ${SITE_NAME}`,
    `Hi ${params.name.split(" ")[0]},\n\nThanks for your interest in listing on ${SITE_NAME}. We're not able to take your place on at the moment, ` +
      `but we'd be glad to hear from you again as we add new areas.\n\n- ${SITE_NAME}`
  );
}
