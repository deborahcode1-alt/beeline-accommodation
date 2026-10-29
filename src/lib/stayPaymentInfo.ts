import { formatMoney } from "@/lib/format";

// How a guest pays for a stay. Two ways, both up front:
//   - Direct bank transfer into the host's account: no extra charge.
//   - Card through Stripe: a surcharge that covers the card fee is added to the invoice.
// Nothing here touches the database or Stripe, so the booking page can use it too.

export type SurchargeRate = { percent: number; fixed: number };

/** What a card payment adds. Set CARD_SURCHARGE_PERCENT and CARD_SURCHARGE_FIXED to match the Stripe fees. */
export function surchargeRate(): SurchargeRate {
  const percent = Number(process.env.CARD_SURCHARGE_PERCENT ?? "1.7");
  const fixed = Number(process.env.CARD_SURCHARGE_FIXED ?? "0.30");
  return {
    percent: Number.isFinite(percent) && percent >= 0 ? percent : 1.7,
    fixed: Number.isFinite(fixed) && fixed >= 0 ? fixed : 0.3,
  };
}

/** The card surcharge for an amount, in dollars rounded to the cent. */
export function cardSurcharge(amount: number, rate: SurchargeRate = surchargeRate()) {
  const cents = Math.round(amount * 100);
  return Math.round((cents * rate.percent) / 100 + rate.fixed * 100) / 100;
}

/** "1.7% + 30c", for telling the guest exactly what the surcharge is. */
export function surchargeLabel(rate: SurchargeRate = surchargeRate()) {
  const percent = Number(rate.percent.toFixed(2));
  const fixed = Math.round(rate.fixed * 100);
  return `${percent}%${fixed > 0 ? ` + ${fixed}c` : ""}`;
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
};

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
  if (!host?.acceptsCardPayments || !key) return false;
  const testKey = /^[rs]k_test_/.test(key);
  return !testKey || process.env.ALLOW_TEST_CARD_PAYMENTS === "true";
}

/** The "how to pay" part of the confirmation email. Empty when the host has no online way to pay set up. */
export function paymentInstructionsText(params: {
  total: number;
  reference: string;
  bank: BankDetails | null;
  cardAvailable: boolean;
  payLink: string;
  rate?: SurchargeRate;
}) {
  const { total, reference, bank, cardAvailable, payLink } = params;
  if (!bank && !cardAvailable) return "";
  const surcharge = cardSurcharge(total, params.rate);
  const lines: string[] = [`Total to pay: ${formatMoney(total)}`, "", "How to pay (choose one):"];
  let n = 1;
  if (bank) {
    lines.push(
      `${n++}. Direct bank transfer: ${formatMoney(total)}, no surcharge`,
      `   Account name: ${bank.accountName}`,
      `   BSB: ${bank.bsb}`,
      `   Account number: ${bank.accountNumber}`,
      `   Reference: ${reference}`
    );
  }
  if (cardAvailable) {
    lines.push(
      `${n++}. Credit or debit card: ${formatMoney(total + surcharge)} (${formatMoney(total)} plus a ${formatMoney(surcharge)} card surcharge)`,
      `   Pay securely online: ${payLink}`
    );
  }
  if (bank && cardAvailable) {
    lines.push("", `Paying by bank transfer saves you ${formatMoney(surcharge)}.`);
  }
  return lines.join("\n");
}
