const styles: Record<string, string> = {
  TRIAL: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-green-100 text-green-800",
  PAST_DUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-foreground/10 text-muted",
  COMPLIMENTARY: "bg-accent text-accent-fg",
};

const labels: Record<string, string> = {
  TRIAL: "Free trial",
  ACTIVE: "Active",
  PAST_DUE: "Payment overdue",
  CANCELLED: "Cancelled",
  COMPLIMENTARY: "Owner (no charge)",
};

export function SubscriptionBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}
