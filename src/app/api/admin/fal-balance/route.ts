import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await isAdminUser(userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const res = await fetch("https://rest.alpha.fal.ai/billing/balance", {
      headers: { Authorization: `Key ${process.env.FAL_KEY}` },
    });
    const data = await res.json();
    return NextResponse.json({ balance: data.balance ?? data.credits ?? 0 });
  } catch {
    return NextResponse.json({ balance: null, error: "Failed to fetch" });
  }
}
