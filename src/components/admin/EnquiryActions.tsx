"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Approve, decline or re-invite one host request. Approving does everything: it creates the host and their
// login and emails them a link to choose a password.
export function EnquiryActions({
  id,
  status,
  hostId,
  name,
}: {
  id: string;
  status: string;
  hostId: string | null;
  name: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  async function act(action: "approve" | "resend" | "decline", sendEmail?: boolean) {
    setBusy(action + (sendEmail ? "-email" : ""));
    setError(null);
    setMessage(null);
    setInviteLink(null);
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, sendEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      if (action === "decline") setMessage("Declined.");
      else if (data.emailed) setMessage(`Done. ${name} has been emailed a link to set their password.`);
      else {
        setMessage("Done, but the email couldn't be sent. Send them this link yourself:");
        setInviteLink(data.inviteLink ?? null);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  const disabled = busy !== null;
  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        {status === "NEW" && (
          <>
            <button
              type="button"
              disabled={disabled}
              onClick={() => act("approve")}
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
            >
              {busy === "approve" ? "Setting up..." : "Approve and invite"}
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => window.confirm(`Decline ${name} without emailing them?`) && act("decline", false)}
              className="rounded-md border border-card-border px-3 py-2 text-sm font-medium hover:border-accent disabled:opacity-50"
            >
              Decline
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => window.confirm(`Decline ${name} and send them a polite email?`) && act("decline", true)}
              className="rounded-md border border-card-border px-3 py-2 text-sm font-medium hover:border-accent disabled:opacity-50"
            >
              Decline and email them
            </button>
          </>
        )}
        {status === "APPROVED" && (
          <>
            {hostId && (
              <Link
                href={`/admin/hosts/${hostId}`}
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover"
              >
                Open their host page
              </Link>
            )}
            <button
              type="button"
              disabled={disabled}
              onClick={() => act("resend")}
              className="rounded-md border border-card-border px-3 py-2 text-sm font-medium hover:border-accent disabled:opacity-50"
            >
              {busy === "resend" ? "Sending..." : "Send the invite again"}
            </button>
          </>
        )}
      </div>
      {message && <p className="mt-2 text-sm text-accent-deep">{message}</p>}
      {inviteLink && (
        <input
          readOnly
          value={inviteLink}
          onFocus={(e) => e.currentTarget.select()}
          className="mt-2 w-full rounded-md border border-card-border px-3 py-2 text-xs"
        />
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
