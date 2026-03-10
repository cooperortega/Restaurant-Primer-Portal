import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/storage";
import fs from "fs";
import path from "path";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email, firstName, lastName } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  let subscriber = await db.subscribers.getByEmail(email);
  const isNewSubscriber = !subscriber;

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

  // Send welcome email with PDF attachment to new subscribers only
  if (isNewSubscriber) {
    try {
      const pdfPath = path.join(process.cwd(), "public", "newsletter.pdf");
      const pdfBuffer = fs.readFileSync(pdfPath);
      const fromAddress = process.env.RESEND_FROM_EMAIL ?? "Restaurant Primer <admin@restaurantprimer.com>";
      const firstName = subscriber.name.split(" ")[0];

      const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Welcome to the Restaurant Primer</title></head>
<body style="margin:0;padding:0;background:#f8f5f1;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5f1;padding:48px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e0d6ca;max-width:560px;width:100%;">
        <tr>
          <td style="padding:36px 48px 28px;border-bottom:1px solid #e0d6ca;text-align:center;">
            <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:22px;color:#1a1209;letter-spacing:0.03em;">Restaurant Primer</p>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#8b6634;">Updated 2026</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 48px;">
            <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:20px;color:#1a1209;">Welcome, ${firstName}.</p>
            <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:15px;color:#4a3728;line-height:1.7;">
              Thank you for joining the Restaurant Primer. We've attached a copy of the latest issue for you to read at your convenience.
            </p>
            <p style="margin:0 0 32px;font-family:Arial,sans-serif;font-size:15px;color:#4a3728;line-height:1.7;">
              You can also access it anytime by visiting the portal and signing in with your email address.
            </p>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#9c8878;line-height:1.6;">
              Restaurant Primer — Vol. 1, Issue 1
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 48px;border-top:1px solid #e0d6ca;text-align:center;">
            <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#9c8878;">© 2026 Restaurant Primer</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      await resend.emails.send({
        from: fromAddress,
        to: subscriber.email,
        subject: "Welcome to the Restaurant Primer",
        html,
        attachments: [
          {
            filename: "2026 Restaurant Primer.pdf",
            content: pdfBuffer,
          },
        ],
      });
    } catch {
      // Fire-and-forget — don't block access if email fails
    }
  }

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
