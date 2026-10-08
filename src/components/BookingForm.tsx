"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/format";

type Props = {
  listingId: string;
  listingName: string;
  instant?: boolean;
  basePrice: number;
  cleaningFee: number;
  minNights: number;
  maxGuests: number;
  cancellationPolicy: string;
  initialCheckIn: string;
  initialCheckOut: string;
  initialGuests: number;
};

function nightsBetween(checkIn: string, checkOut: string) {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function BookingForm({
  listingId,
  listingName,
  instant = false,
  basePrice,
  cleaningFee,
  minNights,
  maxGuests,
  cancellationPolicy,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
}: Props) {
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests || 1);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const total = nights > 0 ? basePrice * nights + cleaningFee : 0;
  const meetsMinStay = nights <= 0 || nights >= minNights;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!checkIn || !checkOut || nights <= 0) {
      setError("Check-in and check-out dates are required.");
      return;
    }
    if (!meetsMinStay) {
      setError(`Minimum stay is ${minNights} night(s).`);
      return;
    }
    if (!agreed) {
      setError("Please confirm you've read the payment and cancellation terms.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          guestName,
          guestEmail,
          guestPhone: guestPhone || undefined,
          checkIn,
          checkOut,
          guests,
          message: message || undefined,
          agreedToTerms: agreed,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.formErrors?.[0] ?? data?.error ?? "Something went wrong");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const policyParagraphs = useMemo(
    () => cancellationPolicy.split("\n\n").filter(Boolean),
    [cancellationPolicy]
  );

  if (success) {
    return (
      <div className="rounded-sm border border-card-border p-6">
        <h2 className="text-lg font-semibold">{instant ? "Booking confirmed" : "Request sent"}</h2>
        <p className="mt-2 text-sm text-muted">
          {instant
            ? `Thanks, ${guestName.split(" ")[0] || "there"}! Your stay at ${listingName} is confirmed. We've emailed the details to ${guestEmail}, and the host will be in touch to arrange payment.`
            : `Thanks, ${guestName.split(" ")[0] || "there"}! Your booking request for ${listingName} has been sent to the host. You'll hear back by email at ${guestEmail} to confirm dates and arrange payment.`}
        </p>
        <Link href="/" className="mt-4 inline-block text-sm text-accent-deep hover:underline">
          &larr; Return home
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <form onSubmit={handleSubmit} className="lg:col-span-2">
        <h2 className="text-lg font-semibold">Your details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Check-in
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
              className="rounded-md border border-card-border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Check-out
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              required
              className="rounded-md border border-card-border px-3 py-2"
            />
          </label>
        </div>

        {nights > 0 && !meetsMinStay && (
          <p className="mt-2 text-sm text-red-600">Minimum stay is {minNights} nights.</p>
        )}

        <label className="mt-4 flex flex-col gap-1 text-sm">
          Guests
          <input
            type="number"
            min={1}
            max={maxGuests}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            required
            className="w-32 rounded-md border border-card-border px-3 py-2"
          />
        </label>

        <label className="mt-4 flex flex-col gap-1 text-sm">
          Full name
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            required
            className="rounded-md border border-card-border px-3 py-2"
          />
        </label>

        <label className="mt-4 flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            required
            className="rounded-md border border-card-border px-3 py-2"
          />
        </label>

        <label className="mt-4 flex flex-col gap-1 text-sm">
          Phone (optional)
          <input
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="rounded-md border border-card-border px-3 py-2"
          />
        </label>

        <label className="mt-4 flex flex-col gap-1 text-sm">
          Message (optional)
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="rounded-md border border-card-border px-3 py-2"
          />
        </label>

        <div className="mt-6 rounded-sm border border-card-border p-4">
          <h3 className="text-sm font-semibold">Payment &amp; cancellation terms</h3>
          <div className="mt-2 max-h-48 space-y-2 overflow-y-auto text-xs text-muted">
            {policyParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5"
            />
            I&apos;ve read and agree to the payment and cancellation terms above.
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition hover:bg-accent-hover disabled:opacity-50 sm:w-auto"
        >
          {submitting ? (instant ? "Booking..." : "Sending request...") : instant ? "Confirm booking" : "Confirm request"}
        </button>
        <p className="mt-2 text-xs text-muted">
          Online payment isn&apos;t connected for this listing yet &mdash; the host will confirm
          your dates and arrange payment directly with you.
        </p>
        <Link href={`/`} className="mt-4 inline-block text-sm text-muted hover:underline">
          &larr; Return home
        </Link>
      </form>

      <aside className="rounded-sm border border-card-border p-5">
        <h3 className="font-semibold">{listingName}</h3>
        {nights > 0 ? (
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>
                {formatMoney(basePrice)} x {nights} night{nights > 1 ? "s" : ""}
              </span>
              <span>{formatMoney(basePrice * nights)}</span>
            </div>
            {cleaningFee > 0 && (
              <div className="flex justify-between">
                <span>Cleaning fee</span>
                <span>{formatMoney(cleaningFee)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-card-border pt-1 font-semibold">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">Enter your dates to see a price.</p>
        )}
      </aside>
    </div>
  );
}
