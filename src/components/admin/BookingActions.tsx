"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmationComposer } from "@/components/admin/ConfirmationComposer";
import { formatDateTime } from "@/lib/format";

type Props = {
  bookingId: string;
  status: string;
  guestPhone: string | null;
  confirmationTextSentAt: Date | null;
  confirmationEmailSentAt: Date | null;
  showViewLink?: boolean;
};

export function BookingActions({
  bookingId,
  status,
  guestPhone,
  confirmationTextSentAt,
  confirmationEmailSentAt,
  showViewLink = true,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composer, setComposer] = useState<"both" | "email" | "text" | null>(null);

  async function patch(body: object) {
    const res = await fetch(`/api/admin/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(typeof data.error === "string" ? data.error : "Could not update the booking");
    }
  }

  async function setStatus(next: string) {
    setBusy(true);
    setError(null);
    try {
      await patch({ status: next });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the booking");
    } finally {
      setBusy(false);
    }
  }

  // Confirming does not send anything by itself: it opens the message so the host can read it,
  // add to it, and choose to send.
  async function confirmAndReview() {
    setBusy(true);
    setError(null);
    try {
      await patch({ status: "CONFIRMED", notify: false });
      router.refresh();
      setComposer("both");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm the booking");
    } finally {
      setBusy(false);
    }
  }

  const composerModal = composer ? (
    <ConfirmationComposer
      bookingId={bookingId}
      guestPhone={guestPhone}
      show={composer}
      onClose={() => {
        setComposer(null);
        router.refresh();
      }}
    />
  ) : null;

  const small = "rounded-md border border-card-border px-3 py-1.5 text-xs font-medium disabled:opacity-50";

  const textButton = guestPhone ? (
    <button
      disabled={busy}
      onClick={() => setComposer("text")}
      title={
        confirmationTextSentAt ? `Last texted ${formatDateTime(confirmationTextSentAt)}` : undefined
      }
      className={small}
    >
      {confirmationTextSentAt ? "Text again" : "Text confirmation"}
    </button>
  ) : null;

  const emailButton = (
    <button
      disabled={busy}
      onClick={() => setComposer("email")}
      title={
        confirmationEmailSentAt
          ? `Last emailed ${formatDateTime(confirmationEmailSentAt)}`
          : undefined
      }
      className={small}
    >
      {confirmationEmailSentAt ? "Email again" : "Email confirmation"}
    </button>
  );

  const viewLink = showViewLink ? (
    <Link href={`/admin/bookings/${bookingId}`} className={small}>
      View
    </Link>
  ) : null;

  if (status === "PENDING") {
    return (
      <div className="flex flex-col items-start gap-1.5">
        <div className="flex flex-wrap gap-2">
          <button
            disabled={busy}
            onClick={confirmAndReview}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
          >
            Confirm
          </button>
          <button disabled={busy} onClick={() => setStatus("DECLINED")} className={small}>
            Decline
          </button>
          {viewLink}
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {composerModal}
      </div>
    );
  }

  if (status === "CONFIRMED") {
    return (
      <div className="flex flex-col items-start gap-1.5">
        <div className="flex flex-wrap gap-2">
          {emailButton}
          {textButton}
          <button disabled={busy} onClick={() => setStatus("CANCELLED")} className={small}>
            Cancel
          </button>
          {viewLink}
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {composerModal}
      </div>
    );
  }

  return viewLink;
}
