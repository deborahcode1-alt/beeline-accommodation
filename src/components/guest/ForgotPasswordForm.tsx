"use client";

import { useState } from "react";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function post(body: object) {
    const res = await fetch("/api/guest/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  }

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await post({ email });
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await post({ email, code, newPassword });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const input = "rounded-md border border-card-border bg-background px-3 py-2";
  const button =
    "rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-50";

  if (step === "done") {
    return (
      <p className="text-sm">
        Your password has been changed.{" "}
        <Link href="/sign-in" className="text-accent-deep hover:underline">
          Sign in
        </Link>
      </p>
    );
  }

  if (step === "reset") {
    return (
      <form onSubmit={resetPassword} className="grid gap-4">
        <p className="text-sm text-muted">
          If an account exists for {email}, we have emailed it a 6-digit code. Enter it below with
          a new password.
        </p>
        <label className="flex flex-col gap-1 text-sm">
          Code
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            inputMode="numeric"
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          New password (at least 8 characters)
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={input}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className={button}>
          {busy ? "Saving..." : "Set new password"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={requestCode} className="grid gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Your email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={input}
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className={button}>
        {busy ? "Sending..." : "Email me a code"}
      </button>
    </form>
  );
}
