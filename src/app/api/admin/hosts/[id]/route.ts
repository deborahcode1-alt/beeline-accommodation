import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, canAccessHost } from "@/lib/adminAuth";
import { PROFILE_SUBJECTS, BLURB_MAX } from "@/lib/hostProfile";
import { notifyHostLive } from "@/lib/notifications";
import { stripeClient } from "@/lib/stripeClient";
import { del } from "@vercel/blob";

const subjectField = (key: string) => {
  const values = PROFILE_SUBJECTS.find((s) => s.key === key)!.options.map((o) => o.value);
  return z
    .string()
    .transform((v) => v.trim())
    .refine((v) => v === "" || values.includes(v), "Pick one of the options")
    .transform((v) => v || null)
    .nullable()
    .optional();
};

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .transform((v) => v.trim() || null)
    .nullable()
    .optional();

const profileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  bio: optionalText(2000),
  website: z
    .string()
    .max(300)
    .transform((v) => v.trim())
    .refine((v) => v === "" || /^https?:\/\//i.test(v), "Website must start with http:// or https://")
    .transform((v) => v || null)
    .nullable()
    .optional(),
  publicPhone: optionalText(50),
  publicEmail: z
    .string()
    .max(200)
    .transform((v) => v.trim())
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email")
    .transform((v) => v || null)
    .nullable()
    .optional(),
  photoUrl: optionalText(1000),
  blurb: optionalText(BLURB_MAX),
  languages: optionalText(120),
  hostType: subjectField("hostType"),
  yearsHosting: subjectField("yearsHosting"),
  livesOnSite: subjectField("livesOnSite"),
  checkInStyle: subjectField("checkInStyle"),
  responseTime: subjectField("responseTime"),
  notificationEmail: optionalText(200),
  notificationPhone: optionalText(50),
  bankAccountName: optionalText(120),
  bankBsb: z
    .string()
    .transform((v) => v.replace(/[s-]/g, ""))
    .refine((v) => v === "" || /^d{6}$/.test(v), "BSB must be 6 digits, like 817-001")
    .transform((v) => v || null)
    .nullable()
    .optional(),
  bankAccountNumber: z
    .string()
    .transform((v) => v.replace(/[s-]/g, ""))
    .refine((v) => v === "" || /^d{5,10}$/.test(v), "Account number must be 5 to 10 digits")
    .transform((v) => v || null)
    .nullable()
    .optional(),
  // Platform-owner only:
  acceptsCardPayments: z.boolean().optional(),
  // Approve the host to go live (or take them offline again).
  liveApproved: z.boolean().optional(),
  subscriptionStatus: z.enum(["TRIAL", "ACTIVE", "PAST_DUE", "CANCELLED", "COMPLIMENTARY"]).optional(),
  trialEndsAt: z.coerce.date().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!canAccessHost(auth.ctx, id)) {
    return NextResponse.json({ error: "Host not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { subscriptionStatus, trialEndsAt, acceptsCardPayments, liveApproved, ...profile } = parsed.data;
  const data: Record<string, unknown> = { ...profile };
  // Hosts can't change their own subscription state by hand; it follows billing.
  if (auth.ctx.isOwner) {
    if (subscriptionStatus !== undefined) data.subscriptionStatus = subscriptionStatus;
    if (trialEndsAt !== undefined) data.trialEndsAt = trialEndsAt;
    // Card payments land in the platform Stripe account, so only the owner switches them on for a host.
    if (acceptsCardPayments !== undefined) data.acceptsCardPayments = acceptsCardPayments;
    if (liveApproved !== undefined) data.liveApprovedAt = liveApproved ? new Date() : null;
  }

  const before = liveApproved ? await prisma.host.findUnique({ where: { id }, select: { liveApprovedAt: true } }) : null;
  const host = await prisma.host.update({ where: { id }, data });
  // Tell the host the moment they go live (not when an already-live host is saved again).
  if (auth.ctx.isOwner && liveApproved && !before?.liveApprovedAt) await notifyHostLive(id);
  return NextResponse.json({ host });
}

// Owner only. Removes a host completely: their logins, listings, bookings, photos and messages.
// Refuses while the host still has upcoming bookings, and cancels any Stripe subscription first.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!auth.ctx.isOwner) return NextResponse.json({ error: "Only the platform owner can delete a host" }, { status: 403 });
  const { id } = await params;

  const host = await prisma.host.findUnique({
    where: { id },
    include: { listings: { select: { photos: { select: { url: true } } } } },
  });
  if (!host) return NextResponse.json({ error: "Host not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (typeof body?.confirmName !== "string" || body.confirmName.trim().toLowerCase() !== host.name.trim().toLowerCase()) {
    return NextResponse.json({ error: "Type the host's name exactly to confirm." }, { status: 400 });
  }

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const upcoming = await prisma.booking.count({
    where: { listing: { hostId: id }, status: { in: ["PENDING", "CONFIRMED"] }, checkOut: { gte: today } },
  });
  if (upcoming > 0) {
    return NextResponse.json(
      { error: `${host.name} has ${upcoming} upcoming booking${upcoming === 1 ? "" : "s"}. Cancel or decline ${upcoming === 1 ? "it" : "them"} first so guests aren't left stranded.` },
      { status: 400 }
    );
  }

  // Stop their billing before the record goes.
  if (host.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
    try {
      await stripeClient().subscriptions.cancel(host.stripeSubscriptionId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (!/No such subscription/i.test(message)) {
        return NextResponse.json({ error: "Couldn't cancel their Stripe subscription, so nothing was deleted. Try again, or cancel it in Stripe first." }, { status: 502 });
      }
    }
  }

  const photoUrls = [...host.listings.flatMap((l) => l.photos.map((p) => p.url)), host.photoUrl ?? ""].filter((u) =>
    u.includes("blob.vercel-storage.com")
  );
  await prisma.$transaction([
    prisma.hostMessage.deleteMany({ where: { hostId: id } }),
    prisma.adminUser.deleteMany({ where: { hostId: id } }),
    prisma.hostEnquiry.updateMany({ where: { hostId: id }, data: { hostId: null } }),
    prisma.listing.deleteMany({ where: { hostId: id } }),
    prisma.host.delete({ where: { id } }),
  ]);
  if (photoUrls.length) await del(photoUrls).catch((err) => console.error("Could not delete host photos:", err));
  return NextResponse.json({ ok: true });
}
