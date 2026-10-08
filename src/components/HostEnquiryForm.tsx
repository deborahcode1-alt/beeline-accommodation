"use client";

import { useState } from "react";

export function HostEnquiryForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", area: "", details: "", website: "" });
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
      const res = await fetch("/api/host-enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, phone: form.phone || undefined, details: form.details || undefined }),
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
      <p className="rounded-lg bg-soft p-5 text-sm">
        Thanks &mdash; we&apos;ve got your details and will be in touch soon.
      </p>
    );
  }

  const input = "rounded-md border border-card-border bg-background px-3 py-2";
  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Your name
        <input value={form.name} onChange={(e) => update("name", e.target.value)} required className={input} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required className={input} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Phone (optional)
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={input} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Which town or area is your property in?
        <input value={form.area} onChange={(e) => update("area", e.target.value)} required className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Tell us about your property (optional)
        <textarea value={form.details} onChange={(e) => update("details", e.target.value)} rows={4} className={input} />
      </label>
      {/* Honeypot field: hidden from people, tempting to bots. */}
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
        className="w-fit rounded-md bg-accent px-6 py-3 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
      >
        {state === "sending" ? "Sending..." : "Register your interest"}
      </button>
    </form>
  );
}
