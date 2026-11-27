"use client";

import { useState } from "react";

// Sends the host to Stripe's own pages to link, or finish linking, their Stripe account.
export function ConnectStripeButton({ label, hostId }: { label: string; hostId?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Could not open Stripe");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open Stripe");
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={go}
        className="rounded-full bg-header-bg px-5 py-2.5 text-sm font-semibold text-header-fg shadow-sm transition hover:bg-black/80 disabled:opacity-50"
      >
        {busy ? "Opening Stripe..." : label}
      </button>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
