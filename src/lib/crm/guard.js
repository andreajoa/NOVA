import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isNovaAdminFromAuth } from "@/lib/novaAdminAccess";

/**
 * Portão das rotas administrativas do CRM.
 * Devolve { ok: true, userId } ou { ok: false, response } pronto para retornar.
 */
export async function requireCrmAdmin() {
  const session = await auth();
  const userId = session?.userId;

  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const isAdmin = await isNovaAdminFromAuth(userId, session.sessionClaims);

  if (!isAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, userId };
}
