import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { HostProfileForm } from "@/components/admin/HostProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  if (!ctx.hostId) redirect("/admin/hosts");
  const host = await prisma.host.findUnique({ where: { id: ctx.hostId } });
  if (!host) redirect("/admin");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Your host profile</h1>
      <p className="mt-1 text-sm text-muted">
        This appears on every one of your listings so guests know who they are booking with.
      </p>
      <div className="mt-6">
        <HostProfileForm
          hostId={host.id}
          initial={{
            name: host.name,
            bio: host.bio ?? "",
            website: host.website ?? "",
            publicPhone: host.publicPhone ?? "",
            publicEmail: host.publicEmail ?? "",
            photoUrl: host.photoUrl ?? "",
            notificationEmail: host.notificationEmail ?? "",
            notificationPhone: host.notificationPhone ?? "",
          }}
        />
      </div>
    </div>
  );
}
