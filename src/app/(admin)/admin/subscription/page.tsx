import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { formatDate } from "@/lib/format";
import { isBillingConfigured } from "@/lib/billing";
import { SubscriptionBadge } from "@/components/admin/SubscriptionBadge";
import { SubscriptionActions } from "@/components/admin/SubscriptionActions";

export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  if (!ctx.hostId) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Subscription</h1>
        <p className="mt-3 text-sm text-muted">
          You&apos;re the platform owner. Manage each host&apos;s subscription from the{" "}
          <Link href="/admin/hosts" className="text-accent-deep underline">
            Hosts
          </Link>{" "}
          page.
        </p>
      </div>
    );
  }
  const host = await prisma.host.findUnique({ where: { id: ctx.hostId } });
  if (!host) redirect("/admin");

  const hasSubscription = !!host.stripeSubscriptionId;
  const note: Record<string, string> = {
    COMPLIMENTARY: "These listings belong to the platform owner, so there is no subscription charge.",
    TRIAL: host.trialEndsAt
      ? `Your free trial ends ${formatDate(host.trialEndsAt)}. Subscribe before then to keep your listings visible.`
      : "You are on a free trial. Subscribe to keep your listings visible.",
    ACTIVE: host.subscriptionRenewsAt
      ? `Your subscription renews ${formatDate(host.subscriptionRenewsAt)}.`
      : "Your subscription is active.",
    PAST_DUE:
      "Your last payment did not go through. Update your payment method soon, or your listings will be removed from the site.",
    CANCELLED:
      "Your subscription has ended, so your listings are hidden from guests. Subscribe again to bring them straight back.",
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Subscription</h1>
      <div className="mt-6 rounded-lg border border-card-border p-5">
        <p className="text-sm text-muted">Status</p>
        <p className="mt-1">
          <SubscriptionBadge status={host.subscriptionStatus} />
        </p>
        <p className="mt-3 text-sm">{note[host.subscriptionStatus]}</p>
        <p className="mt-2 text-sm text-muted">
          Beeline takes no commission on your bookings. The subscription is the only charge.
        </p>
      </div>

      {host.subscriptionStatus !== "COMPLIMENTARY" && (
        <div className="mt-6">
          <SubscriptionActions hasSubscription={hasSubscription} />
          {!isBillingConfigured() && (
            <p className="mt-3 text-xs text-muted">
              Online billing is being set up and is not switched on yet, so these buttons will
              explain that for now.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
