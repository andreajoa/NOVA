import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isAdminUser, queryD1, d1Rows } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await isAdminUser(userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const res = await queryD1("SELECT value FROM admin_settings WHERE key = 'fal_balance' LIMIT 1", []);
  const row = d1Rows(res)[0];
  const balance = row ? Number(row.value) : null;
  return NextResponse.json({ balance });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await isAdminUser(userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { balance } = await req.json();
  await queryD1(
    "INSERT OR REPLACE INTO admin_settings (key, value) VALUES ('fal_balance', ?)",
    [String(balance)]
  );
  return NextResponse.json({ ok: true, balance });
}
