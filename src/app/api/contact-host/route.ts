import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { publicListingWhere } from "@/lib/visibility";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { SITE_NAME } from "@/lib/site";

const schema = z.object({
  listingId: z.string().min(1),
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(50).optional(),
  message: z.string().min(1).max(2000),
  // Honeypot: real people leave this empty.
  website: z.string().max(0).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  }
  const { listingId, name, email, phone, message } = parsed.data;

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, ...publicListingWhere() },
    include: { host: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Saved first so the host sees it in their dashboard even if email fails.
  await prisma.hostMessage.create({
    data: {
      hostId: listing.hostId,
      listingId: listing.id,
      listingName: listing.name,
      name,
      email,
      phone,
      message,
    },
  });

  const to = listing.host?.notificationEmail || process.env.ADMIN_EMAIL;
  if (to && isEmailConfigured()) {
    await sendEmail({
      to,
      subject: `Question about ${listing.name}`,
      text: `${name} <${email}>${phone ? `, ${phone}` : ""} asked about ${listing.name}:\n\n${message}\n\nReply to them directly, or see it in your ${SITE_NAME} dashboard.`,
    }).catch((err) => console.error("Host message email failed:", err));
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
