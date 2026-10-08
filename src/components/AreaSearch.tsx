"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Area = { slug: string; name: string; state: string };

export function AreaSearch({ areas }: { areas: Area[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) {
      setMessage("Type a town or area, for example Gympie.");
      return;
    }
    const match =
      areas.find((a) => a.name.toLowerCase() === q) ??
      areas.find((a) => a.name.toLowerCase().startsWith(q)) ??
      areas.find((a) => a.name.toLowerCase().includes(q));
    if (match) {
      router.push(`/${match.slug}`);
    } else {
      setMessage(
        `We don't have stays in "${query.trim()}" yet. Try ${areas.map((a) => a.name).join(", ")}.`
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="flex flex-col gap-2 rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/5 sm:flex-row">
        <label className="flex flex-1 items-center gap-3 px-3 py-2">
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-accent-deep" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <span className="sr-only">Where are you going?</span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setMessage(null);
            }}
            list="area-options"
            placeholder="Where are you going? e.g. Gympie"
            autoComplete="off"
            className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted"
          />
          <datalist id="area-options">
            {areas.map((a) => (
              <option key={a.slug} value={a.name} />
            ))}
          </datalist>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover"
        >
          Search stays
        </button>
      </div>
      {message && <p className="mt-2 text-sm text-foreground/80">{message}</p>}
    </form>
  );
}
