import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function GET(req: NextRequest) {
  if (req.cookies.get("admin_auth")?.value !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscribers = db.subscribers.getAll();
  const logs = db.logs.getAll();

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

  const existing = db.subscribers.getByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "A subscriber with that email already exists." }, { status: 409 });
  }

  const sub = db.subscribers.create(name, email);
  return NextResponse.json({ subscriber: sub });
}
