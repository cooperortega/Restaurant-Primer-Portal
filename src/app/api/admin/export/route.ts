import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function GET(req: NextRequest) {
  if (req.cookies.get("admin_auth")?.value !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await db.logs.getAll();

  const header = "Name,Email,Newsletter,Date,Time,IP Address,Device\n";
  const rows = logs.map((l) => {
    const dt = new Date(l.accessedAt);
    const date = dt.toLocaleDateString("en-US");
    const time = dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const device = l.userAgent.includes("Mobile") ? "Mobile" : "Desktop";
    return `"${l.subscriberName}","${l.subscriberEmail}","${l.newsletterTitle}","${date}","${time}","${l.ipAddress}","${device}"`;
  });

  const csv = header + rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="newsletter-access-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
