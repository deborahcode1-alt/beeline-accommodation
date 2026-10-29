"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Owner controls for one host's Get live checklist: email it to them, approve them, or take them offline.
export function OwnerGetLive({
  hostId,
  approved,
  allDone,
}: {
  hostId: string;
  approved: boolean;
  allDone: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"send" | "approve" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setBusy("send");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/hosts/${hostId}/send-checklist`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send");
      setMessage(`Checklist emailed to ${data.sent.join(", ")}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send");
    } finally {
      setBusy(null);
    }
  }

  async function setApproved(next: boolean) {
    if (next && !allDone && !window.confirm("Some steps are not done yet. Switch this host live anyway?")) return;
    if (!next && !window.confirm("Take this host's listings off the site?")) return;
    setBusy("approve");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/hosts/${hostId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveApproved: next }),
      });
      if (!res.ok) throw new Error("Could not save that");
      setMessage(next ? "Approved. Their listings are live and we've emailed them." : "Taken offline.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={busy !== null}
        onClick={send}
        className="rounded-md border border-card-border px-4 py-2 text-sm font-medium hover:border-accent disabled:opacity-50"
      >
        {busy === "send" ? "Sending..." : "Email this checklist to the host"}
      </button>
      {approved ? (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => setApproved(false)}
          className="rounded-md border border-card-border px-4 py-2 text-sm font-medium text-red-600 disabled:opacity-50"
        >
          Take offline
        </button>
      ) : (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => setApproved(true)}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
        >
          Approve and go live
        </button>
      )}
      {message && <p className="text-sm text-accent-deep">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
