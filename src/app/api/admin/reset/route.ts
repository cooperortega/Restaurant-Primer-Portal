import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export async function POST(req: NextRequest) {
  if (req.cookies.get("admin_auth")?.value !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  await redis.set("logs", []);

  return NextResponse.json({ ok: true });
}
