"use client";

import { useState } from "react";

export function ChangePasswordForm() {
  const [step, setStep] = useState<"request" | "confirm" | "done">("request");
  const [currentPassword, setCurrentPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/account/change-password/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't send a verification code");
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send a verification code");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/account/change-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't change password");
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't change password");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "done") {
    return (
      <p className="text-sm text-accent-deep">
        Password changed. Use your new password next time you sign in.
      </p>
    );
  }

  if (step === "confirm") {
    return (
      <form onSubmit={handleConfirm} className="grid max-w-sm gap-4">
        <p className="text-sm text-muted">
          We emailed a 6-digit code to your account email. Enter it below along with your new
          password.
        </p>
        <label className="flex flex-col gap-1 text-sm">
          Verification code
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            inputMode="numeric"
            autoFocus
            className="rounded-md border border-card-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          New password
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="rounded-md border border-card-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Confirm new password
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="rounded-md border border-card-border px-3 py-2"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-fit rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Change password"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("request");
              setError(null);
              setCode("");
            }}
            className="text-sm text-muted hover:underline"
          >
            Start over
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequestCode} className="grid max-w-sm gap-4">
      <p className="text-sm text-muted">
        Enter your current password and we&apos;ll email a verification code to your account
        email before letting you set a new one.
      </p>
      <label className="flex flex-col gap-1 text-sm">
        Current password
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="rounded-md border border-card-border px-3 py-2"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
      >
        {submitting ? "Sending..." : "Send verification code"}
      </button>
    </form>
  );
}
