import { prisma } from "@/lib/prisma";
import { getLiveChecklist } from "@/lib/getLive";
import { notifyOwnerHostReady } from "@/lib/notifications";

// Keeps "this host has finished every Get live step and is waiting for approval" up to date.
// The mark lives on the host (readyForReviewAt) so the owner's header count is one cheap query. The first
// time a host becomes ready the owner is emailed once. Checked after the things that change a checklist,
// and again every 15 minutes by the calendar-sync job as a safety net.

/** Re-checks one host. Never throws: a hiccup here must not break the save that triggered it. */
export async function refreshReadyForReview(hostId: string | null | undefined) {
  if (!hostId) return;
  try {
    const host = await prisma.host.findUnique({
      where: { id: hostId },
      select: { id: true, name: true, liveApprovedAt: true, readyForReviewAt: true },
    });
    if (!host) return;

    // Already approved: nothing is waiting on the owner any more.
    if (host.liveApprovedAt) {
      if (host.readyForReviewAt) await prisma.host.update({ where: { id: host.id }, data: { readyForReviewAt: null } });
      return;
    }

    const result = await getLiveChecklist(host.id);
    if (!result) return;

    if (result.allDone && !host.readyForReviewAt) {
      // Only the first caller flips it, so the owner gets one email even if two saves land together.
      const flipped = await prisma.host.updateMany({
        where: { id: host.id, readyForReviewAt: null },
        data: { readyForReviewAt: new Date() },
      });
      if (flipped.count === 1) await notifyOwnerHostReady({ hostId: host.id, hostName: host.name });
    } else if (!result.allDone && host.readyForReviewAt) {
      // Something was undone: it is no longer ready.
      await prisma.host.update({ where: { id: host.id }, data: { readyForReviewAt: null } });
    }
  } catch (err) {
    console.error("Ready-for-review check failed:", err);
  }
}

/** Re-checks every host that is waiting to be approved, plus any marked ready that have since been approved. */
export async function refreshAllReadyForReview() {
  try {
    const hosts = await prisma.host.findMany({
      where: { OR: [{ liveApprovedAt: null }, { readyForReviewAt: { not: null } }] },
      select: { id: true },
    });
    for (const h of hosts) await refreshReadyForReview(h.id);
  } catch (err) {
    console.error("Ready-for-review sweep failed:", err);
  }
}
