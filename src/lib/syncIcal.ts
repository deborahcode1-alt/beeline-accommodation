import { prisma } from "@/lib/prisma";
import { fetchImportedBlocks } from "@/lib/ical";

export async function syncListingImports(listingId: string) {
  const imports = await prisma.icalImportUrl.findMany({ where: { listingId } });
  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const imp of imports) {
    try {
      const blocks = await fetchImportedBlocks(imp.url);
      const uniqueDates = [...new Set(blocks.map((b) => b.date.toISOString()))];

      await prisma.$transaction([
        prisma.blockedDate.deleteMany({ where: { listingId, source: imp.id } }),
        prisma.blockedDate.createMany({
          data: uniqueDates.map((iso) => ({
            listingId,
            date: new Date(iso),
            source: imp.id,
            reason: imp.label,
          })),
        }),
        prisma.icalImportUrl.update({
          where: { id: imp.id },
          data: { lastSyncedAt: new Date(), lastError: null },
        }),
      ]);

      results.push({ id: imp.id, ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await prisma.icalImportUrl.update({
        where: { id: imp.id },
        data: { lastError: message },
      });
      results.push({ id: imp.id, ok: false, error: message });
    }
  }

  return results;
}

export async function syncAllImports() {
  const listings = await prisma.listing.findMany({ select: { id: true } });
  for (const l of listings) {
    await syncListingImports(l.id);
  }
}

/**
 * Refreshes a listing's connected calendars if they haven't been checked in the last few minutes.
 * Called just before a booking is accepted, so a stay already taken on Airbnb or Booking.com is
 * caught even if the scheduled sync hasn't run yet. Never throws and never waits long.
 */
export async function syncListingIfStale(listingId: string, maxAgeMs = 10 * 60 * 1000) {
  try {
    const imports = await prisma.icalImportUrl.findMany({
      where: { listingId },
      select: { lastSyncedAt: true },
    });
    const stale = imports.some((i) => !i.lastSyncedAt || Date.now() - i.lastSyncedAt.getTime() > maxAgeMs);
    if (!stale) return;
    await Promise.race([
      syncListingImports(listingId),
      new Promise((resolve) => setTimeout(resolve, 8000)),
    ]);
  } catch (err) {
    console.error("calendar refresh before booking failed:", err);
  }
}
