import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token required." }, { status: 400 });
  }

  const tokenRecord = db.tokens.getByToken(token);
  if (!tokenRecord) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
  }

  const subscriber = db.subscribers.getById(tokenRecord.subscriberId);
  const newsletter = db.newsletters.getById(tokenRecord.newsletterId);

  if (!subscriber || !newsletter) {
    return NextResponse.json({ error: "Record not found." }, { status: 404 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const ua = req.headers.get("user-agent") ?? "unknown";

  db.logs.create({
    subscriberId: subscriber.id,
    subscriberName: subscriber.name,
    subscriberEmail: subscriber.email,
    newsletterId: newsletter.id,
    newsletterTitle: newsletter.title,
    tokenId: tokenRecord.id,
    ipAddress: ip,
    userAgent: ua,
  });

  return NextResponse.json({
    name: subscriber.name,
    email: subscriber.email,
    newsletterTitle: newsletter.title,
    filename: newsletter.filename,
  });
}
