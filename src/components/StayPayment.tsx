"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";

type Props = {
  token: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  amountPaid: number | null;
  total: number;
  surcharge: number;
  surchargeLabel: string;
  reference: string;
  bank: { accountName: string; bsb: string; accountNumber: string } | null;
  cardAvailable: boolean;
  transferNotified: boolean;
  returnedFrom: "card" | "cancelled" | null;
};

// How the guest pays up front: bank transfer with no surcharge, or card with the surcharge on the invoice.
export function StayPayment({
  token,
  status,
  paymentStatus,
  paymentMethod,
  amountPaid,
  total,
  surcharge,
  surchargeLabel,
  reference,
  bank,
  cardAvailable,
  transferNotified: initialNotified,
  returnedFrom,
}: Props) {
  const [busy, setBusy] = useState<"card" | "transfer" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notified, setNotified] = useState(initialNotified);

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

  if (status !== "CONFIRMED") {
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
      const res = await fetch(`/api/manage/${token}/pay`, { method: "POST" });
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
      <p className="mt-1 text-sm text-muted">Pay up front to secure your stay. Choose how you&apos;d like to pay.</p>

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
              {cardAvailable ? `No surcharge. You save ${formatMoney(surcharge)}.` : "No surcharge."}
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
            <p className="mt-1 text-2xl font-extrabold">{formatMoney(total + surcharge)}</p>
            <p className="text-xs text-muted">
              {formatMoney(total)} + {formatMoney(surcharge)} card surcharge ({surchargeLabel})
            </p>
            <p className="mt-3 text-sm text-muted">
              Secure payment by Stripe. The surcharge appears as its own line on your invoice and receipt.
            </p>
            <button
              type="button"
              disabled={busy !== null}
              onClick={payByCard}
              className="mt-3 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
            >
              {busy === "card" ? "Opening secure payment..." : `Pay ${formatMoney(total + surcharge)} by card`}
            </button>
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
