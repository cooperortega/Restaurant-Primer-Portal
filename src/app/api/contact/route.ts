import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/storage";

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAILS = [
  "jeb@guideboatadvisors.com",
  "justin@guideboatadvisors.com",
  "cooper@guideboatadvisors.com",
  "executiverrs@gmail.com",
];

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json();

  if (!name?.trim() || !email?.trim())
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });

  await db.contactMessages.create(name.trim(), email.trim(), message?.trim() ?? "");

  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "Restaurant Primer <admin@restaurantprimer.com>";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>New Contact Message</title></head>
<body style="margin:0;padding:0;background:#f8f5f1;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5f1;padding:48px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e0d6ca;max-width:560px;width:100%;">
        <tr>
          <td style="padding:36px 48px 28px;border-bottom:1px solid #e0d6ca;text-align:center;">
            <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:22px;color:#1a1209;letter-spacing:0.03em;">Restaurant Primer</p>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#8b6634;">Contact Message</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 48px;">
            <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:20px;color:#1a1209;">New Message</p>
            <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:15px;color:#4a3728;"><strong>Name:</strong> ${name}</p>
            <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:15px;color:#4a3728;"><strong>Email:</strong> ${email}</p>
            ${message ? `<p style="margin:16px 0 8px;font-family:Arial,sans-serif;font-size:15px;color:#4a3728;"><strong>Message:</strong></p><p style="margin:0;font-family:Arial,sans-serif;font-size:15px;color:#4a3728;line-height:1.7;">${message}</p>` : ""}
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

  try {
    await resend.emails.send({
      from: fromAddress,
      to: ADMIN_EMAILS,
      subject: `New Message: ${name} (${email})`,
      html,
    });
  } catch {
    // Fire-and-forget — don't block the user if email fails
  }

  return NextResponse.json({ ok: true });
}
