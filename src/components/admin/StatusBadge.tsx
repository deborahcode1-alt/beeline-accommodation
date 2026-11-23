const styles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  CONFIRMED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  DECLINED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  CANCELLED: "bg-foreground/10 text-muted",
};

/** `label` replaces the wording (for example "Awaiting payment") while keeping the colour of `status`. */
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? ""}`}>
      {label ?? status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
