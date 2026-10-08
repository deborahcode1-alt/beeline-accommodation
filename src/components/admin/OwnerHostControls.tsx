"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = [
  { value: "TRIAL", label: "Free trial" },
  { value: "ACTIVE", label: "Active (paying)" },
  { value: "PAST_DUE", label: "Payment overdue (grace period)" },
  { value: "CANCELLED", label: "Cancelled (listings hidden)" },
  { value: "COMPLIMENTARY", label: "Platform owner (no charge, always visible)" },
];

export function OwnerHostControls({
  hostId,
  status,
  trialEndsAt,
  logins,
}: {
  hostId: string;
  status: string;
  trialEndsAt: string;
  logins: string[];
}) {
  const router = useRouter();
  const [sub, setSub] = useState(status);
  const [trial, setTrial] = useState(trialEndsAt);
  const [subMsg, setSubMsg] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveSubscription() {
    setBusy(true);
    setSubMsg(null);
    try {
      const res = await fetch(`/api/admin/hosts/${hostId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionStatus: sub, trialEndsAt: trial || null }),
      });
      if (!res.ok) throw new Error();
      setSubMsg("Saved.");
      router.refresh();
    } catch {
      setSubMsg("Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function addLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setCreated(null);
    try {
      const res = await fetch(`/api/admin/hosts/${hostId}/logins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create the login");
      setCreated(data);
      setLoginEmail("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the login");
    } finally {
      setBusy(false);
    }
  }

  const input = "rounded-md border border-card-border px-3 py-2 text-sm";
  return (
    <div className="grid max-w-xl gap-8">
      <section>
        <h2 className="text-lg font-semibold">Subscription</h2>
        <p className="mt-1 text-sm text-muted">
          Until billing is connected, you set this by hand. Cancelled hosts disappear from the
          public site.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Status
            <select value={sub} onChange={(e) => setSub(e.target.value)} className={input}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Trial ends (optional)
            <input type="date" value={trial} onChange={(e) => setTrial(e.target.value)} className={input} />
          </label>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={saveSubscription}
            disabled={busy}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
          >
            Save subscription
          </button>
          {subMsg && <span className="text-sm text-muted">{subMsg}</span>}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Sign-ins</h2>
        <ul className="mt-2 list-disc pl-5 text-sm">
          {logins.length === 0 && <li className="list-none text-muted">No sign-ins yet.</li>}
          {logins.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <form onSubmit={addLogin} className="mt-3 flex flex-wrap gap-2">
          <input
            type="email"
            required
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="host@example.com"
            className={`${input} min-w-64 flex-1`}
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-md border border-card-border px-4 py-2 text-sm font-medium hover:border-accent disabled:opacity-50"
          >
            Create sign-in
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {created && (
          <div className="mt-3 rounded-lg border border-accent bg-soft p-4 text-sm">
            <p className="font-semibold">Sign-in created. Copy this now, it is shown only once.</p>
            <p className="mt-2">
              Email: <code>{created.email}</code>
            </p>
            <p>
              Temporary password: <code>{created.password}</code>
            </p>
            <p className="mt-2 text-muted">
              Ask them to change it from the Account tab after signing in.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
