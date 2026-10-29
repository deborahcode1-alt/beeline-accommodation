import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { formatDateTime } from "@/lib/format";
import { GuestContactLinks } from "@/components/admin/GuestContactLinks";
import { EnquiryActions } from "@/components/admin/EnquiryActions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { NEW: "New", APPROVED: "Approved", DECLINED: "Declined" };

export default async function EnquiriesPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  if (!ctx.isOwner) redirect("/admin");

  const enquiries = await prisma.hostEnquiry.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  // New ones first, then the rest by date.
  const sorted = [...enquiries].sort((a, b) => Number(b.status === "NEW") - Number(a.status === "NEW"));
  const newCount = enquiries.filter((e) => e.status === "NEW").length;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Host requests</h1>
      <p className="mt-1 text-sm text-muted">
        People who filled in Become a collaborator. <strong>Approve and invite</strong> creates their host account and
        emails them a link to choose a password and start their Get live checklist.
        {newCount > 0 ? ` ${newCount} waiting for you.` : " Nothing waiting."}
      </p>

      <div className="mt-6 space-y-4">
        {sorted.length === 0 && <p className="text-sm text-muted">No requests yet.</p>}
        {sorted.map((e) => {
          const photos: string[] = JSON.parse(e.photoUrls || "[]");
          return (
            <div
              key={e.id}
              className={`rounded-lg border p-4 text-sm ${e.status === "NEW" ? "border-accent bg-soft" : "border-card-border"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-base font-medium">
                  {e.name} <span className="font-normal text-muted">&middot; {e.area}</span>
                </p>
                <span className="flex items-center gap-2 text-xs text-muted">
                  {formatDateTime(e.createdAt)}
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${
                      e.status === "NEW" ? "bg-accent text-accent-fg" : "bg-foreground/10"
                    }`}
                  >
                    {STATUS_LABEL[e.status] ?? e.status}
                  </span>
                </span>
              </div>
              <p className="mt-1 text-muted">
                {e.email}
                {e.phone ? ` · ${e.phone}` : ""}
              </p>
              {e.details && <p className="mt-2 whitespace-pre-line">{e.details}</p>}
              {photos.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {photos.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative block aspect-square overflow-hidden rounded-md border border-card-border"
                    >
                      <Image src={url} alt="House photo" fill sizes="120px" className="object-cover" />
                    </a>
                  ))}
                </div>
              )}
              <div className="mt-3">
                <GuestContactLinks phone={e.phone} email={e.email} />
              </div>
              <EnquiryActions id={e.id} status={e.status} hostId={e.hostId} name={e.name} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
