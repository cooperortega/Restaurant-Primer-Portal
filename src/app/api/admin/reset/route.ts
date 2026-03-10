import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export async function POST(req: NextRequest) {
  if (req.cookies.get("admin_auth")?.value !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  await Promise.all([
    redis.set("subscribers", []),
    redis.set("access_requests", []),
    redis.set("logs", []),
    redis.set("surveys", []),
    redis.set("tokens", []),
  ]);

  return NextResponse.json({ ok: true });
}
