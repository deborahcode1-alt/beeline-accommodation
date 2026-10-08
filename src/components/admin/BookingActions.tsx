"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const [textSentAt, setTextSentAt] = useState(confirmationTextSentAt);
  const [emailSentAt, setEmailSentAt] = useState(confirmationEmailSentAt);

  async function setStatus(next: string) {
    setBusy(true);
    try {
      await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function textConfirmation() {
    setBusy(true);
    setNotifyError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/text-confirmation`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't send text");
      setTextSentAt(new Date(data.booking.confirmationTextSentAt));
    } catch (err) {
      setNotifyError(err instanceof Error ? err.message : "Couldn't send text");
    } finally {
      setBusy(false);
    }
  }

  async function emailConfirmation() {
    setBusy(true);
    setNotifyError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/email-confirmation`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't send email");
      setEmailSentAt(new Date(data.booking.confirmationEmailSentAt));
    } catch (err) {
      setNotifyError(err instanceof Error ? err.message : "Couldn't send email");
    } finally {
      setBusy(false);
    }
  }

  const textButton = guestPhone ? (
    <button
      disabled={busy}
      onClick={textConfirmation}
      title={textSentAt ? `Last texted ${textSentAt.toLocaleString()}` : undefined}
      className="rounded-md border border-card-border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
    >
      {textSentAt ? "Text again" : "Text confirmation"}
    </button>
  ) : null;

  const emailButton = (
    <button
      disabled={busy}
      onClick={emailConfirmation}
      title={emailSentAt ? `Last emailed ${emailSentAt.toLocaleString()}` : undefined}
      className="rounded-md border border-card-border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
    >
      {emailSentAt ? "Email again" : "Email confirmation"}
    </button>
  );

  const viewLink = showViewLink ? (
    <Link
      href={`/admin/bookings/${bookingId}`}
      className="rounded-md border border-card-border px-3 py-1.5 text-xs font-medium"
    >
      View
    </Link>
  ) : null;

  if (status === "PENDING") {
    return (
      <div className="flex flex-col items-start gap-1.5">
        <div className="flex flex-wrap gap-2">
          <button
            disabled={busy}
            onClick={() => setStatus("CONFIRMED")}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
          >
            Confirm
          </button>
          <button
            disabled={busy}
            onClick={() => setStatus("DECLINED")}
            className="rounded-md border border-card-border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            Decline
          </button>
          {viewLink}
        </div>
        {notifyError && <p className="text-xs text-red-600">{notifyError}</p>}
      </div>
    );
  }

  if (status === "CONFIRMED") {
    return (
      <div className="flex flex-col items-start gap-1.5">
        <div className="flex flex-wrap gap-2">
          {emailButton}
          {textButton}
          <button
            disabled={busy}
            onClick={() => setStatus("CANCELLED")}
            className="rounded-md border border-card-border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          {viewLink}
        </div>
        {notifyError && <p className="text-xs text-red-600">{notifyError}</p>}
      </div>
    );
  }

  return viewLink;
}
