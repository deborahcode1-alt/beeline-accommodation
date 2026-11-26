"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";
import { ADMIN_FEE_NAME, ADMIN_FEE_PERCENT, ADMIN_FEE_REFUND_NOTE } from "@/lib/stayPaymentInfo";

type Props = {
  token: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  amountPaid: number | null;
  total: number;
  /** The admin service fee added to a card payment; 0 when this booking doesn't carry it. */
  fee: number;
  reference: string;
  bank: { accountName: string; bsb: string; accountNumber: string } | null;
  cardAvailable: boolean;
  transferNotified: boolean;
  returnedFrom: "card" | "cancelled" | null;
  /** The dates are being held while the guest pays (pay at booking). Card is the only way to pay. */
  hold?: boolean;
  holdMinutes?: number;
};

// How the guest pays up front: bank transfer straight to the host, or card (with the admin service fee on the invoice
// for instant bookings).
export function StayPayment({
  token,
  status,
  paymentStatus,
  paymentMethod,
  amountPaid,
  total,
  fee,
  reference,
  bank,
  cardAvailable,
  transferNotified: initialNotified,
  returnedFrom,
  hold = false,
  holdMinutes = 30,
}: Props) {
  const [busy, setBusy] = useState<"card" | "transfer" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notified, setNotified] = useState(initialNotified);
  const [agreed, setAgreed] = useState(false);

  if (status === "CANCELLED" || status === "DECLINED") return null;
  if (!bank && !cardAvailable && paymentStatus !== "PAID") return null;

  const box = "mt-6 rounded-sm border border-card-border p-6";

  if (paymentStatus === "PAID") {
    return (
      <div className={box}>
        <h2 className="text-lg font-semibold">Paid</h2>
        <p className="mt-2 text-sm text-muted">
          {paymentMethod === "CARD" && amountPaid
            ? `We received your card payment of ${formatMoney(amountPaid)}. Thank you!`
            : "Your payment has been received. Thank you!"}{" "}
          Reference {reference}.
        </p>
      </div>
    );
  }

  if (status !== "CONFIRMED" && !hold) {
    return (
      <div className={box}>
        <h2 className="text-lg font-semibold">Payment</h2>
        <p className="mt-2 text-sm text-muted">
          You can pay for your stay here as soon as the host confirms your booking. We&apos;ll email you.
        </p>
      </div>
    );
  }

  async function payByCard() {
    setBusy("card");
    setError(null);
    try {
      const res = await fetch(`/api/manage/${token}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreed }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Could not start the payment");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the payment");
      setBusy(null);
    }
  }

  async function transferSent() {
    setBusy("transfer");
    setError(null);
    try {
      const res = await fetch(`/api/manage/${token}/transfer-sent`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not tell the host");
      setNotified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not tell the host");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={box}>
      <h2 className="text-lg font-semibold">Pay for your stay</h2>
      <p className="mt-1 text-sm text-muted">
        {hold
          ? `Pay by card to confirm your booking. Your dates are held for ${holdMinutes} minutes from when you booked.`
          : "Pay up front to secure your stay. Choose how you'd like to pay."}
      </p>

      {returnedFrom === "card" && (
        <p className="mt-3 rounded-md bg-accent/10 px-3 py-2 text-sm text-accent-deep">
          Thanks! Your card payment is being confirmed. This page updates within a minute, so refresh if it still
          shows unpaid.
        </p>
      )}
      {returnedFrom === "cancelled" && (
        <p className="mt-3 rounded-md border border-card-border px-3 py-2 text-sm text-muted">
          The card payment was cancelled and you have not been charged.
        </p>
      )}

      <div className={`mt-4 grid gap-4 ${bank && cardAvailable ? "sm:grid-cols-2" : ""}`}>
        {bank && (
          <div className="rounded-md border border-accent bg-soft p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-deep">
              {cardAvailable ? "Best price" : "Bank transfer"}
            </p>
            <h3 className="mt-1 font-semibold">Direct bank transfer</h3>
            <p className="mt-1 text-2xl font-extrabold">{formatMoney(total)}</p>
            <p className="text-xs text-muted">
              {cardAvailable && fee > 0
                ? `Paid straight to the host, with no admin service fee. You save ${formatMoney(fee)}.`
                : "Paid straight to the host."}
            </p>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-muted">Account name</dt>
              <dd className="font-medium">{bank.accountName}</dd>
              <dt className="text-muted">BSB</dt>
              <dd className="font-medium">{bank.bsb}</dd>
              <dt className="text-muted">Account</dt>
              <dd className="font-medium">{bank.accountNumber}</dd>
              <dt className="text-muted">Reference</dt>
              <dd className="font-medium">{reference}</dd>
            </dl>
            <p className="mt-2 text-xs text-muted">Please use the reference so the host can match your payment.</p>
            {notified ? (
              <p className="mt-3 text-sm text-accent-deep">
                Thanks, we&apos;ve let the host know your transfer is on its way.
              </p>
            ) : (
              <button
                type="button"
                disabled={busy !== null}
                onClick={transferSent}
                className="mt-3 rounded-md border border-card-border bg-background px-4 py-2 text-sm font-medium hover:border-accent disabled:opacity-50"
              >
                {busy === "transfer" ? "Telling the host..." : "I've sent the transfer"}
              </button>
            )}
          </div>
        )}

        {cardAvailable && (
          <div className="rounded-md border border-card-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Card</p>
            <h3 className="mt-1 font-semibold">Credit or debit card</h3>
            <p className="mt-1 text-2xl font-extrabold">{formatMoney(total + fee)}</p>
            {fee > 0 && (
              <p className="text-xs text-muted">
                {formatMoney(total)} + {formatMoney(fee)} {ADMIN_FEE_NAME.toLowerCase()} ({ADMIN_FEE_PERCENT}%)
              </p>
            )}
            <p className="mt-3 text-sm text-muted">
              Secure payment by Stripe.
              {fee > 0 && " The admin service fee appears as its own line on your invoice and receipt."}
            </p>
            {fee > 0 && <p className="mt-2 text-sm text-muted">{ADMIN_FEE_REFUND_NOTE}</p>}
            <p className="mt-3 rounded-md bg-soft px-3 py-2 text-sm">
              <strong>The host&apos;s cancellation policy applies to card payments too.</strong> To cancel or change
              your booking, contact your host, who arranges any refund. This does not affect your rights under the
              Australian Consumer Law.
            </p>
            <label className="mt-3 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I accept the host&apos;s cancellation policy, and understand that any refund is arranged with the host
                {fee > 0 && " and that the admin service fee is non-refundable (except as the law requires, or if the host cancels or can't provide the stay)"}
                .
              </span>
            </label>
            <button
              type="button"
              disabled={busy !== null || !agreed}
              onClick={payByCard}
              className="mt-3 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
            >
              {busy === "card" ? "Opening secure payment..." : `Pay ${formatMoney(total + fee)} by card`}
            </button>
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
