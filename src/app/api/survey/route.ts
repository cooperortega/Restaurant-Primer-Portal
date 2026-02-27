import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";
import { sendSurveyEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { subscriberEmail, rating, mostValuable, wouldRecommend, futureTopics, comments } = body;

  if (!subscriberEmail || !rating || !mostValuable || !wouldRecommend) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const subscriber = db.subscribers.getByEmail(subscriberEmail);
  if (!subscriber) {
    return NextResponse.json({ error: "Subscriber not found." }, { status: 404 });
  }

  const newsletter = db.newsletters.getLatest();
  if (!newsletter) {
    return NextResponse.json({ error: "No newsletter found." }, { status: 404 });
  }

  const survey = db.surveys.create({
    subscriberId: subscriber.id,
    subscriberName: subscriber.name,
    subscriberEmail: subscriber.email,
    newsletterId: newsletter.id,
    newsletterTitle: newsletter.title,
    rating: Number(rating),
    mostValuable,
    wouldRecommend,
    futureTopics: futureTopics ?? "",
    comments: comments ?? "",
  });

  // Fire-and-forget — don't let email failure block the response
  sendSurveyEmail(survey).catch(() => {});

  return NextResponse.json({ ok: true });
}
