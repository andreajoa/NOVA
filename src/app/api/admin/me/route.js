import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ isAdmin: false });

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  const admin = await isAdminUser(userId);

  return NextResponse.json({ isAdmin: admin, email });
}
