import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { TeamManager } from "@/components/admin/TeamManager";
import { PageHeader, UsersIcon } from "@/components/admin/DashUI";

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
      <PageHeader
        icon={<UsersIcon />}
        title="Team"
        subtitle="Everyone here has full admin access to every host, listing and booking."
      />
      <div className="mt-6">
        <TeamManager members={owners.map((o) => ({ ...o, isYou: o.email === ctx.email }))} />
      </div>
    </div>
  );
}
