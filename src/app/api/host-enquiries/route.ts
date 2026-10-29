import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notifyEnquiryReceived, notifyOwnerOfEnquiry } from "@/lib/notifications";
import { ENQUIRY_MAX_PHOTOS, isEnquiryPhotoUrl } from "@/lib/enquiryPhotos";

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(50).optional(),
  area: z.string().min(1).max(200),
  details: z.string().max(2000).optional(),
  // Links to photos already uploaded to our own storage; anything else is rejected.
  photoUrls: z
    .array(z.string().url().max(1000).refine(isEnquiryPhotoUrl, "Invalid photo"))
    .max(ENQUIRY_MAX_PHOTOS)
    .default([]),
  // Honeypot: real people leave this empty.
  website: z.string().max(0).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  }
  const { website: _honeypot, photoUrls, ...data } = parsed.data;
  void _honeypot;

  await prisma.hostEnquiry.create({ data: { ...data, photoUrls: JSON.stringify(photoUrls) } });

  // Best-effort emails; the request is saved either way. The owner gets a link straight to approving it,
  // and the applicant gets an acknowledgement that says what happens next.
  await Promise.all([
    notifyOwnerOfEnquiry({ ...data, photoCount: photoUrls.length }),
    notifyEnquiryReceived({ name: data.name, email: data.email }),
  ]).catch((err) => console.error("Host enquiry emails failed:", err));

  return NextResponse.json({ ok: true }, { status: 201 });
}
