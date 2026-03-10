import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function GET(req: NextRequest) {
  if (req.cookies.get("admin_auth")?.value !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ admins: await db.admins.getAll() });
}

export async function POST(req: NextRequest) {
  if (req.cookies.get("admin_auth")?.value !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email } = await req.json();
  if (!name?.trim() || !email?.trim())
    return NextResponse.json({ error: "Name and email required." }, { status: 400 });

  const all = await db.admins.getAll();
  if (all.find(a => a.email.toLowerCase() === email.trim().toLowerCase()))
    return NextResponse.json({ error: "An admin with that email already exists." }, { status: 409 });

  const admin = await db.admins.create(name.trim(), email.trim());

  // Also add as subscriber if not already one
  const existingSubscriber = await db.subscribers.getByEmail(email.trim());
  if (!existingSubscriber) {
    await db.subscribers.create(name.trim(), email.trim());
  }

  return NextResponse.json({ admin });
}

export async function DELETE(req: NextRequest) {
  if (req.cookies.get("admin_auth")?.value !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required." }, { status: 400 });

  await db.admins.remove(id);
  return NextResponse.json({ ok: true });
}
