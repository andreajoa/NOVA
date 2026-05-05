import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { setAdminRole } from "@/lib/db";

// Chave secreta para proteger esse endpoint
const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function POST(req: Request) {
  const { secret, clerkId } = await req.json();

  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await setAdminRole(clerkId);
  return NextResponse.json({ ok: true, message: `User ${clerkId} is now admin` });
}
