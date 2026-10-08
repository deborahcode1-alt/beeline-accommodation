import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { TeamManager } from "@/components/admin/TeamManager";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  if (!ctx.isOwner) redirect("/admin");

  const owners = await prisma.adminUser.findMany({
    where: { hostId: null },
    orderBy: { email: "asc" },
    select: { id: true, email: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Team</h1>
      <p className="mt-1 text-sm text-muted">
        Everyone here has full admin access to every host, listing and booking.
      </p>
      <div className="mt-6">
        <TeamManager members={owners.map((o) => ({ ...o, isYou: o.email === ctx.email }))} />
      </div>
    </div>
  );
}
