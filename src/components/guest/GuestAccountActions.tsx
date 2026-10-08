"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    await fetch("/api/guest/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }
  return (
    <button
      onClick={signOut}
      className="rounded-md border border-card-border px-4 py-2 text-sm font-medium hover:border-accent"
    >
      Sign out
    </button>
  );
}

export function ChangePasswordBox() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/guest/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not change your password");
      setMessage({ ok: true, text: "Password changed." });
      setCurrent("");
      setNext("");
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setBusy(false);
    }
  }

  const input = "rounded-md border border-card-border bg-background px-3 py-2";
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-card-border px-4 py-2 text-sm font-medium hover:border-accent"
      >
        Change password
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="grid max-w-sm gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Current password
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          autoComplete="current-password"
          className={input}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        New password (at least 8 characters)
        <input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className={input}
        />
      </label>
      {message && (
        <p className={`text-sm ${message.ok ? "text-accent-deep" : "text-red-600"}`}>{message.text}</p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-fit rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
      >
        {busy ? "Saving..." : "Save new password"}
      </button>
    </form>
  );
}
