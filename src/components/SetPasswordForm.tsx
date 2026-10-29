"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/PasswordInput";

export function SetPasswordForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save your password");
      router.push(data.redirect ?? "/admin/get-live");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your password");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 grid max-w-sm gap-4">
      <p className="text-sm text-muted">
        Your sign-in email is <strong className="text-foreground">{email}</strong>.
      </p>
      <label className="flex flex-col gap-1 text-sm">
        Choose a password (at least 8 characters)
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-md border border-card-border px-3 py-2"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-fit rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
      >
        {busy ? "Saving..." : "Save password and continue"}
      </button>
    </form>
  );
}
