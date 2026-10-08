"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AreaRow = {
  id: string;
  slug: string;
  name: string;
  state: string;
  published: boolean;
  listingCount: number;
};

export function AreaManager({ areas }: { areas: AreaRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [state, setState] = useState("QLD");
  const [headline, setHeadline] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addArea(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, state, headline: headline || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Check the details");
      setName("");
      setHeadline("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the area");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublished(a: AreaRow) {
    setBusy(true);
    try {
      await fetch(`/api/admin/areas/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !a.published }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const input = "rounded-md border border-card-border px-3 py-2 text-sm";
  return (
    <div>
      <form onSubmit={addArea} className="grid gap-3 sm:grid-cols-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Area name, e.g. Maryborough"
          className={`${input} sm:col-span-2`}
        />
        <input
          value={state}
          onChange={(e) => setState(e.target.value)}
          required
          maxLength={3}
          className={input}
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
        >
          Add area
        </button>
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="One-line headline for the area page (optional)"
          className={`${input} sm:col-span-4`}
        />
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-3">
        {areas.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between rounded-lg border border-card-border p-4"
          >
            <div>
              <p className="font-medium">
                {a.name} Accommodation{" "}
                {!a.published && <span className="text-xs text-muted">(hidden)</span>}
              </p>
              <p className="text-sm text-muted">
                /{a.slug} &middot; {a.state} &middot; {a.listingCount} listing(s)
              </p>
            </div>
            <button
              onClick={() => togglePublished(a)}
              disabled={busy}
              className="rounded-md border border-card-border px-3 py-1.5 text-xs font-medium hover:border-accent disabled:opacity-50"
            >
              {a.published ? "Hide" : "Publish"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
