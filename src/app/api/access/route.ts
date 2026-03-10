import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const { email, firstName, lastName } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  let subscriber = await db.subscribers.getByEmail(email);

  if (!subscriber) {
    // New visitor — need a name before we can register them
    if (!firstName || !lastName) {
      return NextResponse.json({ needsName: true }, { status: 200 });
    }
    // Register them as a new subscriber
    subscriber = await db.subscribers.create(`${firstName.trim()} ${lastName.trim()}`, email.trim());
  }

  const newsletter = await db.newsletters.getLatest();
  if (!newsletter) {
    return NextResponse.json({ error: "No newsletter available." }, { status: 404 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const ua = req.headers.get("user-agent") ?? "unknown";

  await db.logs.create({
    subscriberId: subscriber.id,
    subscriberName: subscriber.name,
    subscriberEmail: subscriber.email,
    newsletterId: newsletter.id,
    newsletterTitle: newsletter.title,
    tokenId: null,
    ipAddress: ip,
    userAgent: ua,
  });

  const adminUsers = await db.admins.getAll();
  const isAdmin = adminUsers.some(a => a.email.toLowerCase() === subscriber.email.toLowerCase());

  const res = NextResponse.json({
    name: subscriber.name,
    email: subscriber.email,
    newsletterId: newsletter.id,
    isAdmin,
  });

  if (isAdmin) {
    res.cookies.set("admin_auth", "1", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });
    res.cookies.set("is_admin", "1", {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });
  }

  return res;
}
