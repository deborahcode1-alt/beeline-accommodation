"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// The host's side of the free Starting up tier: choose it, or see how long it runs.
export function StartingUpChoice({
  months,
  onIt,
  endsLabel,
}: {
  months: number;
  /** Already on the tier. */
  onIt: boolean;
  /** When it runs to, as text, e.g. "10 February 2027". */
  endsLabel?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "startingUp" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (onIt) {
    return (
      <div className="rounded-2xl border border-accent bg-soft p-5 text-sm">
        <p className="font-semibold">You&apos;re on Starting up</p>
        <p className="mt-1">
          It&apos;s free{endsLabel ? ` until ${endsLabel}` : ""}, with no card needed. Your listings stay on the site.
          Near the end we&apos;ll invite you to choose a plan, and you can subscribe any time before then.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-card-border p-5 text-sm">
      <p className="font-semibold">Just getting started? Choose Starting up</p>
      <p className="mt-1">
        Free for {months} months, with no card needed and no commission on your bookings. Your listings go on the
        site as normal. After {months} months we&apos;ll invite you to choose a plan.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={choose}
        className="mt-3 rounded-md border border-card-border px-4 py-2 text-sm font-medium hover:border-accent disabled:opacity-50"
      >
        {busy ? "Saving..." : `Choose Starting up (free for ${months} months)`}
      </button>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
