import { NextResponse } from "next/server";
import { queryD1, d1Rows } from "@/lib/db";
import { ensureCrmTables, serializeContact, setContactStatus } from "@/lib/crm/db";
import { requireCrmAdmin } from "@/lib/crm/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUS = ["subscribed", "unsubscribed", "bounced", "complained", "suppressed"];

export async function GET(request) {
  const guard = await requireCrmAdmin();
  if (!guard.ok) return guard.response;

  await ensureCrmTables();

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "";
  const search = (url.searchParams.get("q") || "").trim().toLowerCase();
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
  const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);

  const where = [];
  const params = [];

  if (status && ALLOWED_STATUS.includes(status)) {
    where.push("c.status = ?");
    params.push(status);
  }

  if (search) {
    where.push("(LOWER(c.email) LIKE ? OR LOWER(c.first_name) LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const res = await queryD1(
    `SELECT c.*, e.current_step, e.status AS enrollment_status, e.next_send_at
     FROM crm_contacts c
     LEFT JOIN crm_enrollments e ON e.contact_id = c.id
     ${whereSql}
     ORDER BY c.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const countRes = await queryD1(
    `SELECT COUNT(*) AS total FROM crm_contacts c ${whereSql}`,
    params
  );

  const contacts = d1Rows(res).map((row) => ({
    ...serializeContact(row),
    currentStep: row.current_step === null ? null : Number(row.current_step),
    enrollmentStatus: row.enrollment_status ? String(row.enrollment_status) : null,
    nextSendAt: row.next_send_at ? Number(row.next_send_at) : null,
  }));

  return NextResponse.json({
    ok: true,
    total: Number(d1Rows(countRes)[0]?.total || 0),
    limit,
    offset,
    contacts,
  });
}

/** Ações manuais: suprimir ou reinscrever um contato. */
export async function PATCH(request) {
  const guard = await requireCrmAdmin();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const status = String(body.status || "");

  if (!email) {
    return NextResponse.json({ error: "email é obrigatório" }, { status: 400 });
  }

  if (!ALLOWED_STATUS.includes(status)) {
    return NextResponse.json({ error: `status inválido: ${status}` }, { status: 400 });
  }

  await ensureCrmTables();

  if (status === "subscribed") {
    // Reinscrever exige tirar da supressão também, senão o dispatch ignora.
    await queryD1(`DELETE FROM crm_suppressions WHERE email = ?`, [email]);
    await queryD1(
      `UPDATE crm_contacts SET status = 'subscribed', no_open_streak = 0, updated_at = ? WHERE email = ?`,
      [Math.floor(Date.now() / 1000), email]
    );
  } else {
    await setContactStatus(email, status, `admin_${status}`);
  }

  return NextResponse.json({ ok: true, email, status });
}
