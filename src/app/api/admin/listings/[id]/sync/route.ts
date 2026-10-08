import { NextRequest, NextResponse } from "next/server";
import { syncListingImports } from "@/lib/syncIcal";
import { requireListingAccess } from "@/lib/adminAuth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await requireListingAccess(id);
  if (access.error) return access.error;
  const results = await syncListingImports(id);
  return NextResponse.json({ results });
}
