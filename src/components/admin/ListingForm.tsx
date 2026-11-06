"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PROPERTY_TYPES, type PropertyType } from "@/lib/propertyType";
import {
  BATHROOM_CHOICES,
  BEDROOM_CHOICES,
  BLURB_LISTING_MAX,
  PARKING_OPTIONS,
  bathroomLabel,
  bedroomLabel,
  type ParkingType,
} from "@/lib/listingFacts";
import {
  POLICY_CHOICES,
  composeCancellationPolicy,
  presetFor,
  type PolicyType,
} from "@/lib/cancellationPolicies";

type Host = { id: string; name: string; squareConnected: boolean };

type Initial = {
  id?: string;
  name: string;
  tagline: string;
  description: string;
  cancellationPolicy: string;
  cancellationPolicyType: PolicyType | "";
  cancellationNotes: string;
  address: string;
  stayType: "SHORT_TERM" | "LONG_TERM";
  propertyType: PropertyType;
  petFriendly: boolean;
  parking: ParkingType;
  bookingMode: "REQUEST" | "INSTANT";
  areaId: string | null;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  basePrice: number;
  cleaningFee: number;
  minNights: number;
  amenities: string[];
  published: boolean;
  hostId: string | null;
};

const empty: Initial = {
  name: "",
  tagline: "",
  description: "",
  cancellationPolicy: "",
  cancellationPolicyType: "",
  cancellationNotes: "",
  address: "",
  stayType: "SHORT_TERM",
  propertyType: "HOUSE",
  petFriendly: false,
  parking: "NONE",
  bookingMode: "REQUEST",
  areaId: null,
  maxGuests: 2,
  bedrooms: 1,
  beds: 1,
  baths: 1,
  basePrice: 100,
  cleaningFee: 0,
  minNights: 1,
  amenities: [],
  published: true,
  hostId: null,
};

type AreaOption = { id: string; name: string };

const field = "rounded-md border border-card-border px-3 py-2";

export function ListingForm({
  initial,
  areas = [],
  isOwner = true,
}: {
  initial?: Initial;
  areas?: AreaOption[];
  isOwner?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Initial>(initial ?? empty);
  const [amenitiesText, setAmenitiesText] = useState((initial?.amenities ?? []).join(", "));
  const [hosts, setHosts] = useState<Host[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/hosts")
      .then((r) => r.json())
      .then((data) => setHosts(data.hosts ?? []))
      .catch(() => {});
  }, []);

  function update<K extends keyof Initial>(key: K, value: Initial[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      ...form,
      // Nothing chosen yet: leave the policy alone. Otherwise send the choice and the server builds the text.
      cancellationPolicy: form.cancellationPolicyType === "custom" ? form.cancellationPolicy : undefined,
      cancellationPolicyType: form.cancellationPolicyType || undefined,
      cancellationNotes: form.cancellationPolicyType && form.cancellationPolicyType !== "custom" ? form.cancellationNotes : undefined,
      hostId: isOwner ? form.hostId || undefined : undefined,
      areaId: form.areaId || null,
      amenities: amenitiesText
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
    };

    try {
      const res = await fetch(
        form.id ? `/api/admin/listings/${form.id}` : "/api/admin/listings",
        {
          method: form.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : data.error ? JSON.stringify(data.error) : "Save failed"
        );
      }

      if (!form.id) {
        router.push(`/admin/listings/${data.listing.id}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
          className={field}
        />
      </label>

      <fieldset className="grid gap-4 rounded-lg border border-card-border bg-soft p-4">
        <legend className="px-1 text-sm font-semibold">About your place</legend>
        <p className="text-xs text-muted">
          These are the facts guests see on your listing card, so keep them accurate.
        </p>

        <label className="flex flex-col gap-1 text-sm">
          Short blurb
          <input
            value={form.tagline}
            onChange={(e) => update("tagline", e.target.value.slice(0, BLURB_LISTING_MAX))}
            maxLength={BLURB_LISTING_MAX}
            placeholder="One friendly line, e.g. A sunny heritage room above the main street"
            className={field}
          />
          <span className="text-xs text-muted">
            {form.tagline.length}/{BLURB_LISTING_MAX} characters
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            Bedrooms
            <select
              value={form.bedrooms}
              onChange={(e) => update("bedrooms", Number(e.target.value))}
              className={field}
            >
              {BEDROOM_CHOICES.map((n) => (
                <option key={n} value={n}>
                  {bedroomLabel(n)}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted">Number of bedrooms, not how many it sleeps.</span>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Style
            <select
              value={form.propertyType}
              onChange={(e) => update("propertyType", e.target.value as PropertyType)}
              className={field}
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Bathrooms
            <select
              value={form.baths}
              onChange={(e) => update("baths", Number(e.target.value))}
              className={field}
            >
              {BATHROOM_CHOICES.map((n) => (
                <option key={n} value={n}>
                  {bathroomLabel(n)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Pet friendly
            <select
              value={form.petFriendly ? "yes" : "no"}
              onChange={(e) => update("petFriendly", e.target.value === "yes")}
              className={field}
            >
              <option value="no">No pets</option>
              <option value="yes">Pets welcome</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Parking
            <select
              value={form.parking}
              onChange={(e) => update("parking", e.target.value as ParkingType)}
              className={field}
            >
              {PARKING_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm">
        Description
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          required
          rows={5}
          className={field}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Address
        <input
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          className={field}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Area
          <select
            value={form.areaId ?? ""}
            onChange={(e) => update("areaId", e.target.value || null)}
            className={field}
          >
            <option value="">No area (will not appear on an area page)</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          How guests book
          <select
            value={form.bookingMode}
            onChange={(e) => update("bookingMode", e.target.value as Initial["bookingMode"])}
            className={field}
          >
            <option value="REQUEST">Request to book (you approve each one)</option>
            <option value="INSTANT">Instant booking (confirmed straight away)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Stay type
          <select
            value={form.stayType}
            onChange={(e) => update("stayType", e.target.value as Initial["stayType"])}
            className={field}
          >
            <option value="SHORT_TERM">Short-term stay</option>
            <option value="LONG_TERM">Long-term stay</option>
          </select>
        </label>
        {isOwner && (
          <label className="flex flex-col gap-1 text-sm">
            Host (Square payout account)
            <select
              value={form.hostId ?? ""}
              onChange={(e) => update("hostId", e.target.value || null)}
              className={field}
            >
              <option value="">Unassigned</option>
              {hosts.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} {h.squareConnected ? "" : "(Square not connected)"}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          Sleeps (max guests)
          <input
            type="number"
            min={1}
            value={form.maxGuests}
            onChange={(e) => update("maxGuests", Number(e.target.value))}
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Beds
          <input
            type="number"
            min={0}
            value={form.beds}
            onChange={(e) => update("beds", Number(e.target.value))}
            className={field}
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Base price / night
          <input
            type="number"
            min={0}
            value={form.basePrice}
            onChange={(e) => update("basePrice", Number(e.target.value))}
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Cleaning fee
          <input
            type="number"
            min={0}
            value={form.cleaningFee}
            onChange={(e) => update("cleaningFee", Number(e.target.value))}
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Min nights
          <input
            type="number"
            min={1}
            value={form.minNights}
            onChange={(e) => update("minNights", Number(e.target.value))}
            className={field}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Amenities (comma separated)
        <input
          value={amenitiesText}
          onChange={(e) => setAmenitiesText(e.target.value)}
          placeholder="Wifi, Kitchen, Pool"
          className={field}
        />
      </label>

      <fieldset className="flex flex-col gap-2 text-sm">
        <legend className="font-medium">Cancellation policy</legend>
        <p className="text-xs text-muted">
          Pick a ready-made policy guests will recognise from Airbnb and Booking.com, or write your own. It is shown on
          the listing page and again when someone books.
        </p>
        {POLICY_CHOICES.map((choice) => {
          const preset = presetFor(choice.type);
          const selected = form.cancellationPolicyType === choice.type;
          return (
            <label
              key={choice.type}
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                selected ? "border-accent bg-accent/10" : "border-card-border"
              }`}
            >
              <input
                type="radio"
                name="cancellationPolicyType"
                checked={selected}
                onChange={() => update("cancellationPolicyType", choice.type)}
                className="mt-1"
              />
              <span>
                <span className="font-medium">{choice.name}</span>
                {preset ? (
                  <>
                    <span> &mdash; {preset.summary}</span>
                    <span className="block text-xs text-muted">{preset.suits}</span>
                  </>
                ) : (
                  <span className="block text-xs text-muted">Write your own terms for this listing.</span>
                )}
              </span>
            </label>
          );
        })}

        {form.cancellationPolicyType === "custom" && (
          <label className="flex flex-col gap-1">
            Your cancellation terms
            <textarea
              value={form.cancellationPolicy}
              onChange={(e) => update("cancellationPolicy", e.target.value)}
              rows={6}
              placeholder="For example: free cancellation up to 14 days before check-in..."
              className={field}
            />
            <span className="text-xs text-muted">
              Put a blank line between paragraphs. Say what is refunded and when. Guests agree to this when they book.
            </span>
          </label>
        )}

        {form.cancellationPolicyType && form.cancellationPolicyType !== "custom" && (
          <>
            <div className="rounded-md bg-header-bg/5 p-3">
              <p className="text-xs font-medium text-muted">What guests will read</p>
              {composeCancellationPolicy({ type: form.cancellationPolicyType, notes: form.cancellationNotes })
                .split("\n\n")
                .map((p, i) => (
                  <p key={i} className="mt-2">
                    {p}
                  </p>
                ))}
            </div>
            <label className="flex flex-col gap-1">
              Extra terms (optional)
              <textarea
                value={form.cancellationNotes}
                onChange={(e) => update("cancellationNotes", e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="For example: check-in from 2pm, check-out by 11am. Guests are responsible for any damage during their stay."
                className={field}
              />
              <span className="text-xs text-muted">Added after the policy above, for check-in times, damage or house rules.</span>
            </label>
          </>
        )}

        {!form.cancellationPolicyType && (
          <p className="text-xs text-muted">
            Until you choose one, guests see a draft policy. Choose one before you take real bookings.
          </p>
        )}
      </fieldset>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.published}
          onChange={(e) => update("published", e.target.checked)}
        />
        Published (visible on the public site)
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 w-fit rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
      >
        {submitting ? "Saving..." : form.id ? "Save changes" : "Create listing"}
      </button>
    </form>
  );
}
