import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { formatDate } from "@/lib/format";
import { isBillingConfigured, trialTerms } from "@/lib/billing";
import { STARTING_UP_MONTHS, TRIAL_DAYS, formatAud, tierByKey, tierForListingCount } from "@/lib/pricing";
import { startingUpOffered } from "@/lib/settings";
import { canChooseStartingUp, isOnStartingUp } from "@/lib/startingUp";
import { SubscriptionBadge } from "@/components/admin/SubscriptionBadge";
import { SubscriptionActions } from "@/components/admin/SubscriptionActions";
import { StartingUpChoice } from "@/components/admin/StartingUpChoice";
import { CardIcon, PageHeader } from "@/components/admin/DashUI";

export const dynamic = "force-dynamic";

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  const { checkout } = await searchParams;
  if (!ctx.hostId) {
    return (
      <div>
        <PageHeader icon={<CardIcon />} title="Subscription" />
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
  const listingCount = await prisma.listing.count({ where: { hostId: host.id } });
  const suggestedTier = tierForListingCount(listingCount);
  const currentTier = tierByKey(host.planTier);
  const trial = trialTerms(host);
  const offered = await startingUpOffered();
  const onStartingUp = isOnStartingUp(host);
  const canPickStartingUp = canChooseStartingUp(host, offered);
  const note: Record<string, string> = {
    COMPLIMENTARY: "These listings belong to the platform owner, so there is no subscription charge.",
    TRIAL: onStartingUp
      ? `You are on Starting up${host.startingUpEndsAt ? `, free until ${formatDate(host.startingUpEndsAt)}` : ""}. Your listings stay on the site. Subscribe whenever you are ready.`
      : host.trialEndsAt
        ? `Your free trial ends ${formatDate(host.trialEndsAt)}. Subscribe before then to keep your listings visible.`
        : "You have not started a subscription yet. Choose a plan below to keep your listings visible.",
    ACTIVE: host.subscriptionRenewsAt
      ? `Your subscription renews ${formatDate(host.subscriptionRenewsAt)}.`
      : "Your subscription is active.",
    PAST_DUE:
      "Your last payment did not go through. Update your payment method soon, or your listings will be removed from the site.",
    CANCELLED:
      "Your subscription has ended, so your listings are hidden from guests. Subscribe again to bring them straight back.",
  };
  // A trial that is already set up through Stripe is still a trial, but there is nothing to subscribe to.
  const trialWithSubscription = host.subscriptionStatus === "TRIAL" && hasSubscription;

  return (
    <div className="max-w-xl">
      <PageHeader icon={<CardIcon />} title="Subscription" />

      {checkout === "success" && (
        <p className="mt-4 rounded-2xl border border-accent bg-soft p-4 text-sm">
          Thanks, your subscription is being set up. The status below updates within a minute. If
          it still shows the old status, refresh the page.
        </p>
      )}
      {checkout === "cancelled" && (
        <p className="mt-4 rounded-2xl border border-card-border p-4 text-sm text-muted">
          Checkout was cancelled and you have not been charged.
        </p>
      )}

      <div className="mt-6 rounded-2xl border border-card-border p-5">
        <p className="text-sm text-muted">Status</p>
        <p className="mt-1">
          <SubscriptionBadge status={host.subscriptionStatus} startingUp={onStartingUp} />
        </p>
        <p className="mt-3 text-sm">
          {trialWithSubscription && host.trialEndsAt
            ? `Your subscription is set up. Your free trial ends ${formatDate(host.trialEndsAt)} and your first payment is taken then.`
            : note[host.subscriptionStatus]}
        </p>
        <p className="mt-2 text-sm text-muted">
          Beeline takes no commission on your bookings. The subscription is the only charge.
        </p>
      </div>

      {host.subscriptionStatus !== "COMPLIMENTARY" && (
        <div className="mt-6 rounded-2xl border border-card-border p-5 text-sm">
          <p className="font-semibold">Your plan</p>
          {hasSubscription && currentTier ? (
            <>
              <p className="mt-1">
                {currentTier.label}: {formatAud(currentTier.monthly)} a month or{" "}
                {formatAud(currentTier.yearly)} a year. You have {listingCount} listing
                {listingCount === 1 ? "" : "s"}.
              </p>
              {listingCount > currentTier.maxListings && (
                <p className="mt-2 text-red-600">
                  You have more listings than this plan covers. Change plan with Manage billing.
                </p>
              )}
            </>
          ) : suggestedTier ? (
            <>
              <p className="mt-1">
                You have {listingCount} listing{listingCount === 1 ? "" : "s"}, so the {suggestedTier.label} plan
                applies: {formatAud(suggestedTier.monthly)} a month, or {formatAud(suggestedTier.yearly)} a year (one
                month free).
              </p>
              {!hasSubscription && trial.kind === "freeMonth" && (
                <p className="mt-2">
                  <strong>Your first {TRIAL_DAYS} days are free.</strong> You enter your card on Stripe now, but nothing
                  is charged for {TRIAL_DAYS} days. After that the first payment is taken, unless you cancel before
                  then, in which case you pay nothing. You can cancel any time with Manage billing.
                </p>
              )}
            </>
          ) : (
            <p className="mt-1">
              You have more than 10 listings, which needs a custom plan. Please contact us.
            </p>
          )}
        </div>
      )}

      {host.subscriptionStatus !== "COMPLIMENTARY" && !hasSubscription && (canPickStartingUp || onStartingUp) && (
        <div className="mt-6">
          <StartingUpChoice
            months={STARTING_UP_MONTHS}
            onIt={onStartingUp}
            endsLabel={host.startingUpEndsAt ? formatDate(host.startingUpEndsAt) : undefined}
          />
        </div>
      )}

      {host.subscriptionStatus !== "COMPLIMENTARY" && (
        <div className="mt-6">
          <SubscriptionActions
            hasSubscription={hasSubscription}
            monthlyLabel={suggestedTier ? `${formatAud(suggestedTier.monthly)} a month` : undefined}
            yearlyLabel={suggestedTier ? `${formatAud(suggestedTier.yearly)} a year` : undefined}
            canSubscribe={!!suggestedTier}
            trialDays={trial.kind === "freeMonth" ? trial.days : undefined}
          />
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
