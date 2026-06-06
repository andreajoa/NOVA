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
    const falKey = process.env.FAL_KEY || "";
    const res = await fetch("https://rest.alpha.fal.ai/billing/wallet", {
      headers: {
        "Authorization": `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("fal.ai wallet error:", res.status, text);
      return NextResponse.json({ error: "Failed to fetch fal.ai balance", status: res.status }, { status: 502 });
    }

    const data = await res.json();
    // fal.ai returns { balance: number } in dollars
    const balance = data?.balance ?? data?.credits ?? data?.amount ?? null;
    return NextResponse.json({ balance, raw: data });
  } catch (err) {
    console.error("fal.ai wallet fetch failed:", err);
    return NextResponse.json({ error: "Network error fetching fal.ai balance" }, { status: 500 });
  }
}
