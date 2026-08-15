import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { queryD1, d1Rows } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ensureBrandkitTable() {
  await queryD1(`
    CREATE TABLE IF NOT EXISTS nova_brandkit (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      tag TEXT NOT NULL DEFAULT 'Other',
      file_type TEXT NOT NULL DEFAULT '',
      file_size TEXT NOT NULL DEFAULT '0',
      url TEXT NOT NULL DEFAULT '',
      r2_key TEXT NOT NULL DEFAULT '',
      hex_value TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await queryD1(`
    CREATE INDEX IF NOT EXISTS idx_brandkit_user ON nova_brandkit(user_id)
  `);
}

/**
 * GET — Lista todos os assets do brand kit do user
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureBrandkitTable();

  const rows = d1Rows(
    await queryD1(
      "SELECT * FROM nova_brandkit WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    )
  );

  return NextResponse.json({ assets: rows });
}

/**
 * POST — Adicionar asset ao brand kit (após upload para R2)
 */
export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureBrandkitTable();

  const body = await req.json();
  const id = `bk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const name = String(body.name || "Untitled").slice(0, 200);
  const tag = String(body.tag || "Other").slice(0, 50);
  const fileType = String(body.fileType || body.file_type || "").toUpperCase().slice(0, 10);
  const fileSize = String(body.fileSize || body.file_size || "0");
  const url = String(body.url || "");
  const r2Key = String(body.r2Key || body.r2_key || "");
  const hexValue = body.hexValue || body.hex_value || null;

  await queryD1(
    `INSERT INTO nova_brandkit (id, user_id, name, tag, file_type, file_size, url, r2_key, hex_value)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, name, tag, fileType, fileSize, url, r2Key, hexValue]
  );

  return NextResponse.json({ success: true, id });
}

/**
 * DELETE — Remover asset do brand kit
 */
export async function DELETE(req) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureBrandkitTable();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await queryD1(
    "DELETE FROM nova_brandkit WHERE id = ? AND user_id = ?",
    [id, userId]
  );

  return NextResponse.json({ success: true, deleted: id });
}
