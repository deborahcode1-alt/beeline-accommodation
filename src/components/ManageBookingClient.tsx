"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { formatDate, formatMoney } from "@/lib/format";

type Props = {
  token: string;
  status: string;
  listingName: string;
  listingSlug: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  basePrice: number;
  cleaningFee: number;
  minNights: number;
  unavailableNights: string[];
};

function toISODate(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0, 10);
}

function nightsBetween(from: Date, to: Date) {
  const ms = new Date(toISODate(to)).getTime() - new Date(toISODate(from)).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function ManageBookingClient({
  token,
  status: initialStatus,
  listingName,
  listingSlug,
  checkIn,
  checkOut,
  guests,
  totalPrice,
  basePrice,
  cleaningFee,
  minNights,
  unavailableNights,
}: Props) {
  const unavailableSet = useMemo(() => new Set(unavailableNights), [unavailableNights]);
  const [status, setStatus] = useState(initialStatus);
  const [showReschedule, setShowReschedule] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [rescheduled, setRescheduled] = useState<{ checkIn: string; checkOut: string } | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isUnavailable = (date: Date) => date < today || unavailableSet.has(toISODate(date));

  const nights = range?.from && range?.to ? nightsBetween(range.from, range.to) : 0;
  const newTotal = nights > 0 ? basePrice * nights + cleaningFee : 0;
  const meetsMinStay = nights === 0 || nights >= minNights;

  async function handleCancel() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/manage/${token}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't cancel");
      setStatus("CANCELLED");
      setCancelled(true);
      setConfirmingCancel(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't cancel");
    } finally {
      setBusy(false);
    }
  }

  async function handleReschedule() {
    setError(null);
    if (!range?.from || !range?.to) {
      setError("Select new check-in and check-out dates first.");
      return;
    }
    if (!meetsMinStay) {
      setError(`Minimum stay is ${minNights} night(s).`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/manage/${token}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkIn: toISODate(range.from), checkOut: toISODate(range.to) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't reschedule");
      setStatus("PENDING");
      setRescheduled({ checkIn: toISODate(range.from), checkOut: toISODate(range.to) });
      setShowReschedule(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reschedule");
    } finally {
      setBusy(false);
    }
  }

  const displayCheckIn = rescheduled?.checkIn ?? checkIn;
  const displayCheckOut = rescheduled?.checkOut ?? checkOut;
  const isActive = status === "PENDING" || status === "CONFIRMED";

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Manage your booking</h1>

      <div className="mt-6 rounded-sm border border-card-border p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{listingName}</h2>
            <p className="mt-1 text-sm text-muted">
              {formatDate(displayCheckIn)} &rarr; {formatDate(displayCheckOut)}
            </p>
            <p className="mt-1 text-sm text-muted">{guests} guest{guests > 1 ? "s" : ""}</p>
          </div>
          <span className="shrink-0 rounded-full bg-header-bg px-2.5 py-1 text-xs font-medium text-header-fg">
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </span>
        </div>
        <p className="mt-3 text-sm font-medium">{formatMoney(rescheduled ? newTotal || totalPrice : totalPrice)} total</p>

        {rescheduled && (
          <p className="mt-3 rounded-md bg-accent/10 px-3 py-2 text-sm text-accent-deep">
            New dates requested &mdash; this is back with the host for approval.
          </p>
        )}
        {cancelled && (
          <p className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">
            This booking has been cancelled.
          </p>
        )}

        {isActive && !cancelled && !confirmingCancel && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-card-border pt-5">
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowReschedule((v) => !v)}
              className="rounded-md border border-card-border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {showReschedule ? "Cancel change" : "Request different dates"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmingCancel(true)}
              className="rounded-md border border-card-border px-4 py-2 text-sm font-medium text-red-600 disabled:opacity-50"
            >
              Cancel booking
            </button>
          </div>
        )}

        {confirmingCancel && !cancelled && (
          <div className="mt-5 rounded-md bg-red-500/10 p-4 border-t border-card-border">
            <p className="text-sm font-medium text-red-600">
              Cancel this booking? This can&apos;t be undone.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={handleCancel}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {busy ? "Cancelling..." : "Yes, cancel it"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmingCancel(false)}
                className="rounded-md border border-card-border px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                No, keep it
              </button>
            </div>
          </div>
        )}

        {showReschedule && (
          <div className="mt-5 border-t border-card-border pt-5">
            <div className="overflow-x-auto">
              <DayPicker
                mode="range"
                selected={range}
                onSelect={setRange}
                disabled={isUnavailable}
                excludeDisabled
                numberOfMonths={1}
                className="!mx-auto"
                classNames={{ day_button: "font-semibold text-foreground" }}
                modifiersClassNames={{ disabled: "!font-normal !text-red-600 !bg-red-500/10 !line-through" }}
              />
            </div>
            {nights > 0 && (
              <p className="mt-2 text-sm text-muted">
                {nights} night{nights > 1 ? "s" : ""} &middot; {formatMoney(newTotal)} total
              </p>
            )}
            {nights > 0 && !meetsMinStay && (
              <p className="mt-2 text-sm text-red-600">Minimum stay is {minNights} nights.</p>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={handleReschedule}
              className="mt-3 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
            >
              {busy ? "Sending..." : "Send new dates to host"}
            </button>
            <p className="mt-2 text-xs text-muted">
              The host needs to approve new dates before they&apos;re confirmed.
            </p>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href={`/listings/${listingSlug}`} className="text-accent-deep hover:underline">
          View listing
        </Link>
        <Link href="/" className="text-muted hover:underline">
          &larr; Back to home
        </Link>
      </div>
    </div>
  );
}
