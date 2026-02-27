import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const subscriber = db.subscribers.getByEmail(email);
  if (!subscriber) {
    return NextResponse.json(
      { error: "We couldn't find that email in our subscriber list. Please contact us to be added." },
      { status: 404 }
    );
  }

  const newsletter = db.newsletters.getLatest();
  if (!newsletter) {
    return NextResponse.json({ error: "No newsletter available." }, { status: 404 });
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
    tokenId: null,
    ipAddress: ip,
    userAgent: ua,
  });

  return NextResponse.json({
    name: subscriber.name,
    email: subscriber.email,
    newsletterId: newsletter.id,
  });
}
