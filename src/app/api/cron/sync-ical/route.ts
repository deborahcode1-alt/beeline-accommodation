import { NextRequest, NextResponse } from "next/server";
import { syncAllImports } from "@/lib/syncIcal";

// Runs daily (see vercel.json) and can be pinged more often from outside. Vercel sends
// "Authorization: Bearer <CRON_SECRET>"; the ?secret= form works for an outside pinger or by hand.
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const bearer = req.headers.get("authorization");
  const secret = req.nextUrl.searchParams.get("secret");
  if (!expected || (bearer !== `Bearer ${expected}` && secret !== expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await syncAllImports();
  return NextResponse.json({ ok: true });
}
