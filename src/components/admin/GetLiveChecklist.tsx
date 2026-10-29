"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { GetLiveItem } from "@/lib/getLive";

// The Get live steps, ticked from what the host has saved. Two steps are confirmed with a button.
export function GetLiveChecklist({ items, canConfirm }: { items: GetLiveItem[]; canConfirm: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function confirm(action: "agree" | "noCalendars") {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch("/api/admin/get-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not save that");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <ol className="space-y-3">
        {items.map((item, i) => (
          <li
            key={item.key}
            className={`flex gap-3 rounded-lg border p-4 ${item.done ? "border-card-border bg-soft" : "border-card-border"}`}
          >
            <span
              aria-hidden
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                item.done ? "bg-accent text-accent-fg" : "border border-card-border text-muted"
              }`}
            >
              {item.done ? "✓" : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {item.label} <span className="sr-only">{item.done ? "(done)" : "(to do)"}</span>
              </p>
              <p className="mt-0.5 text-sm text-muted">{item.detail}</p>
              {!item.done && (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {item.href && (
                    <Link
                      href={item.href}
                      className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg transition hover:bg-accent-hover"
                    >
                      {item.action === "agree" ? "Read the agreement" : "Go there"}
                    </Link>
                  )}
                  {canConfirm && item.action === "agree" && (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => confirm("agree")}
                      className="rounded-md border border-card-border px-3 py-1.5 text-xs font-medium hover:border-accent disabled:opacity-50"
                    >
                      {busy === "agree" ? "Saving..." : "I have read it and I agree"}
                    </button>
                  )}
                  {canConfirm && item.action === "noCalendars" && (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => confirm("noCalendars")}
                      className="rounded-md border border-card-border px-3 py-1.5 text-xs font-medium hover:border-accent disabled:opacity-50"
                    >
                      {busy === "noCalendars" ? "Saving..." : "I don’t list anywhere else"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
