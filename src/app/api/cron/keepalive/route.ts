import { NextRequest, NextResponse } from "next/server";
import { pingDatabase } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const pingedAt = await pingDatabase();
    return NextResponse.json({ ok: true, pingedAt });
  } catch (err) {
    console.error("Keepalive ping failed:", err);
    return NextResponse.json({ error: "Database ping failed." }, { status: 500 });
  }
}
