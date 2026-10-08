import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const hosts = await prisma.host.findMany({
    where: auth.ctx.isOwner ? {} : { id: auth.ctx.hostId ?? "none" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, squareAccessToken: true, squareLocationId: true },
  });
  // Never send the raw Square token to the client — only whether one's configured.
  const safeHosts = hosts.map(({ squareAccessToken, squareLocationId, ...h }) => ({
    ...h,
    squareConnected: !!squareAccessToken && !!squareLocationId,
  }));
  return NextResponse.json({ hosts: safeHosts });
}

const createSchema = z.object({ name: z.string().min(1).max(200) });

// Only the platform owner can add hosts.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!auth.ctx.isOwner) {
    return NextResponse.json({ error: "Only the platform owner can add hosts" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const host = await prisma.host.create({ data: { name: parsed.data.name } });
  return NextResponse.json({ host }, { status: 201 });
}
