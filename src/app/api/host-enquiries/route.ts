import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured, sendEmail } from "@/lib/email";

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(50).optional(),
  area: z.string().min(1).max(200),
  details: z.string().max(2000).optional(),
  // Honeypot: real people leave this empty.
  website: z.string().max(0).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  }
  const { website: _honeypot, ...data } = parsed.data;
  void _honeypot;

  await prisma.hostEnquiry.create({ data });

  // Best-effort alert to the platform owner; the enquiry is saved either way.
  const to = process.env.ADMIN_EMAIL;
  if (to && isEmailConfigured()) {
    await sendEmail({
      to,
      subject: `New host enquiry: ${data.name} (${data.area})`,
      text: `${data.name} <${data.email}>${data.phone ? `, ${data.phone}` : ""}\nArea: ${data.area}\n\n${data.details ?? ""}`,
    }).catch((err) => console.error("Host enquiry email failed:", err));
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
