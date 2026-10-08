"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  bookingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  message: string;
};

export function BookingEditForm({
  bookingId,
  checkIn,
  checkOut,
  guests,
  guestName,
  guestEmail,
  guestPhone,
  message,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    checkIn,
    checkOut,
    guests,
    guestName,
    guestEmail,
    guestPhone,
    message,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          guests: form.guests,
          guestName: form.guestName,
          guestEmail: form.guestEmail,
          guestPhone: form.guestPhone || null,
          message: form.message || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save changes");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Check-in
          <input
            type="date"
            value={form.checkIn}
            onChange={(e) => update("checkIn", e.target.value)}
            required
            className="rounded-md border border-card-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Check-out
          <input
            type="date"
            value={form.checkOut}
            onChange={(e) => update("checkOut", e.target.value)}
            required
            className="rounded-md border border-card-border px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Guests
        <input
          type="number"
          min={1}
          value={form.guests}
          onChange={(e) => update("guests", Number(e.target.value))}
          className="w-32 rounded-md border border-card-border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Guest name
        <input
          value={form.guestName}
          onChange={(e) => update("guestName", e.target.value)}
          required
          className="rounded-md border border-card-border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Guest email
        <input
          type="email"
          value={form.guestEmail}
          onChange={(e) => update("guestEmail", e.target.value)}
          required
          className="rounded-md border border-card-border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Guest phone
        <input
          value={form.guestPhone}
          onChange={(e) => update("guestPhone", e.target.value)}
          className="rounded-md border border-card-border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Message from guest
        <textarea
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          rows={3}
          className="rounded-md border border-card-border px-3 py-2"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-accent-deep">Changes saved.</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-fit rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
