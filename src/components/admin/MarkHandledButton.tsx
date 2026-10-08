"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MarkHandledButton({ messageId }: { messageId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function markHandled() {
    setBusy(true);
    try {
      await fetch(`/api/admin/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handled: true }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={markHandled}
      disabled={busy}
      className="rounded-md border border-card-border px-2.5 py-1 text-xs font-medium hover:border-accent disabled:opacity-50"
    >
      Mark handled
    </button>
  );
}
