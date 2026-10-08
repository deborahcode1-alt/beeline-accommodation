"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = { id: string; email: string; isYou: boolean };

export function TeamManager({ members }: { members: Member[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setCreated(null);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create the login");
      setCreated(data);
      setEmail("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the login");
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(m: Member) {
    if (!window.confirm(`Remove ${m.email}? They will no longer be able to sign in.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/team/${m.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not remove the login");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the login");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl">
      <ul className="space-y-2">
        {members.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between rounded-lg border border-card-border px-4 py-3 text-sm"
          >
            <span>
              {m.email} {m.isYou && <span className="text-xs text-muted">(you)</span>}
            </span>
            {!m.isYou && (
              <button
                onClick={() => removeMember(m)}
                disabled={busy}
                className="rounded-md border border-card-border px-3 py-1 text-xs font-medium hover:border-red-400 disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-lg font-semibold">Add a collaborator</h2>
      <p className="mt-1 text-sm text-muted">
        They sign in on the normal sign-in page with their own email and password, and get the
        same access as you. After signing in they can change their password from the Account
        tab.
      </p>
      <form onSubmit={addMember} className="mt-3 flex flex-wrap gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="collaborator@example.com"
          className="min-w-64 flex-1 rounded-md border border-card-border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
        >
          Create login
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {created && (
        <div className="mt-3 rounded-lg border border-accent bg-soft p-4 text-sm">
          <p className="font-semibold">Login created. Copy this now, it is shown only once.</p>
          <p className="mt-2">
            Email: <code>{created.email}</code>
          </p>
          <p>
            Temporary password: <code>{created.password}</code>
          </p>
        </div>
      )}
    </div>
  );
}
