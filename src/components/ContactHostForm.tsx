"use client";

import { useState } from "react";

export function ContactHostForm({ listingId }: { listingId: string }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/contact-host", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, ...form, phone: form.phone || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <p className="rounded-lg bg-soft p-4 text-sm">
        Message sent. The host will reply to {form.email}.
      </p>
    );
  }

  const input = "rounded-md border border-card-border bg-background px-3 py-2";
  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Your name
          <input value={form.name} onChange={(e) => update("name", e.target.value)} required className={input} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required className={input} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Phone (optional)
        <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Your question
        <textarea value={form.message} onChange={(e) => update("message", e.target.value)} required rows={4} className={input} />
      </label>
      <input
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={form.website}
        onChange={(e) => update("website", e.target.value)}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={state === "sending"}
        className="w-fit rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
      >
        {state === "sending" ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
