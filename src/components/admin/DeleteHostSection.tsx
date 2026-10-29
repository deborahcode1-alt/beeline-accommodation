"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Owner only: remove a host completely. Typing their name guards against a mis-click.
export function DeleteHostSection({
  hostId,
  hostName,
  listings,
  bookings,
  logins,
}: {
  hostId: string;
  hostName: string;
  listings: number;
  bookings: number;
  logins: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/hosts/${hostId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmName: typed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not delete this host");
      router.push("/admin/hosts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this host");
      setBusy(false);
    }
  }

  return (
    <section className="mt-14 rounded-lg border border-red-300 p-5">
      <h2 className="text-lg font-semibold text-red-700">Delete this host</h2>
      <p className="mt-1 text-sm text-muted">
        Removes {hostName} completely: {listings} listing{listings === 1 ? "" : "s"}, {bookings} booking
        {bookings === 1 ? "" : "s"} (including past stays), {logins} sign-in{logins === 1 ? "" : "s"}, their photos and
        messages. Any Stripe subscription is cancelled. This can&apos;t be undone. To just hide them, set their status
        to Cancelled instead.
      </p>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Delete host&hellip;
        </button>
      ) : (
        <div className="mt-3">
          <label className="flex flex-col gap-1 text-sm">
            Type <strong>{hostName}</strong> to confirm
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="max-w-sm rounded-md border border-card-border px-3 py-2"
            />
          </label>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy || typed.trim().toLowerCase() !== hostName.trim().toLowerCase()}
              onClick={remove}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {busy ? "Deleting..." : "Delete this host for good"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                setTyped("");
                setError(null);
              }}
              className="rounded-md border border-card-border px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
}
