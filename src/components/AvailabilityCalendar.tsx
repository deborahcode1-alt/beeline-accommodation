"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { formatMoney } from "@/lib/format";

type Props = {
  slug: string;
  instant?: boolean;
  basePrice: number;
  cleaningFee: number;
  minNights: number;
  maxGuests: number;
  unavailableNights: string[];
};

function toISODate(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0, 10);
}

function nightsBetween(from: Date, to: Date) {
  const ms = new Date(toISODate(to)).getTime() - new Date(toISODate(from)).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function formatFriendly(d: Date) {
  return new Intl.DateTimeFormat("en-AU", { weekday: "long", month: "long", day: "numeric" }).format(d);
}

export function AvailabilityCalendar({
  instant = false,
  slug,
  basePrice,
  cleaningFee,
  minNights,
  maxGuests,
  unavailableNights,
}: Props) {
  const router = useRouter();
  const unavailableSet = useMemo(() => new Set(unavailableNights), [unavailableNights]);
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [dayNotice, setDayNotice] = useState<string | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isUnavailable = (date: Date) => {
    if (date < today) return true;
    return unavailableSet.has(toISODate(date));
  };

  function rangeHasUnavailable(r: DateRange) {
    if (!r.from) return false;
    const end = r.to ?? r.from;
    const cursor = new Date(r.from);
    while (cursor <= end) {
      if (isUnavailable(cursor)) return true;
      cursor.setDate(cursor.getDate() + 1);
    }
    return false;
  }

  const nights = range?.from && range?.to ? nightsBetween(range.from, range.to) : 0;
  const total = nights > 0 ? basePrice * nights + cleaningFee : 0;
  const meetsMinStay = nights === 0 || nights >= minNights;

  function handleBookNow() {
    setError(null);
    if (!range?.from || !range?.to) {
      setError("Select your check-in and check-out dates first.");
      return;
    }
    if (!meetsMinStay) {
      setError(`Minimum stay is ${minNights} night(s).`);
      return;
    }
    const params = new URLSearchParams({
      checkIn: toISODate(range.from),
      checkOut: toISODate(range.to),
      guests: String(guests),
    });
    router.push(`/listings/${slug}/book?${params.toString()}`);
  }

  return (
    <div className="rounded-sm border border-card-border p-6">
      <div className="flex items-baseline justify-between">
        <p className="text-lg font-semibold">{formatMoney(basePrice)} / night</p>
        {cleaningFee > 0 && (
          <p className="text-xs text-muted">+ {formatMoney(cleaningFee)} cleaning fee</p>
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <DayPicker
          mode="range"
          selected={range}
          onSelect={(next, triggerDate) => {
            if (isUnavailable(triggerDate)) {
              setDayNotice(`${formatFriendly(triggerDate)} isn't available for booking.`);
              return;
            }
            if (next && rangeHasUnavailable(next)) {
              setDayNotice("Those dates include a night that isn't available — try a shorter range.");
              return;
            }
            setDayNotice(null);
            setRange(next);
          }}
          numberOfMonths={1}
          className="!mx-auto"
          modifiers={{ unavailable: isUnavailable, available: (d) => !isUnavailable(d) }}
          modifiersClassNames={{
            unavailable: "!text-red-600 !bg-red-500/10 !line-through",
            available: "!font-semibold !text-foreground",
          }}
        />
      </div>

      <p className="mt-2 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-foreground" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500/60" /> Unavailable
        </span>
      </p>

      {dayNotice && (
        <p className="mt-2 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{dayNotice}</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <label className="flex flex-col gap-1">
          Check-in
          <input
            readOnly
            value={range?.from ? toISODate(range.from) : ""}
            className="rounded-md border border-card-border px-2 py-1.5"
            placeholder="Select date"
          />
        </label>
        <label className="flex flex-col gap-1">
          Check-out
          <input
            readOnly
            value={range?.to ? toISODate(range.to) : ""}
            className="rounded-md border border-card-border px-2 py-1.5"
            placeholder="Select date"
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
          className="rounded-md border border-card-border px-2 py-1.5"
        />
      </label>

      {nights > 0 && (
        <div className="mt-4 space-y-1 border-t border-card-border pt-4 text-sm">
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
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleBookNow}
        className="mt-4 w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition hover:bg-accent-hover"
      >
        {instant ? "Book instantly" : "Request to book"}
      </button>
      <Link
        href="/"
        className="mt-3 block text-center text-sm text-muted underline-offset-2 hover:underline"
      >
        Return home
      </Link>
    </div>
  );
}
