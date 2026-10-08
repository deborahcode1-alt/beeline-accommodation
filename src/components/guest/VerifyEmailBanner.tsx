"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function VerifyEmailBanner({ email }: { email: string }) {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestCode() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/guest/verify/request", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send the code");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code");
    } finally {
      setBusy(false);
    }
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/guest/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not verify");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify");
      setBusy(false);
    }
  }

  const button =
    "rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-50";
  return (
    <div className="rounded-xl border border-accent bg-soft p-5 text-sm">
      <p className="font-semibold">Verify your email to see all your stays</p>
      <p className="mt-1 text-muted">
        We&apos;ll email a code to {email}. Once verified, every stay you have booked with that
        email appears here automatically.
      </p>
      {!sent ? (
        <button onClick={requestCode} disabled={busy} className={`${button} mt-3`}>
          {busy ? "Sending..." : "Email me a code"}
        </button>
      ) : (
        <form onSubmit={confirm} className="mt-3 flex flex-wrap gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            inputMode="numeric"
            placeholder="6-digit code"
            className="rounded-md border border-card-border bg-background px-3 py-2"
          />
          <button type="submit" disabled={busy} className={button}>
            Verify
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-red-600">{error}</p>}
    </div>
  );
}
