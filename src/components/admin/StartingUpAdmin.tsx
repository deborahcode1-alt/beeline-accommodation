"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  name: string;
  /** e.g. "free until 10 February 2027" */
  endsLabel: string;
  /** Whole days left; negative once it has ended. */
  daysLeft: number | null;
  invitedLabel: string | null;
};

// The owner's view of the free Starting up tier: switch it on or off for new hosts, and invite hosts on it to subscribe.
export function StartingUpAdmin({ offered, rows, months }: { offered: boolean; rows: Row[]; months: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function post(body: Record<string, unknown>, key: string) {
    setBusy(key);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/starting-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.refresh();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function toggle() {
    if (
      offered &&
      !window.confirm(
        "Stop offering Starting up to new hosts? Hosts already on it keep their free time, and you can still invite them to subscribe."
      )
    ) {
      return;
    }
    await post({ action: "setOffered", offered: !offered }, "toggle");
  }

  async function invite(row: Row) {
    const data = await post({ action: "invite", hostId: row.id }, row.id);
    if (data?.sentTo) setMessage(`Invitation sent to ${data.sentTo}.`);
  }

  const small = "rounded-md border border-card-border px-3 py-1.5 text-xs font-medium hover:border-accent disabled:opacity-50";
  return (
    <div className="mt-6 rounded-2xl border border-card-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">Starting up (free for {months} months)</p>
          <p className="mt-1 text-sm text-muted">
            {offered
              ? "New hosts can choose this free tier on their subscription page. Their listings stay on the site until you act."
              : "Not being offered to new hosts right now. Hosts already on it keep their free time."}
          </p>
        </div>
        <button type="button" disabled={busy !== null} onClick={toggle} className={small}>
          {busy === "toggle" ? "Saving..." : offered ? "Stop offering Starting up" : "Offer Starting up again"}
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {rows.length === 0 && <p className="text-sm text-muted">No hosts are on Starting up.</p>}
        {rows.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-card-border p-3 text-sm">
            <div>
              <p className="font-medium">{r.name}</p>
              <p className="text-muted">
                {r.endsLabel}
                {r.daysLeft !== null &&
                  (r.daysLeft < 0
                    ? ` · ended ${Math.abs(r.daysLeft)} day${Math.abs(r.daysLeft) === 1 ? "" : "s"} ago`
                    : ` · ${r.daysLeft} day${r.daysLeft === 1 ? "" : "s"} left`)}
                {r.invitedLabel && ` · invited ${r.invitedLabel}`}
              </p>
            </div>
            <button type="button" disabled={busy !== null} onClick={() => invite(r)} className={small}>
              {busy === r.id ? "Sending..." : r.invitedLabel ? "Invite again" : "Invite to subscribe"}
            </button>
          </div>
        ))}
      </div>
      {message && <p className="mt-3 text-sm text-accent-deep">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
