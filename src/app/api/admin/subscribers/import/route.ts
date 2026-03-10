import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function POST(req: NextRequest) {
  if (req.cookies.get("admin_auth")?.value !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await req.json() as { rows: { firstName: string; lastName: string; email: string }[] };

  if (!Array.isArray(rows) || rows.length === 0)
    return NextResponse.json({ error: "No rows provided." }, { status: 400 });

  let added = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const firstName = (row.firstName ?? "").trim();
    const lastName = (row.lastName ?? "").trim();
    const email = (row.email ?? "").trim().toLowerCase();

    if (!email || !firstName) {
      skipped++;
      continue;
    }

    const existing = await db.subscribers.getByEmail(email);
    if (existing) {
      skipped++;
      continue;
    }

    try {
      const name = lastName ? `${firstName} ${lastName}` : firstName;
      await db.subscribers.create(name, email);
      added++;
    } catch {
      errors.push(email);
    }
  }

  return NextResponse.json({ added, skipped, errors });
}
