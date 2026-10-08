"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/format";

type ImportRow = {
  id: string;
  url: string;
  label: string;
  lastSyncedAt: Date | null;
  lastError: string | null;
};

export function IcalImportManager({
  listingId,
  imports,
}: {
  listingId: string;
  imports: ImportRow[];
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addImport(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/ical-imports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, label }),
      });
      if (!res.ok) throw new Error("Could not add that calendar URL");
      setUrl("");
      setLabel("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add calendar");
    } finally {
      setBusy(false);
    }
  }

  async function removeImport(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/admin/listings/${listingId}/ical-imports?importId=${id}`, {
        method: "DELETE",
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function syncNow() {
    setBusy(true);
    try {
      await fetch(`/api/admin/listings/${listingId}/sync`, { method: "POST" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="space-y-2">
        {imports.map((imp) => (
          <div
            key={imp.id}
            className="flex items-center justify-between rounded-lg border border-card-border p-3 text-sm"
          >
            <div className="min-w-0">
              <p className="font-medium">{imp.label}</p>
              <p className="truncate text-xs text-muted">{imp.url}</p>
              <p className="mt-1 text-xs text-muted">
                {imp.lastError
                  ? `Sync error: ${imp.lastError}`
                  : imp.lastSyncedAt
                  ? `Last synced ${formatDate(imp.lastSyncedAt)}`
                  : "Not synced yet"}
              </p>
            </div>
            <button
              onClick={() => removeImport(imp.id)}
              disabled={busy}
              className="ml-4 shrink-0 text-xs text-red-600 hover:underline disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ))}
        {imports.length === 0 && (
          <p className="text-sm text-muted">
            No calendars connected yet. Connect as many booking platforms as you use (Airbnb,
            Booking.com, VRBO, etc.) &mdash; each has an &quot;export calendar&quot; URL in its
            calendar settings.
          </p>
        )}
      </div>

      <form onSubmit={addImport} className="mt-4 flex flex-wrap gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (e.g. Booking.com)"
          required
          className="w-44 rounded-md border border-card-border px-3 py-2 text-sm"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://.../calendar/ical/....ics"
          required
          className="min-w-[260px] flex-1 rounded-md border border-card-border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
        >
          Connect
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {imports.length > 0 && (
        <button
          onClick={syncNow}
          disabled={busy}
          className="mt-3 text-sm text-muted hover:underline disabled:opacity-50"
        >
          Sync all now
        </button>
      )}
    </div>
  );
}
