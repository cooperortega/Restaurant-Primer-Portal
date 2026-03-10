import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/storage";

const FALLBACK_EMAILS = [
  "jeb@guideboatadvisors.com",
  "justin@guideboatadvisors.com",
  "cooper@guideboatadvisors.com",
  "executiverrs@gmail.com",
];

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const normalizedEmail = (email ?? "").toLowerCase().trim();
  const adminUsers = await db.admins.getAll();
  const allowedEmails = adminUsers.length > 0
    ? adminUsers.map(a => a.email.toLowerCase())
    : FALLBACK_EMAILS;

  if (!allowedEmails.includes(normalizedEmail)) {
    return NextResponse.json({ error: "This email is not authorized for admin access." }, { status: 401 });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password. Please try again." }, { status: 401 });
  }

  const cookieStore = cookies();
  cookieStore.set("admin_auth", "1", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.delete("admin_auth");
  return NextResponse.json({ ok: true });
}
