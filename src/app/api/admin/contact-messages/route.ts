import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/storage";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_auth")?.value !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await db.contactMessages.getAll();
  return NextResponse.json({ messages });
}
