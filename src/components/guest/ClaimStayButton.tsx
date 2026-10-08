"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ClaimStayButton({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function claim() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/guest/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not add this stay");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add this stay");
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={claim}
        disabled={busy}
        className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
      >
        {busy ? "Adding..." : "Add this stay to my account"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
