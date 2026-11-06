"use client";

import { GA_ENABLED, REOPEN_EVENT } from "@/lib/analytics";

// Footer link that lets a visitor change their mind about analytics. Hidden until analytics is configured.
export function AnalyticsChoicesLink({ className }: { className?: string }) {
  if (!GA_ENABLED) return null;
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(REOPEN_EVENT))} className={className}>
      Analytics choices
    </button>
  );
}
