import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { isConnectEnabled, refreshConnectStatus } from "@/lib/connect";
import { ConnectStripeButton } from "@/components/admin/ConnectStripeButton";
import { CardIcon, PageHeader, SectionCard } from "@/components/admin/DashUI";

export const dynamic = "force-dynamic";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ connect?: string }> }) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  if (!ctx.hostId) {
    return (
      <div>
        <PageHeader icon={<CardIcon />} title="Payments" />
        <p className="mt-4 text-sm text-muted">
          Each host links their own Stripe account from here. You can see who is connected on the{" "}
          <Link href="/admin/hosts" className="text-accent-deep underline">
            Hosts
          </Link>{" "}
          page.
        </p>
      </div>
    );
  }

  const { connect } = await searchParams;
  // Back from Stripe: ask it what happened, so the page is right straight away.
  if (connect === "return" || connect === "refresh") await refreshConnectStatus(ctx.hostId);

  const host = await prisma.host.findUnique({ where: { id: ctx.hostId } });
  if (!host) redirect("/admin");

  const enabled = isConnectEnabled();
  const linked = !!host.stripeAccountId;
  const ready = linked && host.stripeChargesEnabled;
  const waiting = linked && !ready;

  return (
    <div className="max-w-2xl">
      <PageHeader
        icon={<CardIcon />}
        title="Payments"
        subtitle="Take card payments straight into your own Stripe account."
      />

      <SectionCard icon={<CardIcon />} title="Card payments">
        {!enabled ? (
          <p className="text-sm text-muted">
            Card payments to your own account aren&apos;t switched on yet. We&apos;ll let you know when you can link
            your Stripe account here.
          </p>
        ) : ready ? (
          <div className="text-sm">
            <p>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                Connected
              </span>{" "}
              Guests who pay by card pay straight into your Stripe account, and Stripe sends it on to your bank.
            </p>
            <p className="mt-3">
              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-deep underline"
              >
                Open my Stripe dashboard
              </a>{" "}
              to see payments, send refunds and update your bank details.
            </p>
          </div>
        ) : (
          <div className="text-sm">
            <p>
              {waiting ? (
                <>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    Almost there
                  </span>{" "}
                  Stripe still needs a few details from you before you can take card payments.
                </>
              ) : (
                "Link your own Stripe account so guests can pay you by card. You sign up with your own email and bank details on Stripe's pages."
              )}
            </p>
            <div className="mt-4">
              <ConnectStripeButton label={waiting ? "Finish setting up Stripe" : "Connect Stripe"} />
            </div>
          </div>
        )}
      </SectionCard>

      <div className="mt-6 rounded-2xl border border-card-border bg-soft/50 p-4 text-sm text-muted">
        <p className="font-medium text-foreground">How it works</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>The payment goes directly to your Stripe account. Book On Beeline never holds the money and takes no commission.</li>
          <li>Guests pay a separate service fee on top of the price, which covers card processing costs.</li>
          <li>
            Your cancellation policy applies to card payments too. Guests contact you if something changes, and you
            arrange any refund.
          </li>
          <li>
            Instant booking needs a connected Stripe account. See the{" "}
            <Link href="/host-agreement" className="text-accent-deep underline">
              host agreement
            </Link>
            .
          </li>
        </ul>
      </div>
    </div>
  );
}
