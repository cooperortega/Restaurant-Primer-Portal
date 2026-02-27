import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/storage";

export async function GET(req: NextRequest) {
  if (req.cookies.get("admin_auth")?.value !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = db.logs.getAll();
  return NextResponse.json({ logs });
}
