import type { SurveyResponse } from "./storage";

const RECOMMEND_LABELS: Record<string, string> = {
  yes: "Yes, definitely",
  probably: "Probably",
  not_yet: "Not yet",
};

const STARS: Record<number, string> = {
  1: "★☆☆☆☆",
  2: "★★☆☆☆",
  3: "★★★☆☆",
  4: "★★★★☆",
  5: "★★★★★",
};

export async function sendSurveyEmail(survey: SurveyResponse): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!adminEmail || !smtpHost || !smtpUser || !smtpPass) {
    console.log(
      `[Email] SMTP not configured — survey from ${survey.subscriberName} saved to dashboard only.`
    );
    return;
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const html = `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:40px;">
        <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#b8a88a;margin-bottom:8px;">Newsletter Feedback</p>
        <h1 style="font-size:26px;font-weight:400;margin-bottom:4px;">${survey.subscriberName}</h1>
        <p style="color:#555;font-size:14px;margin-bottom:32px;">${survey.subscriberEmail}</p>
        <hr style="border:none;border-top:1px solid #1e1e1e;margin-bottom:28px;" />

        <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
          <tr>
            <td style="padding:10px 0;color:#555;font-size:12px;width:180px;">Newsletter</td>
            <td style="padding:10px 0;color:#ccc;font-size:14px;">${survey.newsletterTitle}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#555;font-size:12px;">Overall Rating</td>
            <td style="padding:10px 0;color:#b8a88a;font-size:18px;">${STARS[survey.rating] ?? survey.rating + "/5"}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#555;font-size:12px;">Most Valuable Section</td>
            <td style="padding:10px 0;color:#ccc;font-size:14px;">${survey.mostValuable}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#555;font-size:12px;">Would Recommend</td>
            <td style="padding:10px 0;color:#ccc;font-size:14px;">${RECOMMEND_LABELS[survey.wouldRecommend] ?? survey.wouldRecommend}</td>
          </tr>
        </table>

        ${survey.futureTopics ? `
        <div style="margin-top:24px;padding:16px;background:#111;border-left:3px solid #b8a88a;">
          <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#555;margin-bottom:8px;">Topics for Future Issues</p>
          <p style="color:#ccc;font-size:14px;line-height:1.7;margin:0;">${survey.futureTopics}</p>
        </div>` : ""}

        ${survey.comments ? `
        <div style="margin-top:16px;padding:16px;background:#111;border-left:3px solid #333;">
          <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#555;margin-bottom:8px;">Additional Comments</p>
          <p style="color:#ccc;font-size:14px;line-height:1.7;margin:0;">${survey.comments}</p>
        </div>` : ""}

        <p style="margin-top:32px;font-size:12px;color:#333;">
          Submitted ${new Date(survey.submittedAt).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Restaurant Primer" <${smtpUser}>`,
      to: adminEmail,
      subject: `New Feedback: ${survey.subscriberName} (${survey.rating}/5) — ${survey.newsletterTitle}`,
      html,
    });

    console.log(`[Email] Survey notification sent to ${adminEmail}`);
  } catch (err) {
    console.error("[Email] Failed to send survey notification:", err);
  }
}
