import Link from "next/link";
import type { NextStepInfo } from "@/lib/getLive";

// Shown after a host saves something, so they always know where to go next on the way to going live.
export function NextStepLink({ next }: { next: NextStepInfo }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href={next ? next.href : "/admin/get-live"}
        className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover"
      >
        {next ? `Next: ${next.label} →` : "All done here. Back to your checklist →"}
      </Link>
    </div>
  );
}
