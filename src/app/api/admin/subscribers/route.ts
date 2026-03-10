import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/storage";

const resend = new Resend(process.env.RESEND_API_KEY);

function buildInviteHtml(firstName: string, link: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Your Restaurant Primer Access</title></head>
<body style="margin:0;padding:0;background:#f8f5f1;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5f1;padding:48px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e0d6ca;max-width:560px;width:100%;">
        <tr>
          <td style="padding:36px 48px 28px;border-bottom:1px solid #e0d6ca;text-align:center;">
            <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:22px;color:#1a1209;letter-spacing:0.03em;">Restaurant Primer</p>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#8b6634;">Industry Intelligence</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 48px;">
            <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:22px;color:#1a1209;line-height:1.3;">Hi ${firstName},</p>
            <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;color:#4a3728;line-height:1.8;">You've been granted access to the Restaurant Primer. Click the button below to view the latest issue.</p>
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
        <tr>
          <td style="padding:24px 48px;border-top:1px solid #e0d6ca;text-align:center;">
            <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#9c8878;">© 2026 Restaurant Primer — All Rights Reserved</p>
            <p style="margin:6px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#b8a88a;">This link is unique to you. Please do not share it.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  if (req.cookies.get("admin_auth")?.value !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscribers = await db.subscribers.getAll();
  const logs = await db.logs.getAll();

  const enriched = subscribers.map((s) => {
    const subLogs = logs.filter((l) => l.subscriberId === s.id);
    return {
      ...s,
      totalOpens: subLogs.length,
      lastOpened: subLogs.length > 0 ? subLogs[0].accessedAt : null,
    };
  });

  return NextResponse.json({ subscribers: enriched });
}

export async function POST(req: NextRequest) {
  if (req.cookies.get("admin_auth")?.value !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email } = await req.json();
  if (!name || !email) {
    return NextResponse.json({ error: "Name and email required." }, { status: 400 });
  }

  const existing = await db.subscribers.getByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "A subscriber with that email already exists." }, { status: 409 });
  }

  const sub = await db.subscribers.create(name, email);
  return NextResponse.json({ subscriber: sub });
}

export async function DELETE(req: NextRequest) {
  if (req.cookies.get("admin_auth")?.value !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required." }, { status: 400 });

  await db.subscribers.remove(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  if (req.cookies.get("admin_auth")?.value !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required." }, { status: 400 });

  const subscriber = await db.subscribers.getById(id);
  if (!subscriber) return NextResponse.json({ error: "Subscriber not found." }, { status: 404 });

  const newsletter = await db.newsletters.getLatest();
  if (!newsletter) return NextResponse.json({ error: "No newsletter found." }, { status: 404 });

  const token = await db.tokens.create(subscriber.id, newsletter.id);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const link = `${baseUrl}/view?token=${token.token}`;
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "Restaurant Primer <admin@restaurantprimer.com>";

  await resend.emails.send({
    from: fromAddress,
    to: subscriber.email,
    subject: "You've been granted access to Restaurant Primer",
    html: buildInviteHtml(subscriber.name.split(" ")[0], link),
  });

  return NextResponse.json({ ok: true });
}
