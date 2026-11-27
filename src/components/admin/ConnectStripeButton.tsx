"use client";

import { useState } from "react";

// Sends the host to Stripe's own pages to link, or finish linking, their Stripe account.
export function ConnectStripeButton({ label, hostId }: { label: string; hostId?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set when the main Stripe account still has a set-up step to finish: the Stripe page to do it on.
  const [setupUrl, setSetupUrl] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    setSetupUrl(null);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostId }),
      });
      const data = await res.json();
      if (data.setupUrl) setSetupUrl(data.setupUrl);
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
      {error && !setupUrl && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {setupUrl && (
        <div className="mt-3 max-w-md rounded-xl border border-card-border bg-soft p-4">
          <p className="text-sm">{error}</p>
          <a
            href={setupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover"
          >
            Sign in to Stripe and finish set-up
          </a>
        </div>
      )}
    </div>
  );
}
