"use client";

import { useState, useEffect, useCallback } from "react";

// ── helpers ────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function fmtDuration(seconds) {
  if (!seconds || seconds <= 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m${s > 0 ? s + "s" : ""}`;
}

function timeAgo(timestamp) {
  if (!timestamp) return "";
  const now = Math.floor(Date.now() / 1000);
  const diff = now - Number(timestamp);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function pct(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

// ── bar chart component ────────────────────────────────────────────────────

function BarChart({ items, valueKey = "sessions", labelKey = "source", color = "#D7FF00" }) {
  const max = Math.max(1, ...items.map((i) => Number(i[valueKey] || 0)));
  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const val = Number(item[valueKey] || 0);
        const width = Math.max(2, (val / max) * 100);
        return (
          <div key={idx}>
            <div className="flex items-center justify-between text-xs mb-0.5">
              <span className="text-white/70 truncate max-w-[200px]">{item[labelKey]}</span>
              <span className="text-white/50 ml-2 tabular-nums">{fmt(val)}</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${width}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
      {items.length === 0 && (
        <p className="text-xs text-white/25 py-4 text-center">Sem dados ainda</p>
      )}
    </div>
  );
}

// ── sparkline component ────────────────────────────────────────────────────

function Sparkline({ data, color = "#D7FF00", height = 40, width = 140 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(1, ...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`)
    .join(" ");
  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
}

// ── funnel component ───────────────────────────────────────────────────────

function Funnel({ steps }) {
  const max = Math.max(1, steps[0]?.value || 1);
  return (
    <div className="space-y-2">
      {steps.map((step, idx) => {
        const width = Math.max(8, (step.value / max) * 100);
        const convRate =
          idx > 0 && steps[idx - 1].value > 0
            ? Math.round((step.value / steps[idx - 1].value) * 100)
            : null;
        return (
          <div key={idx}>
            <div className="flex items-center justify-between text-xs mb-0.5">
              <span className="text-white/70">{step.label}</span>
              <span className="text-white/40 tabular-nums">
                {fmt(step.value)}
                {convRate !== null && (
                  <span className="ml-1 text-[10px] text-[#D7FF00]">{convRate}%</span>
                )}
              </span>
            </div>
            <div className="h-6 rounded bg-white/[0.04] overflow-hidden flex items-center">
              <div
                className="h-full rounded transition-all duration-700"
                style={{
                  width: `${width}%`,
                  background: `linear-gradient(90deg, #D7FF00 0%, ${idx > 2 ? "#4ade80" : "#D7FF00"} 100%)`,
                  opacity: 1 - idx * 0.15,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── insight card ───────────────────────────────────────────────────────────

const INSIGHT_STYLES = {
  critical: { border: "border-red-500/30", bg: "bg-red-500/5", badge: "bg-red-500/20 text-red-400", icon: "!!" },
  warning: { border: "border-yellow-500/30", bg: "bg-yellow-500/5", badge: "bg-yellow-500/20 text-yellow-400", icon: "!" },
  success: { border: "border-emerald-500/30", bg: "bg-emerald-500/5", badge: "bg-emerald-500/20 text-emerald-400", icon: "OK" },
  info: { border: "border-white/10", bg: "bg-white/[0.02]", badge: "bg-white/10 text-white/60", icon: "i" },
};

function InsightCard({ insight }) {
  const s = INSIGHT_STYLES[insight.type] || INSIGHT_STYLES.info;
  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} p-4`}>
      <div className="flex items-start gap-3">
        <span className={`shrink-0 mt-0.5 rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${s.badge}`}>
          {s.icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white/90">{insight.title}</p>
          <p className="text-xs text-white/50 mt-0.5">{insight.detail}</p>
          <p className="text-xs text-[#D7FF00]/80 mt-2 leading-relaxed">
            {insight.action}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── KPI card ───────────────────────────────────────────────────────────────

function KPI({ label, value, sub, color, sparkData }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <p className={`text-3xl font-black tabular-nums ${color || "text-white"}`}>{value}</p>
        {sparkData && <Sparkline data={sparkData} />}
      </div>
      {sub && <p className="text-[11px] text-white/35 mt-1">{sub}</p>}
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────

const PERIODS = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
];

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState("7d");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/stats?period=${period}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStats(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const o = stats?.overview || {};
  const uc = stats?.userCounts || {};
  const es = stats?.emailStats || {};
  const cc = stats?.crmContacts || {};

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-8 md:px-8 lg:px-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">
            NOVA <span className="text-[#D7FF00]">Intelligence</span>
          </h1>
          <p className="text-xs text-white/30 mt-1">
            Dashboard de inteligencia em tempo real
            {lastRefresh && (
              <span className="ml-2 text-white/15">
                atualizado {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={[
                "rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition",
                period === p.value
                  ? "bg-[#D7FF00] text-black"
                  : "bg-white/[0.04] text-white/40 hover:text-white hover:bg-white/[0.08]",
              ].join(" ")}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={fetchStats}
            disabled={loading}
            className="ml-2 rounded-lg bg-white/[0.04] px-3 py-1.5 text-[10px] font-black text-white/40 hover:text-white transition"
          >
            {loading ? "..." : "REFRESH"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          Erro ao carregar: {error}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 mb-6">
        <KPI
          label="Visitantes"
          value={fmt(o.uniqueVisitors || 0)}
          sub={`${fmt(o.sessions || 0)} sessoes`}
          sparkData={stats?.daily?.map((d) => d.visitors)}
        />
        <KPI
          label="Pageviews"
          value={fmt(o.pageviews || 0)}
          sparkData={stats?.daily?.map((d) => d.views)}
        />
        <KPI
          label="Tempo medio"
          value={fmtDuration(o.avgDuration || 0)}
          sub="por sessao"
        />
        <KPI
          label="Bounce rate"
          value={`${o.bounceRate || 0}%`}
          color={o.bounceRate > 60 ? "text-red-400" : o.bounceRate > 40 ? "text-yellow-400" : "text-emerald-400"}
        />
        <KPI
          label="Usuarios"
          value={fmt(uc.total || 0)}
          sub={`${uc.paid || 0} pagos / ${uc.trial || 0} trial`}
          color="text-[#D7FF00]"
        />
        <KPI
          label="Conversao"
          value={uc.total > 0 ? `${Math.round((uc.paid / uc.total) * 100)}%` : "0%"}
          sub={`trial > pago`}
          color={uc.paid > 0 ? "text-emerald-400" : "text-white/40"}
        />
      </div>

      {/* Main grid */}
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        {/* Traffic sources */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-5">
          <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30 mb-4">
            Fontes de trafego
          </h2>
          <BarChart
            items={stats?.traffic || []}
            valueKey="sessions"
            labelKey="source"
          />
        </div>

        {/* Conversion funnel */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-5">
          <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30 mb-4">
            Funil de conversao
          </h2>
          <Funnel
            steps={[
              { label: "Visitantes", value: o.uniqueVisitors || 0 },
              { label: "Cadastros", value: uc.total || 0 },
              { label: "Contatos CRM", value: cc.subscribed || 0 },
              { label: "Clientes pagos", value: uc.paid || 0 },
            ]}
          />
        </div>
      </div>

      {/* Second row */}
      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        {/* Top pages */}
        <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.015] p-5">
          <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30 mb-4">
            Paginas mais visitadas
          </h2>
          <div className="space-y-1">
            <div className="grid grid-cols-[1fr_60px_60px_50px_50px] gap-2 text-[9px] font-bold uppercase tracking-wider text-white/20 pb-2 border-b border-white/[0.05]">
              <span>Pagina</span>
              <span className="text-right">Views</span>
              <span className="text-right">Unicos</span>
              <span className="text-right">Tempo</span>
              <span className="text-right">Scroll</span>
            </div>
            {(stats?.topPages || []).slice(0, 12).map((page, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1fr_60px_60px_50px_50px] gap-2 items-center py-1.5 text-xs border-b border-white/[0.02] last:border-0"
              >
                <span className="text-white/60 truncate" title={page.url}>
                  {page.url}
                </span>
                <span className="text-right text-white/80 tabular-nums font-semibold">
                  {fmt(page.views)}
                </span>
                <span className="text-right text-white/40 tabular-nums">
                  {fmt(page.uniqueViews)}
                </span>
                <span className="text-right text-white/30 tabular-nums">
                  {fmtDuration(page.avgDuration)}
                </span>
                <span className="text-right text-white/30 tabular-nums">
                  {page.avgScroll}%
                </span>
              </div>
            ))}
            {(!stats?.topPages || stats.topPages.length === 0) && (
              <p className="text-xs text-white/25 py-4 text-center">Sem dados ainda</p>
            )}
          </div>
        </div>

        {/* Device breakdown */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-5">
          <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30 mb-4">
            Dispositivos
          </h2>
          {(stats?.devices || []).map((d, idx) => {
            const total = (stats?.devices || []).reduce((s, x) => s + x.sessions, 0);
            const p = pct(d.sessions, total);
            const icon = d.device === "mobile" ? "MOBILE" : d.device === "tablet" ? "TABLET" : "DESKTOP";
            return (
              <div key={idx} className="mb-4 last:mb-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/60 uppercase text-[10px] font-bold tracking-wider">{icon}</span>
                  <span className="text-white/40 tabular-nums">{p}%</span>
                </div>
                <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${p}%`,
                      backgroundColor: d.device === "mobile" ? "#D7FF00" : d.device === "tablet" ? "#a3e635" : "#4ade80",
                    }}
                  />
                </div>
                <p className="text-[10px] text-white/25 mt-0.5">{fmt(d.sessions)} sessoes</p>
              </div>
            );
          })}
          {(!stats?.devices || stats.devices.length === 0) && (
            <p className="text-xs text-white/25 py-4 text-center">Sem dados</p>
          )}
        </div>
      </div>

      {/* Email CRM section */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-5 mb-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30 mb-4">
          E-mail CRM
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 mb-6">
          <div className="rounded-lg bg-white/[0.03] p-3">
            <p className="text-[9px] font-bold uppercase text-white/25">Enviados</p>
            <p className="text-xl font-black text-white mt-1">{fmt(es.sent || 0)}</p>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-3">
            <p className="text-[9px] font-bold uppercase text-white/25">Abertos</p>
            <p className="text-xl font-black text-emerald-400 mt-1">{es.openRate || 0}%</p>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-3">
            <p className="text-[9px] font-bold uppercase text-white/25">Clicados</p>
            <p className="text-xl font-black text-[#D7FF00] mt-1">{es.clickRate || 0}%</p>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-3">
            <p className="text-[9px] font-bold uppercase text-white/25">Bounce</p>
            <p className="text-xl font-black text-white/50 mt-1">{fmt(es.bounced || 0)}</p>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-3">
            <p className="text-[9px] font-bold uppercase text-white/25">Reclamacao</p>
            <p className={`text-xl font-black mt-1 ${
              es.complaintRate >= 0.3 ? "text-red-400" : es.complaintRate >= 0.1 ? "text-yellow-400" : "text-emerald-400"
            }`}>
              {es.complaintRate || 0}%
            </p>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-3">
            <p className="text-[9px] font-bold uppercase text-white/25">Contatos CRM</p>
            <p className="text-xl font-black text-white mt-1">{fmt(cc.total || 0)}</p>
            <p className="text-[10px] text-white/25">{cc.subscribed || 0} ativos</p>
          </div>
        </div>

        {/* Top performing emails */}
        {(stats?.topEmails || []).length > 0 && (
          <div>
            <h3 className="text-[9px] font-black uppercase tracking-[0.15em] text-white/20 mb-3">
              Top emails por abertura
            </h3>
            <div className="space-y-1">
              <div className="grid grid-cols-[40px_1fr_60px_60px_60px] gap-2 text-[9px] font-bold uppercase tracking-wider text-white/20 pb-2 border-b border-white/[0.05]">
                <span>#</span>
                <span>Assunto</span>
                <span className="text-right">Envios</span>
                <span className="text-right">Abert.</span>
                <span className="text-right">Clique</span>
              </div>
              {stats.topEmails.map((em, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[40px_1fr_60px_60px_60px] gap-2 items-center py-1.5 text-xs border-b border-white/[0.02] last:border-0"
                >
                  <span className="text-white/30 tabular-nums">{em.stepNumber + 1}</span>
                  <span className="text-white/60 truncate" title={em.subject}>
                    {em.subject}
                  </span>
                  <span className="text-right text-white/40 tabular-nums">{em.sent}</span>
                  <span className={`text-right tabular-nums font-semibold ${
                    em.openRate >= 30 ? "text-emerald-400" : "text-white/60"
                  }`}>
                    {em.openRate}%
                  </span>
                  <span className={`text-right tabular-nums ${
                    em.clickRate >= 5 ? "text-[#D7FF00]" : "text-white/40"
                  }`}>
                    {em.clickRate}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent signups */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-5 mb-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30 mb-4">
          Ultimos cadastros
        </h2>
        <div className="space-y-1">
          <div className="grid grid-cols-[1fr_70px_70px_60px] gap-2 text-[9px] font-bold uppercase tracking-wider text-white/20 pb-2 border-b border-white/[0.05]">
            <span>Email</span>
            <span>Plano</span>
            <span>Creditos</span>
            <span className="text-right">Quando</span>
          </div>
          {(stats?.recentSignups || []).map((user, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[1fr_70px_70px_60px] gap-2 items-center py-1.5 text-xs border-b border-white/[0.02] last:border-0"
            >
              <span className="text-white/60 truncate">{user.email}</span>
              <span className={`text-[10px] font-bold uppercase ${
                user.plan === "trial" ? "text-white/30" :
                user.plan === "basic" ? "text-blue-400" :
                user.plan === "plus" ? "text-purple-400" :
                user.plan === "ultra" ? "text-[#D7FF00]" :
                "text-white/50"
              }`}>
                {user.plan || "trial"}
              </span>
              <span className="text-white/40 tabular-nums">{user.credits}</span>
              <span className="text-right text-white/25 text-[10px]">{timeAgo(user.createdAt)}</span>
            </div>
          ))}
          {(!stats?.recentSignups || stats.recentSignups.length === 0) && (
            <p className="text-xs text-white/25 py-4 text-center">Nenhum cadastro encontrado</p>
          )}
        </div>
      </div>

      {/* AI Insights */}
      <div className="rounded-xl border border-[#D7FF00]/20 bg-[#D7FF00]/[0.02] p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="rounded-md bg-[#D7FF00]/20 px-2 py-0.5 text-[10px] font-black text-[#D7FF00]">AI</span>
          <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
            Insights & recomendacoes
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(stats?.insights || []).map((insight, idx) => (
            <InsightCard key={idx} insight={insight} />
          ))}
        </div>
      </div>

      {/* Test email section */}
      <TestEmailSection />
    </div>
  );
}

// ── test email section ─────────────────────────────────────────────────────

function TestEmailSection() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);
  const [locale, setLocale] = useState("pt");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const send = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/crm/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, step, locale }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.015] p-5">
      <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30 mb-4">
        Enviar email de teste
      </h2>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-white/25 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#D7FF00]/40 w-64"
          />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-white/25 mb-1">Step (0-59)</label>
          <input
            type="number"
            min={0}
            max={59}
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-[#D7FF00]/40 w-20"
          />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-white/25 mb-1">Idioma</label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-[#D7FF00]/40"
          >
            <option value="pt">Portugues</option>
            <option value="en">English</option>
          </select>
        </div>
        <button
          onClick={send}
          disabled={sending || !email}
          className="rounded-lg bg-[#D7FF00] px-5 py-2 text-sm font-black text-black transition hover:bg-[#e5ff4d] disabled:opacity-30"
        >
          {sending ? "Enviando..." : "Enviar teste"}
        </button>
      </div>
      {result && (
        <div className={`mt-3 rounded-lg p-3 text-xs ${result.error ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
          {result.error ? (
            <span>Erro: {result.error} {result.detail && `— ${result.detail}`}</span>
          ) : (
            <span>
              Enviado! Step #{result.step} ({result.stepId}) — {result.subject} [{result.locale}, {result.ask}]
            </span>
          )}
        </div>
      )}
    </div>
  );
}
