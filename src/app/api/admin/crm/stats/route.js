import { NextResponse } from "next/server";
import { queryD1, d1Rows } from "@/lib/db";
import { ensureCrmTables, getSetting } from "@/lib/crm/db";
import { requireCrmAdmin } from "@/lib/crm/guard";
import { STEPS, TOTAL_STEPS } from "@/lib/crm/sequence";
import { askRatio } from "@/lib/crm/emails/tactics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function pct(part, whole) {
  if (!whole) return 0;
  return Number(((part / whole) * 100).toFixed(2));
}

export async function GET() {
  const guard = await requireCrmAdmin();
  if (!guard.ok) return guard.response;

  await ensureCrmTables();

  const [contactsRes, enrollRes, logRes, perStepRes] = await Promise.all([
    queryD1(
      `SELECT status, COUNT(*) AS total, SUM(is_customer) AS customers
       FROM crm_contacts GROUP BY status`,
      []
    ),
    queryD1(
      `SELECT status, COUNT(*) AS total FROM crm_enrollments GROUP BY status`,
      []
    ),
    queryD1(
      `SELECT
         COUNT(*) AS sent,
         SUM(CASE WHEN status IN ('opened','clicked') THEN 1 ELSE 0 END) AS opened,
         SUM(CASE WHEN status = 'clicked' THEN 1 ELSE 0 END) AS clicked,
         SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) AS bounced,
         SUM(CASE WHEN status = 'complained' THEN 1 ELSE 0 END) AS complained,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed
       FROM crm_email_log`,
      []
    ),
    queryD1(
      `SELECT step_id, step_number,
              COUNT(*) AS sent,
              SUM(CASE WHEN status IN ('opened','clicked') THEN 1 ELSE 0 END) AS opened,
              SUM(CASE WHEN status = 'clicked' THEN 1 ELSE 0 END) AS clicked,
              SUM(CASE WHEN status = 'complained' THEN 1 ELSE 0 END) AS complained
       FROM crm_email_log
       GROUP BY step_id, step_number
       ORDER BY step_number ASC`,
      []
    ),
  ]);

  const byStatus = {};
  let totalContacts = 0;
  let customers = 0;

  for (const row of d1Rows(contactsRes)) {
    const total = Number(row.total || 0);
    byStatus[String(row.status)] = total;
    totalContacts += total;
    customers += Number(row.customers || 0);
  }

  const enrollments = {};
  for (const row of d1Rows(enrollRes)) {
    enrollments[String(row.status)] = Number(row.total || 0);
  }

  const totals = d1Rows(logRes)[0] || {};
  const sent = Number(totals.sent || 0);
  const opened = Number(totals.opened || 0);
  const clicked = Number(totals.clicked || 0);
  const complained = Number(totals.complained || 0);

  const stepStats = new Map(
    d1Rows(perStepRes).map((row) => [String(row.step_id), row])
  );

  // Performance por e-mail, na ordem da sequência — é aqui que se vê
  // qual assunto morre e qual merece ser reescrito.
  const perStep = STEPS.map((step) => {
    const row = stepStats.get(step.id) || {};
    const stepSent = Number(row.sent || 0);
    return {
      stepNumber: step.stepNumber,
      id: step.id,
      arc: step.arc,
      day: step.day,
      subjectEn: step.email.en.subject,
      subjectPt: step.email.pt.subject,
      sent: stepSent,
      openRate: pct(Number(row.opened || 0), stepSent),
      clickRate: pct(Number(row.clicked || 0), stepSent),
      complaintRate: pct(Number(row.complained || 0), stepSent),
    };
  });

  const complaintRate = pct(complained, sent);

  return NextResponse.json({
    ok: true,
    contacts: {
      total: totalContacts,
      customers,
      byStatus,
      subscribed: byStatus.subscribed || 0,
      unsubscribed: byStatus.unsubscribed || 0,
      bounced: byStatus.bounced || 0,
      complained: byStatus.complained || 0,
    },
    enrollments,
    email: {
      sent,
      openRate: pct(opened, sent),
      clickRate: pct(clicked, sent),
      bounceRate: pct(Number(totals.bounced || 0), sent),
      complaintRate,
      failed: Number(totals.failed || 0),
      // Gmail e Yahoo suspendem remetentes acima de 0,3% de reclamação.
      complaintHealth: complaintRate >= 0.3 ? "critical" : complaintRate >= 0.1 ? "warning" : "ok",
    },
    sequence: {
      totalSteps: TOTAL_STEPS,
      rhythm: askRatio(),
      perStep,
    },
    settings: {
      paused: (await getSetting("crm_paused", "0")) === "1",
      cadenceDays: Number(await getSetting("crm_cadence_days", "0")) || null,
      maxNoOpenStreak: Number(await getSetting("crm_max_no_open_streak", "10")),
      maxPerRun: Number(await getSetting("crm_max_per_run", "500")),
    },
  });
}
