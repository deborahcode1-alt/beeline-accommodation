import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { AreaManager } from "@/components/admin/AreaManager";

export const dynamic = "force-dynamic";

export default async function AreasPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  if (!ctx.isOwner) redirect("/admin");

  const areas = await prisma.area.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { listings: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Areas</h1>
      <p className="mt-1 text-sm text-muted">
        Each area gets its own page, for example Gympie Accommodation, and appears in the search
        on the home page.
      </p>
      <div className="mt-6">
        <AreaManager
          areas={areas.map((a) => ({
            id: a.id,
            slug: a.slug,
            name: a.name,
            state: a.state,
            published: a.published,
            listingCount: a._count.listings,
          }))}
        />
      </div>
    </div>
  );
}
