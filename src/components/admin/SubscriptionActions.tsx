"use client";

import { useState } from "react";

export function SubscriptionActions({
  hasSubscription,
  monthlyLabel,
  yearlyLabel,
  canSubscribe = true,
  trialDays,
}: {
  hasSubscription: boolean;
  monthlyLabel?: string;
  yearlyLabel?: string;
  canSubscribe?: boolean;
  /** When the host gets free days first, so the buttons say so. */
  trialDays?: number;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go(action: "checkout" | "portal", plan?: "monthly" | "yearly") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  const primary =
    "rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-50";
  const secondary =
    "rounded-md border border-card-border px-4 py-2 text-sm font-medium hover:border-accent disabled:opacity-50";

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {hasSubscription ? (
          <>
            <button disabled={busy} onClick={() => go("portal")} className={primary}>
              Manage billing
            </button>
            <button disabled={busy} onClick={() => go("portal")} className={secondary}>
              Cancel subscription
            </button>
          </>
        ) : (
          <>
            <button disabled={busy || !canSubscribe} onClick={() => go("checkout", "monthly")} className={primary}>
              {trialDays
                ? `Start ${trialDays}-day free trial, then ${monthlyLabel ?? "monthly"}`
                : `Subscribe monthly${monthlyLabel ? ` (${monthlyLabel})` : ""}`}
            </button>
            <button disabled={busy || !canSubscribe} onClick={() => go("checkout", "yearly")} className={secondary}>
              {trialDays
                ? `Start ${trialDays}-day free trial, then ${yearlyLabel ?? "yearly"}`
                : `Subscribe yearly${yearlyLabel ? ` (${yearlyLabel})` : ""}`}
            </button>
          </>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
