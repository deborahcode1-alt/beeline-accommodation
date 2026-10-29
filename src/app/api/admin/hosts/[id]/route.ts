import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, canAccessHost } from "@/lib/adminAuth";
import { PROFILE_SUBJECTS, BLURB_MAX } from "@/lib/hostProfile";

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
  const { subscriptionStatus, trialEndsAt, acceptsCardPayments, ...profile } = parsed.data;
  const data: Record<string, unknown> = { ...profile };
  // Hosts can't change their own subscription state by hand; it follows billing.
  if (auth.ctx.isOwner) {
    if (subscriptionStatus !== undefined) data.subscriptionStatus = subscriptionStatus;
    if (trialEndsAt !== undefined) data.trialEndsAt = trialEndsAt;
    // Card payments land in the platform Stripe account, so only the owner switches them on for a host.
    if (acceptsCardPayments !== undefined) data.acceptsCardPayments = acceptsCardPayments;
  }

  const host = await prisma.host.update({ where: { id }, data });
  return NextResponse.json({ host });
}
