import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/adminAuth";
import { getLiveChecklist } from "@/lib/getLive";
import { GetLiveChecklist } from "@/components/admin/GetLiveChecklist";
import { CalendarLinksLookup } from "@/components/admin/CalendarLinksLookup";

export const dynamic = "force-dynamic";

export default async function GetLivePage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  if (!ctx.hostId) redirect("/admin/hosts");

  const result = await getLiveChecklist(ctx.hostId);
  if (!result) redirect("/admin");
  const { items, doneCount, allDone, approved, listings } = result;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Get live</h1>
      <p className="mt-1 text-sm text-muted">
        Work through these steps and your listings appear on Beeline. Each one ticks itself off as you finish it.
      </p>

      <div
        className={`mt-5 rounded-lg border p-4 text-sm ${
          approved ? "border-accent bg-soft" : "border-card-border"
        }`}
      >
        {approved ? (
          <p>
            <strong>You&apos;re live.</strong> Your listings are showing to guests. You can keep this list handy as
            you add new listings.
          </p>
        ) : allDone ? (
          <p>
            <strong>All {items.length} steps done.</strong> We&apos;ll check everything and switch your listings on,
            usually within a day. You&apos;ll get an email when you&apos;re live.
          </p>
        ) : (
          <p>
            <strong>
              {doneCount} of {items.length} steps done.
            </strong>{" "}
            Your listings aren&apos;t on the site yet. They go live after every step is finished and we&apos;ve
            approved it.
          </p>
        )}
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-foreground/10">
          <div className="h-full bg-accent" style={{ width: `${Math.round((doneCount / items.length) * 100)}%` }} />
        </div>
      </div>

      <div className="mt-6">
        <GetLiveChecklist items={items} canConfirm />
      </div>

      <h2 id="calendar-links" className="mt-12 text-lg font-semibold">
        Your Beeline calendar links
      </h2>
      <div className="mt-3">
        <CalendarLinksLookup listings={listings} />
      </div>
    </div>
  );
}
