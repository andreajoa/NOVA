import crypto from "crypto";
import { queryD1, d1Rows } from "@/lib/db";

// ── bootstrap ──────────────────────────────────────────────────────────────
let tablesReady = false;

const DDL = [
  `CREATE TABLE IF NOT EXISTS nova_analytics (
    id TEXT PRIMARY KEY,
    sid TEXT NOT NULL,
    vid TEXT NOT NULL,
    uid TEXT DEFAULT '',
    ev TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT DEFAULT '',
    ref TEXT DEFAULT '',
    src TEXT DEFAULT '',
    med TEXT DEFAULT '',
    cmp TEXT DEFAULT '',
    cnt TEXT DEFAULT '',
    dev TEXT DEFAULT '',
    br TEXT DEFAULT '',
    dur INTEGER DEFAULT 0,
    sc INTEGER DEFAULT 0,
    meta TEXT DEFAULT '{}',
    ts INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_na_ts ON nova_analytics (ts)`,
  `CREATE INDEX IF NOT EXISTS idx_na_ev ON nova_analytics (ev, ts)`,
  `CREATE INDEX IF NOT EXISTS idx_na_sid ON nova_analytics (sid)`,
  `CREATE INDEX IF NOT EXISTS idx_na_vid ON nova_analytics (vid)`,
  `CREATE INDEX IF NOT EXISTS idx_na_uid ON nova_analytics (uid)`,
];

export async function ensureAnalyticsTables() {
  if (tablesReady) return;
  for (const statement of DDL) {
    await queryD1(statement, []);
  }
  tablesReady = true;
}

function now() {
  return Math.floor(Date.now() / 1000);
}

// ── ingest ─────────────────────────────────────────────────────────────────

/**
 * Grava um lote de eventos. Cada evento vem do tracker client-side.
 * Máximo 50 por request para não estourar o D1.
 */
export async function ingestEvents(events) {
  await ensureAnalyticsTables();
  const batch = (events || []).slice(0, 50);
  const ts = now();

  for (const e of batch) {
    await queryD1(
      `INSERT INTO nova_analytics
        (id, sid, vid, uid, ev, url, title, ref, src, med, cmp, cnt, dev, br, dur, sc, meta, ts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        String(e.sid || ""),
        String(e.vid || ""),
        String(e.uid || ""),
        String(e.ev || "pageview"),
        String(e.url || "").slice(0, 500),
        String(e.title || "").slice(0, 200),
        String(e.ref || "").slice(0, 500),
        String(e.src || "").slice(0, 100),
        String(e.med || "").slice(0, 100),
        String(e.cmp || "").slice(0, 100),
        String(e.cnt || "").slice(0, 100),
        String(e.dev || "").slice(0, 20),
        String(e.br || "").slice(0, 50),
        Number(e.dur || 0),
        Number(e.sc || 0),
        JSON.stringify(e.meta || {}).slice(0, 500),
        e.ts ? Number(e.ts) : ts,
      ]
    );
  }

  return batch.length;
}

// ── queries ────────────────────────────────────────────────────────────────

function periodToTimestamp(period) {
  const DAY = 86400;
  const n = now();
  switch (period) {
    case "today":
      return n - DAY;
    case "7d":
      return n - 7 * DAY;
    case "30d":
      return n - 30 * DAY;
    case "90d":
      return n - 90 * DAY;
    default:
      return n - 7 * DAY;
  }
}

export async function getOverviewStats(period = "7d") {
  await ensureAnalyticsTables();
  const since = periodToTimestamp(period);

  // Visitors, pageviews, sessions — one query
  const overviewRes = await queryD1(
    `SELECT
       COUNT(*) as total_events,
       SUM(CASE WHEN ev = 'pageview' THEN 1 ELSE 0 END) as pageviews,
       COUNT(DISTINCT vid) as unique_visitors,
       COUNT(DISTINCT sid) as sessions
     FROM nova_analytics WHERE ts >= ?`,
    [since]
  );
  const overview = d1Rows(overviewRes)[0] || {};

  // Average duration per session
  const durRes = await queryD1(
    `SELECT sid, SUM(dur) as total_dur, COUNT(*) as pv_count
     FROM nova_analytics WHERE ts >= ? AND ev = 'pageview'
     GROUP BY sid`,
    [since]
  );
  const sessions = d1Rows(durRes);
  const totalDuration = sessions.reduce((s, r) => s + Number(r.total_dur || 0), 0);
  const avgDuration = sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0;
  const bounces = sessions.filter((s) => Number(s.pv_count) === 1).length;
  const bounceRate = sessions.length > 0 ? Math.round((bounces / sessions.length) * 100) : 0;

  return {
    pageviews: Number(overview.pageviews || 0),
    uniqueVisitors: Number(overview.unique_visitors || 0),
    sessions: Number(overview.sessions || 0),
    avgDuration,
    bounceRate,
  };
}

export async function getTrafficSources(period = "7d") {
  await ensureAnalyticsTables();
  const since = periodToTimestamp(period);

  const res = await queryD1(
    `SELECT
       CASE
         WHEN src != '' THEN src
         WHEN ref != '' THEN
           CASE
             WHEN ref LIKE '%google%' THEN 'Google'
             WHEN ref LIKE '%youtube%' THEN 'YouTube'
             WHEN ref LIKE '%facebook%' OR ref LIKE '%fb.%' THEN 'Facebook'
             WHEN ref LIKE '%instagram%' THEN 'Instagram'
             WHEN ref LIKE '%tiktok%' THEN 'TikTok'
             WHEN ref LIKE '%twitter%' OR ref LIKE '%x.com%' THEN 'X/Twitter'
             WHEN ref LIKE '%linkedin%' THEN 'LinkedIn'
             WHEN ref LIKE '%reddit%' THEN 'Reddit'
             ELSE ref
           END
         ELSE 'Direto'
       END as source,
       COUNT(DISTINCT sid) as sessions,
       COUNT(DISTINCT vid) as visitors
     FROM nova_analytics WHERE ts >= ? AND ev = 'pageview'
     GROUP BY source ORDER BY sessions DESC LIMIT 10`,
    [since]
  );
  return d1Rows(res).map((r) => ({
    source: String(r.source),
    sessions: Number(r.sessions || 0),
    visitors: Number(r.visitors || 0),
  }));
}

export async function getTopPages(period = "7d") {
  await ensureAnalyticsTables();
  const since = periodToTimestamp(period);

  const res = await queryD1(
    `SELECT url, title,
       COUNT(*) as views,
       COUNT(DISTINCT vid) as unique_views,
       AVG(dur) as avg_duration,
       AVG(sc) as avg_scroll
     FROM nova_analytics WHERE ts >= ? AND ev = 'pageview'
     GROUP BY url ORDER BY views DESC LIMIT 20`,
    [since]
  );
  return d1Rows(res).map((r) => ({
    url: String(r.url),
    title: String(r.title || r.url),
    views: Number(r.views || 0),
    uniqueViews: Number(r.unique_views || 0),
    avgDuration: Math.round(Number(r.avg_duration || 0)),
    avgScroll: Math.round(Number(r.avg_scroll || 0)),
  }));
}

export async function getDeviceBreakdown(period = "7d") {
  await ensureAnalyticsTables();
  const since = periodToTimestamp(period);

  const res = await queryD1(
    `SELECT
       CASE WHEN dev = '' THEN 'desktop' ELSE dev END as device,
       COUNT(DISTINCT sid) as sessions
     FROM nova_analytics WHERE ts >= ? AND ev = 'pageview'
     GROUP BY device ORDER BY sessions DESC`,
    [since]
  );
  return d1Rows(res).map((r) => ({
    device: String(r.device),
    sessions: Number(r.sessions || 0),
  }));
}

export async function getDailyPageviews(period = "7d") {
  await ensureAnalyticsTables();
  const since = periodToTimestamp(period);

  const res = await queryD1(
    `SELECT
       CAST((ts / 86400) AS INTEGER) as day_bucket,
       COUNT(*) as views,
       COUNT(DISTINCT vid) as visitors
     FROM nova_analytics WHERE ts >= ? AND ev = 'pageview'
     GROUP BY day_bucket ORDER BY day_bucket ASC`,
    [since]
  );
  return d1Rows(res).map((r) => ({
    date: new Date(Number(r.day_bucket) * 86400 * 1000).toISOString().slice(0, 10),
    views: Number(r.views || 0),
    visitors: Number(r.visitors || 0),
  }));
}

export async function getRecentSignups(limit = 15) {
  await ensureAnalyticsTables();
  const res = await queryD1(
    `SELECT id, email, plan, credits, image_gens_used, created_at
     FROM users ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );
  return d1Rows(res).map((r) => ({
    id: String(r.id),
    email: String(r.email || ""),
    plan: String(r.plan || "trial"),
    credits: Number(r.credits || 0),
    imageGensUsed: Number(r.image_gens_used || 0),
    createdAt: Number(r.created_at || 0),
  }));
}

export async function getUserCounts() {
  const res = await queryD1(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN plan != 'trial' AND plan != '' THEN 1 ELSE 0 END) as paid,
       SUM(CASE WHEN plan = 'trial' OR plan = '' THEN 1 ELSE 0 END) as trial
     FROM users`,
    []
  );
  const row = d1Rows(res)[0] || {};
  return {
    total: Number(row.total || 0),
    paid: Number(row.paid || 0),
    trial: Number(row.trial || 0),
  };
}

export async function getCrmEmailStats() {
  await ensureAnalyticsTables();

  const res = await queryD1(
    `SELECT
       COUNT(*) as total_sent,
       SUM(CASE WHEN status IN ('opened','clicked') THEN 1 ELSE 0 END) as opened,
       SUM(CASE WHEN status = 'clicked' THEN 1 ELSE 0 END) as clicked,
       SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounced,
       SUM(CASE WHEN status = 'complained' THEN 1 ELSE 0 END) as complained,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
     FROM crm_email_log`,
    []
  );
  const row = d1Rows(res)[0] || {};
  const sent = Number(row.total_sent || 0);
  return {
    sent,
    opened: Number(row.opened || 0),
    clicked: Number(row.clicked || 0),
    bounced: Number(row.bounced || 0),
    complained: Number(row.complained || 0),
    failed: Number(row.failed || 0),
    openRate: sent > 0 ? Math.round((Number(row.opened || 0) / sent) * 1000) / 10 : 0,
    clickRate: sent > 0 ? Math.round((Number(row.clicked || 0) / sent) * 1000) / 10 : 0,
    complaintRate: sent > 0 ? Math.round((Number(row.complained || 0) / sent) * 10000) / 100 : 0,
  };
}

export async function getCrmTopEmails(limit = 10) {
  await ensureAnalyticsTables();
  const res = await queryD1(
    `SELECT step_id, step_number, subject,
       COUNT(*) as sent,
       SUM(CASE WHEN status IN ('opened','clicked') THEN 1 ELSE 0 END) as opens,
       SUM(CASE WHEN status = 'clicked' THEN 1 ELSE 0 END) as clicks
     FROM crm_email_log
     GROUP BY step_id
     ORDER BY CAST(opens AS FLOAT) / MAX(1, COUNT(*)) DESC
     LIMIT ?`,
    [limit]
  );
  return d1Rows(res).map((r) => {
    const sent = Number(r.sent || 0);
    return {
      stepId: String(r.step_id),
      stepNumber: Number(r.step_number || 0),
      subject: String(r.subject || ""),
      sent,
      opens: Number(r.opens || 0),
      clicks: Number(r.clicks || 0),
      openRate: sent > 0 ? Math.round((Number(r.opens || 0) / sent) * 1000) / 10 : 0,
      clickRate: sent > 0 ? Math.round((Number(r.clicks || 0) / sent) * 1000) / 10 : 0,
    };
  });
}

export async function getCrmContactStats() {
  await ensureAnalyticsTables();
  const res = await queryD1(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN status = 'subscribed' THEN 1 ELSE 0 END) as subscribed,
       SUM(CASE WHEN status = 'unsubscribed' THEN 1 ELSE 0 END) as unsubscribed,
       SUM(CASE WHEN is_customer = 1 THEN 1 ELSE 0 END) as customers
     FROM crm_contacts`,
    []
  );
  const row = d1Rows(res)[0] || {};
  return {
    total: Number(row.total || 0),
    subscribed: Number(row.subscribed || 0),
    unsubscribed: Number(row.unsubscribed || 0),
    customers: Number(row.customers || 0),
  };
}

// ── insights ───────────────────────────────────────────────────────────────

export function generateInsights({
  overview,
  traffic,
  topPages,
  devices,
  emailStats,
  crmContacts,
  userCounts,
}) {
  const insights = [];

  // Bounce rate
  if (overview.bounceRate > 65) {
    insights.push({
      type: "critical",
      title: "Taxa de rejeicao alta",
      detail: `${overview.bounceRate}% dos visitantes saem na primeira pagina.`,
      action:
        "Melhore o hero section da homepage: CTA mais visivel, prova social acima da dobra, video de demonstracao autoplay.",
    });
  } else if (overview.bounceRate > 45) {
    insights.push({
      type: "warning",
      title: "Taxa de rejeicao moderada",
      detail: `${overview.bounceRate}% dos visitantes saem sem interagir.`,
      action:
        "Adicione um popup de saida com oferta de trial ou video demo rapido.",
    });
  }

  // Device breakdown
  const mobileDevice = devices.find(
    (d) => d.device === "mobile" || d.device === "Mobile"
  );
  const totalDeviceSessions = devices.reduce((s, d) => s + d.sessions, 0);
  if (mobileDevice && totalDeviceSessions > 0) {
    const mobilePct = Math.round(
      (mobileDevice.sessions / totalDeviceSessions) * 100
    );
    if (mobilePct > 55) {
      insights.push({
        type: "info",
        title: `${mobilePct}% do trafego e mobile`,
        detail: "A maioria dos visitantes usa celular.",
        action:
          "Priorize experiencia mobile: botoes maiores, menos texto, gerador simplificado.",
      });
    }
  }

  // Email complaint rate
  if (emailStats.complaintRate >= 0.3) {
    insights.push({
      type: "critical",
      title: "Taxa de reclamacao perigosa",
      detail: `${emailStats.complaintRate}% — acima do limite de 0.3% do Gmail/Yahoo.`,
      action:
        "URGENTE: pause o CRM, revise os ultimos emails enviados, verifique se a lista tem contatos com opt-in valido.",
    });
  } else if (emailStats.complaintRate >= 0.1) {
    insights.push({
      type: "warning",
      title: "Taxa de reclamacao subindo",
      detail: `${emailStats.complaintRate}% — zona amarela.`,
      action:
        "Reduza a frequencia de envio e revise os emails do arco de oferta.",
    });
  }

  // Email open rate
  if (emailStats.sent > 10 && emailStats.openRate < 20) {
    insights.push({
      type: "warning",
      title: "Taxa de abertura baixa",
      detail: `${emailStats.openRate}% dos emails sao abertos.`,
      action:
        "Teste assuntos mais curtos e diretos. Use numeros e perguntas. Evite palavras que disparam filtro de spam.",
    });
  } else if (emailStats.sent > 10 && emailStats.openRate > 35) {
    insights.push({
      type: "success",
      title: "Otima taxa de abertura",
      detail: `${emailStats.openRate}% — acima da media de SaaS (25%).`,
      action: "Continue com o estilo atual de assuntos. Documente os padroes que funcionam.",
    });
  }

  // Conversion
  if (userCounts.total > 10 && userCounts.paid === 0) {
    insights.push({
      type: "critical",
      title: "Zero conversoes pagas",
      detail: `${userCounts.total} usuarios cadastrados, nenhum pagante.`,
      action:
        "Revise a pagina de pricing. Considere: trial com mais creditos, onboarding guiado, desconto de primeiro mes.",
    });
  } else if (userCounts.total > 20) {
    const convRate = Math.round((userCounts.paid / userCounts.total) * 1000) / 10;
    if (convRate < 3) {
      insights.push({
        type: "warning",
        title: `Conversao de ${convRate}%`,
        detail: `${userCounts.paid} pagantes de ${userCounts.total} cadastrados.`,
        action:
          "Melhore o onboarding: guie o usuario ate a primeira geracao em <2 minutos. Considere e-mails de reativacao para quem nao gerou nada.",
      });
    } else if (convRate > 8) {
      insights.push({
        type: "success",
        title: `Conversao excelente: ${convRate}%`,
        detail: `${userCounts.paid} pagantes — acima da media de SaaS (5%).`,
        action: "Documente o funil atual como baseline. Foque em aumentar volume de trafego.",
      });
    }
  }

  // Top pages
  const pricingPage = topPages.find(
    (p) => p.url.includes("/pricing") || p.url.includes("/checkout")
  );
  const dashPage = topPages.find((p) => p.url === "/dashboard");
  if (pricingPage && dashPage && pricingPage.views > 0) {
    const pricingConversion = Math.round(
      (userCounts.paid / pricingPage.uniqueViews) * 100
    );
    if (pricingConversion < 5 && pricingPage.uniqueViews > 5) {
      insights.push({
        type: "warning",
        title: "Pricing recebe visitas mas nao converte",
        detail: `${pricingPage.uniqueViews} visitantes unicos, ~${pricingConversion}% convertem.`,
        action:
          "Teste layout com comparacao lado a lado, destaques no plano mais popular, garantia de reembolso visivel.",
      });
    }
  }

  // Low traffic
  if (overview.uniqueVisitors < 10 && overview.sessions > 0) {
    insights.push({
      type: "info",
      title: "Volume de trafego baixo",
      detail: `${overview.uniqueVisitors} visitantes unicos no periodo.`,
      action:
        "Invista em SEO (as paginas /ai/* ja existem), conteudo no TikTok/Instagram com videos gerados na NOVA, e Google Ads para termos de busca de concorrentes.",
    });
  }

  // Session duration
  if (overview.avgDuration > 0 && overview.avgDuration < 60) {
    insights.push({
      type: "warning",
      title: "Sessoes muito curtas",
      detail: `Media de ${overview.avgDuration}s — visitantes nao estao explorando.`,
      action:
        "Adicione conteudo interativo na homepage: galeria de videos gerados, antes/depois, demonstracao ao vivo.",
    });
  }

  // CRM contacts vs users
  if (crmContacts.total > 0 && crmContacts.customers > 0) {
    const crmConvRate = Math.round(
      (crmContacts.customers / crmContacts.total) * 1000
    ) / 10;
    insights.push({
      type: crmConvRate > 5 ? "success" : "info",
      title: `CRM converteu ${crmContacts.customers} clientes (${crmConvRate}%)`,
      detail: `De ${crmContacts.total} contatos, ${crmContacts.subscribed} ativos na sequencia.`,
      action:
        crmConvRate > 5
          ? "O motor de email esta funcionando bem. Mantenha a cadencia."
          : "Considere adicionar mais emails de valor (jabs) nos primeiros arcos.",
    });
  }

  // Always give at least one insight
  if (insights.length === 0) {
    insights.push({
      type: "info",
      title: "Dados insuficientes",
      detail: "Ainda nao ha dados suficientes para gerar recomendacoes.",
      action:
        "O tracker de analytics foi instalado. Aguarde 24-48h para os primeiros insights aparecerem.",
    });
  }

  return insights;
}
