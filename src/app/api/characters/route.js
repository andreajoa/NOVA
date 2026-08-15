import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { queryD1, d1Rows } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ensureCharactersTable() {
  await queryD1(`
    CREATE TABLE IF NOT EXISTS nova_characters (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      data TEXT NOT NULL DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await queryD1(`
    CREATE INDEX IF NOT EXISTS idx_characters_user ON nova_characters(user_id)
  `);
}

/**
 * GET — Lista todos os characters do user
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureCharactersTable();

  const rows = d1Rows(
    await queryD1(
      "SELECT id, name, data, created_at, updated_at FROM nova_characters WHERE user_id = ? ORDER BY updated_at DESC",
      [userId]
    )
  );

  const characters = rows.map((r) => {
    try {
      return { ...JSON.parse(String(r.data)), id: r.id, name: String(r.name) };
    } catch {
      return { id: r.id, name: String(r.name) };
    }
  });

  return NextResponse.json({ characters });
}

/**
 * POST — Criar ou atualizar um character (upsert)
 */
export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureCharactersTable();

  const body = await req.json();
  const id = body.id || `char_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const name = String(body.name || "Untitled").slice(0, 200);
  const data = JSON.stringify(body);

  await queryD1(
    `INSERT INTO nova_characters (id, user_id, name, data, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       data = excluded.data,
       updated_at = datetime('now')`,
    [id, userId, name, data]
  );

  return NextResponse.json({ success: true, id, name });
}

/**
 * DELETE — Remover um character
 */
export async function DELETE(req) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureCharactersTable();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await queryD1(
    "DELETE FROM nova_characters WHERE id = ? AND user_id = ?",
    [id, userId]
  );

  return NextResponse.json({ success: true, deleted: id });
}
