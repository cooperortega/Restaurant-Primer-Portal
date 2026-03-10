import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function POST(req: NextRequest) {
  if (req.cookies.get("admin_auth")?.value !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subscriberId, name, email, newsletterId } = await req.json();

  const newsletter = newsletterId
    ? await db.newsletters.getById(newsletterId)
    : await db.newsletters.getLatest();

  if (!newsletter) {
    return NextResponse.json({ error: "Newsletter not found." }, { status: 404 });
  }

  let subscriber = subscriberId ? await db.subscribers.getById(subscriberId) : null;

  if (!subscriber && email) {
    subscriber = await db.subscribers.getByEmail(email);
    if (!subscriber) {
      subscriber = await db.subscribers.create(name || email, email);
    }
  }

  if (!subscriber) {
    return NextResponse.json({ error: "Subscriber not found." }, { status: 404 });
  }

  const token = await db.tokens.create(subscriber.id, newsletter.id);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const link = `${baseUrl}/view?token=${token.token}`;

  return NextResponse.json({
    link,
    subscriberName: subscriber.name,
    subscriberEmail: subscriber.email,
    newsletterTitle: newsletter.title,
  });
}
