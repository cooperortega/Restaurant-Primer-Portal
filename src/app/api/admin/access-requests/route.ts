import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/storage";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  if (req.cookies.get("admin_auth")?.value !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ requests: await db.accessRequests.getAll() });
}

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
            <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;color:#4a3728;line-height:1.8;">Your request has been approved. Click the button below to access the Restaurant Primer.</p>
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

export async function PATCH(req: NextRequest) {
  if (req.cookies.get("admin_auth")?.value !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action, ids } = await req.json();
  // action: "add" | "invite" | "dismiss" | "add_all" | "invite_all"

  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "Restaurant Primer <admin@restaurantprimer.com>";
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // ── Bulk actions ──
  if (action === "add_all") {
    const allRequests = await db.accessRequests.getAll();
    const targets = (ids as string[]) ?? allRequests.filter(r => r.status === "pending").map(r => r.id);
    for (const rid of targets) {
      const r = allRequests.find(x => x.id === rid);
      if (!r || r.status !== "pending") continue;
      if (!await db.subscribers.getByEmail(r.email)) await db.subscribers.create(r.name, r.email);
      await db.accessRequests.updateStatus(rid, "added");
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "invite_all") {
    const allRequests = await db.accessRequests.getAll();
    const targets = (ids as string[]) ?? allRequests.filter(r => r.status === "added").map(r => r.id);
    const newsletter = await db.newsletters.getLatest();
    if (!newsletter) return NextResponse.json({ error: "No newsletter found." }, { status: 404 });
    for (const rid of targets) {
      const r = allRequests.find(x => x.id === rid);
      if (!r || r.status !== "added") continue;
      const existingSub = await db.subscribers.getByEmail(r.email);
      const subscriber = existingSub ?? await db.subscribers.create(r.name, r.email);
      const token = await db.tokens.create(subscriber.id, newsletter.id);
      const link = `${baseUrl}/view?token=${token.token}`;
      try {
        await resend.emails.send({ from: fromAddress, to: r.email, subject: "You've been granted access to Restaurant Primer", html: buildInviteHtml(r.name.split(" ")[0], link) });
      } catch { /* continue on failure */ }
      await db.accessRequests.updateStatus(rid, "granted");
    }
    return NextResponse.json({ ok: true });
  }

  // ── Single actions ──
  if (!id || !["add", "invite", "dismiss"].includes(action))
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const allRequests = await db.accessRequests.getAll();
  const accessReq = allRequests.find(r => r.id === id);
  if (!accessReq) return NextResponse.json({ error: "Request not found." }, { status: 404 });

  if (action === "dismiss") {
    await db.accessRequests.updateStatus(id, "dismissed");
    return NextResponse.json({ ok: true });
  }

  if (action === "add") {
    if (!await db.subscribers.getByEmail(accessReq.email)) await db.subscribers.create(accessReq.name, accessReq.email);
    await db.accessRequests.updateStatus(id, "added");
    return NextResponse.json({ ok: true });
  }

  // action === "invite"
  const existingSub = await db.subscribers.getByEmail(accessReq.email);
  const subscriber = existingSub ?? await db.subscribers.create(accessReq.name, accessReq.email);
  const newsletter = await db.newsletters.getLatest();
  if (!newsletter) return NextResponse.json({ error: "No newsletter found." }, { status: 404 });
  const token = await db.tokens.create(subscriber.id, newsletter.id);
  const link = `${baseUrl}/view?token=${token.token}`;
  try {
    await resend.emails.send({ from: fromAddress, to: accessReq.email, subject: "You've been granted access to Restaurant Primer", html: buildInviteHtml(accessReq.name.split(" ")[0], link) });
  } catch { /* email failed but we still mark granted */ }
  await db.accessRequests.updateStatus(id, "granted");
  return NextResponse.json({ ok: true });
}
