import { NextRequest, NextResponse } from "next/server";
import { purgeExpiredCustomerData } from "@/lib/retention";

// Runs daily (see vercel.json). Vercel sends "Authorization: Bearer <CRON_SECRET>"; the
// ?secret= form is kept so it can also be triggered by hand.
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const bearer = req.headers.get("authorization");
  const secret = req.nextUrl.searchParams.get("secret");
  if (!expected || (bearer !== `Bearer ${expected}` && secret !== expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await purgeExpiredCustomerData();
  console.log("Retention purge:", result);
  return NextResponse.json({ ok: true, ...result });
}
