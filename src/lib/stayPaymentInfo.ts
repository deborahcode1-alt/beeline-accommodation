import { formatMoney } from "@/lib/format";

// How a guest pays for a stay. Two ways, both up front:
//   - Direct bank transfer into the host's account: no extra charge.
//   - Card through Stripe. Instant bookings paid this way carry the admin service fee for online bookings.
// Nothing here touches the database or Stripe, so the booking page can use it too.

/** How long a pay-at-booking hold keeps the dates while the guest pays. */
export const HOLD_MINUTES = 30;

// The admin service fee for online bookings: added to instant bookings paid through the site. Booking requests,
// and bank transfers paid straight to the host, don't carry it.
export const ADMIN_FEE_PERCENT = 2;
export const ADMIN_FEE_NAME = "Admin service fee for online bookings";
export const ADMIN_FEE_REFUND_NOTE =
  "The admin service fee is non-refundable, except if the host cancels, the stay can't be provided, or the law requires a refund.";

/** The fee on an amount, in dollars rounded to the cent. */
export function adminFee(amount: number) {
  return Math.round((Math.round(amount * 100) * ADMIN_FEE_PERCENT) / 100) / 100;
}

/** The fee added to a card payment for a booking on a listing with this booking mode. */
export function adminFeeFor(amount: number, bookingMode: string) {
  return bookingMode === "INSTANT" ? adminFee(amount) : 0;
}

/** A short reference the guest puts on their bank transfer so the host can match it to the stay. */
export function bookingReference(bookingId: string) {
  return `BEE-${bookingId.slice(-6).toUpperCase()}`;
}

export type BankDetails = { accountName: string; bsb: string; accountNumber: string };

export function formatBsb(bsb: string) {
  const digits = bsb.replace(/\D/g, "");
  return digits.length === 6 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : bsb;
}

type HostPaymentFields = {
  bankAccountName: string | null;
  bankBsb: string | null;
  bankAccountNumber: string | null;
  acceptsCardPayments: boolean;
  /** The host's own Stripe account, when they have linked one. */
  stripeAccountId?: string | null;
  stripeChargesEnabled?: boolean;
};

/** Card payments for this host go to their own linked Stripe account, not the main one. */
export function paysIntoOwnStripe(
  host: { stripeAccountId?: string | null; stripeChargesEnabled?: boolean } | null | undefined
) {
  return !!host?.stripeAccountId && !!host.stripeChargesEnabled;
}

export function bankDetailsOf(host: HostPaymentFields | null | undefined): BankDetails | null {
  if (!host?.bankAccountName || !host.bankBsb || !host.bankAccountNumber) return null;
  return {
    accountName: host.bankAccountName,
    bsb: formatBsb(host.bankBsb),
    accountNumber: host.bankAccountNumber,
  };
}

/**
 * Whether guests are offered card payment for this host. It stays off while Stripe is on a test key
 * (a real card can't be charged), unless ALLOW_TEST_CARD_PAYMENTS=true is set to try it out.
 */
export function cardPaymentsOn(host: HostPaymentFields | null | undefined) {
  const key = process.env.STRIPE_SECRET_KEY;
  // A host with their own linked Stripe account takes cards there. Otherwise the owner can switch cards on for
  // them through the main account (the original arrangement).
  if (!key || !(paysIntoOwnStripe(host) || host?.acceptsCardPayments)) return false;
  const testKey = /^[rs]k_test_/.test(key);
  return !testKey || process.env.ALLOW_TEST_CARD_PAYMENTS === "true";
}

/** Whether a host may switch instant booking on: their own Stripe account is connected and cards are working. */
export function canTakeInstantBookings(host: HostPaymentFields | null | undefined) {
  return paysIntoOwnStripe(host) && cardPaymentsOn(host);
}

/** The "how to pay" part of the confirmation email. Empty when the host has no online way to pay set up. */
export function paymentInstructionsText(params: {
  total: number;
  reference: string;
  bank: BankDetails | null;
  cardAvailable: boolean;
  payLink: string;
  /** Instant bookings carry the admin service fee when paid by card. */
  instant?: boolean;
}) {
  const { total, reference, bank, cardAvailable, payLink } = params;
  if (!bank && !cardAvailable) return "";
  const fee = params.instant ? adminFee(total) : 0;
  const lines: string[] = [`Total to pay: ${formatMoney(total)}`, "", "How to pay (choose one):"];
  let n = 1;
  if (bank) {
    lines.push(
      `${n++}. Direct bank transfer to the host: ${formatMoney(total)}`,
      `   Account name: ${bank.accountName}`,
      `   BSB: ${bank.bsb}`,
      `   Account number: ${bank.accountNumber}`,
      `   Reference: ${reference}`
    );
  }
  if (cardAvailable) {
    lines.push(
      fee > 0
        ? `${n++}. Credit or debit card: ${formatMoney(total + fee)} (${formatMoney(total)} plus a ${formatMoney(fee)} admin service fee for online bookings)`
        : `${n++}. Credit or debit card: ${formatMoney(total)}`,
      `   Pay securely online: ${payLink}`
    );
    if (fee > 0) lines.push(`   ${ADMIN_FEE_REFUND_NOTE}`);
  }
  return lines.join("\n");
}
