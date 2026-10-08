import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { redirect } from "next/navigation";
import { ListingForm } from "@/components/admin/ListingForm";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  const areas = await prisma.area.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div>
      <h1 className="text-2xl font-semibold">New listing</h1>
      <div className="mt-6 max-w-2xl">
        <ListingForm areas={areas} isOwner={ctx.isOwner} />
      </div>
    </div>
  );
}
