import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, canAccessHost } from "@/lib/adminAuth";

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
  notificationEmail: optionalText(200),
  notificationPhone: optionalText(50),
  // Platform-owner only:
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
  const { subscriptionStatus, trialEndsAt, ...profile } = parsed.data;
  const data: Record<string, unknown> = { ...profile };
  // Hosts can't change their own subscription state by hand; it follows billing.
  if (auth.ctx.isOwner) {
    if (subscriptionStatus !== undefined) data.subscriptionStatus = subscriptionStatus;
    if (trialEndsAt !== undefined) data.trialEndsAt = trialEndsAt;
  }

  const host = await prisma.host.update({ where: { id }, data });
  return NextResponse.json({ host });
}
