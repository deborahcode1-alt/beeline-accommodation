"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PaidCheckbox({
  bookingId,
  paymentStatus,
}: {
  bookingId: string;
  paymentStatus: string;
}) {
  const router = useRouter();
  const [paid, setPaid] = useState(paymentStatus === "PAID");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function toggle(next: boolean) {
    setBusy(true);
    setError(false);
    setPaid(next);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: next ? "PAID" : "UNPAID" }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setPaid(!next);
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="inline-flex items-center gap-1.5 text-xs">
      <input
        type="checkbox"
        checked={paid}
        disabled={busy}
        onChange={(e) => toggle(e.target.checked)}
      />
      {paid ? "Paid" : "Mark paid"}
      {error && <span className="text-red-600">failed</span>}
    </label>
  );
}
