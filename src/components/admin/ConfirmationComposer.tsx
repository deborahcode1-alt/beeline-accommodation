"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  bookingId: string;
  guestPhone: string | null;
  /** Which messages to show. Confirming a booking shows both. */
  show: "both" | "email" | "text";
  onClose: () => void;
};

type EmailDraft = { to: string; subject: string; text: string; configured: boolean };
type TextDraft = { to: string | null; message: string; configured: boolean };

const SMS_SEGMENT = 160;

// Shows the confirmation exactly as the guest will receive it, lets the host add to it, and only
// sends when they press the button. Nothing goes out until then.
export function ConfirmationComposer({ bookingId, guestPhone, show, onClose }: Props) {
  const router = useRouter();
  const wantEmail = show === "both" || show === "email";
  const wantText = (show === "both" || show === "text") && !!guestPhone;

  const [email, setEmail] = useState<EmailDraft | null>(null);
  const [text, setText] = useState<TextDraft | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent">("idle");
  const [textState, setTextState] = useState<"idle" | "sending" | "sent">("idle");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [textError, setTextError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (wantEmail) {
          const res = await fetch(`/api/admin/bookings/${bookingId}/email-confirmation`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Could not load the email");
          if (!cancelled) setEmail(data);
        }
        if (wantText) {
          const res = await fetch(`/api/admin/bookings/${bookingId}/text-confirmation`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Could not load the text");
          if (!cancelled) setText(data);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Could not load the message");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [bookingId, wantEmail, wantText]);

  async function sendEmail() {
    if (!email) return;
    setEmailState("sending");
    setEmailError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/email-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: email.subject, text: email.text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send the email");
      setEmailState("sent");
      router.refresh();
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Could not send the email");
      setEmailState("idle");
    }
  }

  async function sendText() {
    if (!text) return;
    setTextState("sending");
    setTextError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/text-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send the text");
      setTextState("sent");
      router.refresh();
    } catch (err) {
      setTextError(err instanceof Error ? err.message : "Could not send the text");
      setTextState("idle");
    }
  }

  const field = "w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm";
  const sendButton =
    "rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-50";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Review the confirmation before sending"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
    >
      <div className="my-8 w-full max-w-2xl rounded-xl bg-background p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Review before sending</h2>
            <p className="mt-1 text-sm text-muted">
              This is exactly what the guest will get. Add anything you like, then send. Nothing
              is sent until you press Send.
            </p>
          </div>
          <button onClick={onClose} className="text-sm text-muted hover:text-foreground">
            Close
          </button>
        </div>

        {loadError && <p className="mt-4 text-sm text-red-600">{loadError}</p>}

        {wantEmail && (
          <section className="mt-6">
            <h3 className="font-semibold">Email</h3>
            {!email && !loadError && <p className="mt-2 text-sm text-muted">Loading...</p>}
            {email && (
              <div className="mt-2 grid gap-3">
                <p className="text-sm text-muted">To: {email.to}</p>
                <label className="grid gap-1 text-sm">
                  Subject
                  <input
                    value={email.subject}
                    onChange={(e) => setEmail({ ...email, subject: e.target.value })}
                    disabled={emailState === "sent"}
                    className={field}
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  Message
                  <textarea
                    value={email.text}
                    onChange={(e) => setEmail({ ...email, text: e.target.value })}
                    disabled={emailState === "sent"}
                    rows={12}
                    className={`${field} font-mono`}
                  />
                </label>
                {!email.configured && (
                  <p className="text-xs text-muted">
                    Email is not switched on yet, so sending will explain what is missing.
                  </p>
                )}
                {emailError && <p className="text-sm text-red-600">{emailError}</p>}
                <div>
                  {emailState === "sent" ? (
                    <p className="text-sm font-medium text-accent-deep">Email sent.</p>
                  ) : (
                    <button
                      onClick={sendEmail}
                      disabled={emailState === "sending" || !email.subject.trim() || !email.text.trim()}
                      className={sendButton}
                    >
                      {emailState === "sending" ? "Sending..." : "Send email"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {wantText && (
          <section className="mt-8">
            <h3 className="font-semibold">Text message</h3>
            {!text && !loadError && <p className="mt-2 text-sm text-muted">Loading...</p>}
            {text && (
              <div className="mt-2 grid gap-3">
                <p className="text-sm text-muted">To: {text.to}</p>
                <label className="grid gap-1 text-sm">
                  Message
                  <textarea
                    value={text.message}
                    onChange={(e) => setText({ ...text, message: e.target.value })}
                    disabled={textState === "sent"}
                    rows={5}
                    className={field}
                  />
                </label>
                <p className="text-xs text-muted">
                  {text.message.length} characters &middot;{" "}
                  {Math.max(1, Math.ceil(text.message.length / SMS_SEGMENT))} text
                  {Math.ceil(text.message.length / SMS_SEGMENT) > 1 ? "s" : ""} to send
                </p>
                {!text.configured && (
                  <p className="text-xs text-muted">
                    Texting is not switched on yet, so sending will explain what is missing.
                  </p>
                )}
                {textError && <p className="text-sm text-red-600">{textError}</p>}
                <div>
                  {textState === "sent" ? (
                    <p className="text-sm font-medium text-accent-deep">Text sent.</p>
                  ) : (
                    <button
                      onClick={sendText}
                      disabled={textState === "sending" || !text.message.trim()}
                      className={sendButton}
                    >
                      {textState === "sending" ? "Sending..." : "Send text"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {show === "both" && !guestPhone && (
          <p className="mt-6 text-xs text-muted">
            This guest did not give a phone number, so there is no text to send.
          </p>
        )}

        <div className="mt-8 flex justify-end border-t border-card-border pt-4">
          <button
            onClick={onClose}
            className="rounded-md border border-card-border px-4 py-2 text-sm font-medium hover:border-accent"
          >
            {emailState === "sent" || textState === "sent" ? "Done" : "Close without sending"}
          </button>
        </div>
      </div>
    </div>
  );
}
