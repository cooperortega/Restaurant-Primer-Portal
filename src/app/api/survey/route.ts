import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import { sendSurveyEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { subscriberEmail, rating, mostValuable, wouldRecommend, futureTopics, comments } = body;

  if (!rating || !mostValuable || !wouldRecommend) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const newsletter = db.newsletters.getLatest();
  if (!newsletter) {
    return NextResponse.json({ error: "No newsletter found." }, { status: 404 });
  }

  // Try to find a matching subscriber — fall back to anonymous
  const subscriber = subscriberEmail ? db.subscribers.getByEmail(subscriberEmail) : null;

  const survey = db.surveys.create({
    subscriberId: subscriber?.id ?? "anonymous",
    subscriberName: subscriber?.name ?? "Anonymous",
    subscriberEmail: subscriber?.email ?? (subscriberEmail ?? "anonymous"),
    newsletterId: newsletter.id,
    newsletterTitle: newsletter.title,
    rating: Number(rating),
    mostValuable,
    wouldRecommend,
    futureTopics: futureTopics ?? "",
    comments: comments ?? "",
  });

  // Fire-and-forget — don't let email failure block the response
  if (subscriber) sendSurveyEmail(survey).catch(() => {});

  return NextResponse.json({ ok: true });
}
