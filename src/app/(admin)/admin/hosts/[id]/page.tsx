import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { HostProfileForm } from "@/components/admin/HostProfileForm";
import { OwnerHostControls } from "@/components/admin/OwnerHostControls";

export const dynamic = "force-dynamic";

export default async function HostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  if (!ctx.isOwner) redirect("/admin");
  const { id } = await params;

  const host = await prisma.host.findUnique({
    where: { id },
    include: {
      adminUsers: { select: { email: true } },
      listings: { select: { id: true, name: true } },
    },
  });
  if (!host) notFound();

  return (
    <div>
      <Link href="/admin/hosts" className="text-sm text-muted hover:underline">
        &larr; All hosts
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{host.name}</h1>
      <p className="mt-1 text-sm text-muted">
        Listings:{" "}
        {host.listings.length === 0
          ? "none yet"
          : host.listings.map((l, i) => (
              <span key={l.id}>
                {i > 0 && ", "}
                <Link href={`/admin/listings/${l.id}`} className="text-accent-deep hover:underline">
                  {l.name}
                </Link>
              </span>
            ))}
      </p>

      <div className="mt-8">
        <OwnerHostControls
          hostId={host.id}
          status={host.subscriptionStatus}
          trialEndsAt={host.trialEndsAt ? host.trialEndsAt.toISOString().slice(0, 10) : ""}
          logins={host.adminUsers.map((u) => u.email)}
        />
      </div>

      <h2 className="mt-12 text-lg font-semibold">Profile</h2>
      <div className="mt-3">
        <HostProfileForm
          hostId={host.id}
          initial={{
            name: host.name,
            bio: host.bio ?? "",
            website: host.website ?? "",
            publicPhone: host.publicPhone ?? "",
            publicEmail: host.publicEmail ?? "",
            photoUrl: host.photoUrl ?? "",
            blurb: host.blurb ?? "",
            languages: host.languages ?? "",
            hostType: host.hostType ?? "",
            yearsHosting: host.yearsHosting ?? "",
            livesOnSite: host.livesOnSite ?? "",
            checkInStyle: host.checkInStyle ?? "",
            responseTime: host.responseTime ?? "",
            notificationEmail: host.notificationEmail ?? "",
            notificationPhone: host.notificationPhone ?? "",
          }}
        />
      </div>
    </div>
  );
}
