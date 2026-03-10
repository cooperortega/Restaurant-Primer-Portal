import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/storage";

const resend = new Resend(process.env.RESEND_API_KEY);

function buildEmailHtml(name: string, link: string, subject: string, body: string): string {
  const firstName = name.split(" ")[0];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f8f5f1;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5f1;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e0d6ca;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:36px 48px 28px;border-bottom:1px solid #e0d6ca;text-align:center;">
              <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:22px;color:#1a1209;letter-spacing:0.03em;">Restaurant Primer</p>
              <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#8b6634;">Industry Intelligence</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 48px;">
              <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:22px;color:#1a1209;line-height:1.3;">Hi ${firstName},</p>
              <div style="font-family:Arial,sans-serif;font-size:15px;color:#4a3728;line-height:1.8;white-space:pre-line;">${body.replace(/\n/g, "<br/>")}</div>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:36px 0;">
                <tr>
                  <td style="background:#1a1209;">
                    <a href="${link}" style="display:inline-block;padding:16px 40px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
                      Access Restaurant Primer →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#9c8878;line-height:1.7;">
                Or copy this link into your browser:<br/>
                <a href="${link}" style="color:#8b6634;word-break:break-all;">${link}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 48px;border-top:1px solid #e0d6ca;text-align:center;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#9c8878;">
                © 2026 Restaurant Primer — All Rights Reserved
              </p>
              <p style="margin:6px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#b8a88a;">
                This link is unique to you. Please do not share it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  if (req.cookies.get("admin_auth")?.value !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subscriberIds, subject, body } = await req.json();

  if (!subscriberIds?.length)
    return NextResponse.json({ error: "No subscribers specified." }, { status: 400 });
  if (!subject?.trim())
    return NextResponse.json({ error: "Subject is required." }, { status: 400 });
  if (!body?.trim())
    return NextResponse.json({ error: "Email body is required." }, { status: 400 });

  const newsletter = await db.newsletters.getLatest();
  if (!newsletter)
    return NextResponse.json({ error: "No newsletter found." }, { status: 404 });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "Restaurant Primer <admin@restaurantprimer.com>";

  const results: { email: string; success: boolean; error?: string }[] = [];

  for (const id of subscriberIds) {
    const subscriber = await db.subscribers.getById(id);
    if (!subscriber) {
      results.push({ email: id, success: false, error: "Subscriber not found" });
      continue;
    }

    const token = await db.tokens.create(subscriber.id, newsletter.id);
    const link = `${baseUrl}/view?token=${token.token}`;
    const html = buildEmailHtml(subscriber.name, link, subject, body);

    try {
      await resend.emails.send({
        from: fromAddress,
        to: subscriber.email,
        subject,
        html,
      });
      results.push({ email: subscriber.email, success: true });
    } catch (err) {
      results.push({ email: subscriber.email, success: false, error: String(err) });
    }
  }

  const sent = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return NextResponse.json({ sent, failed, results });
}
