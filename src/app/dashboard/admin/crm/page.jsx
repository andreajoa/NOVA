"use client";

import { useCallback, useEffect, useState } from "react";

const GREEN = "#d9ff00";

const ARC_LABELS = {
  1: "Ativação",
  2: "Features",
  3: "Nicho",
  4: "Objeções",
  5: "Oferta",
  6: "Win-back",
};

function Card({ label, value, hint, tone = "default" }) {
  const toneColor =
    tone === "critical" ? "#ff6b6b" : tone === "warning" ? "#ffc93c" : GREEN;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black leading-none" style={{ color: toneColor }}>
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-white/45">{hint}</p> : null}
    </div>
  );
}

function Section({ title, description, children, actions }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/45">{description}</p>
          ) : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export default function CrmAdminPage() {
  const [stats, setStats] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [contactFilter, setContactFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [importCsv, setImportCsv] = useState("");
  const [importList, setImportList] = useState("");
  const [importConsent, setImportConsent] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/crm/stats", { cache: "no-store" });
    if (!res.ok) {
      setError(res.status === 403 ? "Acesso restrito a administradores." : "Falha ao carregar métricas.");
      return;
    }
    setStats(await res.json());
    setError("");
  }, []);

  const fetchContacts = useCallback(async () => {
    const params = new URLSearchParams();
    if (contactFilter) params.set("status", contactFilter);
    if (search.trim()) params.set("q", search.trim());
    params.set("limit", "50");

    const res = await fetch(`/api/admin/crm/contacts?${params}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.contacts || [];
  }, [contactFilter, search]);

  const loadContacts = useCallback(async () => {
    const rows = await fetchContacts();
    if (rows) setContacts(rows);
  }, [fetchContacts]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadStats();
      setLoading(false);
    })();
  }, [loadStats]);

  // Debounce da busca: evita uma requisição por tecla e mantém o setState
  // fora do corpo síncrono do efeito.
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      const rows = await fetchContacts();
      if (!cancelled && rows) setContacts(rows);
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fetchContacts]);

  async function patchSettings(payload, label) {
    setBusy(label);
    setNotice("");
    try {
      const res = await fetch("/api/admin/crm/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha");
      await loadStats();
      setNotice(
        payload.action === "run_now"
          ? `Ciclo executado: ${data.result?.sent ?? 0} enviados, ${data.result?.skipped ?? 0} pulados, ${data.result?.failed ?? 0} falhas.`
          : "Configuração salva."
      );
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy("");
    }
  }

  async function changeContactStatus(email, status) {
    setBusy(email);
    try {
      await fetch("/api/admin/crm/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, status }),
      });
      await Promise.all([loadContacts(), loadStats()]);
    } finally {
      setBusy("");
    }
  }

  async function runImport() {
    setBusy("import");
    setImportResult(null);
    setError("");
    try {
      const res = await fetch("/api/admin/crm/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csv: importCsv,
          listName: importList,
          consentConfirmed: importConsent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Falha na importação");
      setImportResult(data);
      setImportCsv("");
      await Promise.all([loadStats(), loadContacts()]);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return <div className="p-10 text-white/50">Carregando CRM…</div>;
  }

  if (error && !stats) {
    return <div className="p-10 text-red-300">{error}</div>;
  }

  const s = stats || {};
  const health = s.email?.complaintHealth || "ok";

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 text-white">
      <header>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em]" style={{ color: GREEN }}>
          NOVA CRM
        </p>
        <h1 className="mt-1 text-3xl font-black uppercase tracking-tight">Motor de e-mail</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">
          Sequência de {s.sequence?.totalSteps ?? 60} e-mails, bilíngue, disparada de hora em hora pelo
          cron. Ritmo: {s.sequence?.rhythm?.jabs ?? 0} de valor · {s.sequence?.rhythm?.hooks ?? 0} de oferta.
        </p>
      </header>

      {notice ? (
        <div className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white/75">
          {notice}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Contatos" value={s.contacts?.total ?? 0} hint={`${s.contacts?.subscribed ?? 0} ativos na lista`} />
        <Card label="Clientes" value={s.contacts?.customers ?? 0} hint="Saíram da sequência ao assinar" />
        <Card label="E-mails enviados" value={s.email?.sent ?? 0} hint={`${s.email?.failed ?? 0} falhas`} />
        <Card
          label="Taxa de reclamação"
          value={`${s.email?.complaintRate ?? 0}%`}
          tone={health}
          hint={
            health === "critical"
              ? "Acima de 0,3% — Gmail e Yahoo bloqueiam nessa faixa. Pause e revise."
              : health === "warning"
                ? "Acima de 0,1% — vale reduzir a cadência antes de piorar."
                : "Saudável. O limite dos provedores é 0,3%."
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card label="Abertura" value={`${s.email?.openRate ?? 0}%`} />
        <Card label="Clique" value={`${s.email?.clickRate ?? 0}%`} />
        <Card label="Descadastros" value={s.contacts?.unsubscribed ?? 0} hint={`${s.contacts?.bounced ?? 0} bounces`} />
      </div>

      <Section
        title="Controle"
        description="O kill switch para o disparo imediatamente sem apagar nada — as inscrições continuam de onde pararam quando você reativar."
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => patchSettings({ crm_paused: !s.settings?.paused }, "pause")}
            disabled={busy === "pause"}
            className="rounded-xl px-5 py-3 text-sm font-black uppercase tracking-wider disabled:opacity-50"
            style={
              s.settings?.paused
                ? { background: GREEN, color: "#000" }
                : { background: "rgba(255,107,107,.15)", color: "#ff9b9b", border: "1px solid rgba(255,107,107,.3)" }
            }
          >
            {s.settings?.paused ? "Retomar disparo" : "Pausar tudo"}
          </button>

          <button
            onClick={() => patchSettings({ action: "run_now", dryRun: true, limit: 20 }, "dry")}
            disabled={busy === "dry"}
            className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white/80 disabled:opacity-50"
          >
            Simular ciclo
          </button>

          <button
            onClick={() => patchSettings({ action: "run_now", limit: 20 }, "run")}
            disabled={busy === "run" || s.settings?.paused}
            className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white/80 disabled:opacity-50"
          >
            Rodar ciclo agora
          </button>

          <span className="text-xs text-white/40">
            {s.settings?.paused ? "Disparo pausado." : "Disparo ativo — cron de hora em hora."}
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="text-xs">
            <span className="mb-1 block font-bold uppercase tracking-wider text-white/45">
              Cadência fixa (dias)
            </span>
            <input
              type="number"
              min="0"
              defaultValue={s.settings?.cadenceDays ?? 0}
              onBlur={(e) => patchSettings({ crm_cadence_days: e.target.value }, "cadence")}
              className="w-full rounded-lg border border-white/12 bg-black/50 px-3 py-2 text-sm text-white"
            />
            <span className="mt-1 block text-[11px] text-white/35">
              0 = usa o escalonado (denso no início, afinando). 2 = de 2 em 2 dias.
            </span>
          </label>

          <label className="text-xs">
            <span className="mb-1 block font-bold uppercase tracking-wider text-white/45">
              Pausar após N sem abrir
            </span>
            <input
              type="number"
              min="1"
              defaultValue={s.settings?.maxNoOpenStreak ?? 10}
              onBlur={(e) => patchSettings({ crm_max_no_open_streak: e.target.value }, "streak")}
              className="w-full rounded-lg border border-white/12 bg-black/50 px-3 py-2 text-sm text-white"
            />
            <span className="mt-1 block text-[11px] text-white/35">
              Freio automático. É o que segura a taxa de reclamação.
            </span>
          </label>

          <label className="text-xs">
            <span className="mb-1 block font-bold uppercase tracking-wider text-white/45">
              Máximo por ciclo
            </span>
            <input
              type="number"
              min="1"
              max="200"
              defaultValue={s.settings?.maxPerRun ?? 60}
              onBlur={(e) => patchSettings({ crm_max_per_run: e.target.value }, "perrun")}
              className="w-full rounded-lg border border-white/12 bg-black/50 px-3 py-2 text-sm text-white"
            />
            <span className="mt-1 block text-[11px] text-white/35">
              60/hora ≈ 1.400/dia. Suba conforme a reputação do domínio aguentar.
            </span>
          </label>
        </div>
      </Section>

      <Section
        title="Importar lista"
        description="CSV com uma coluna email (opcionais: first_name, last_name, locale). Contatos já descadastrados são ignorados automaticamente."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <input
              value={importList}
              onChange={(e) => setImportList(e.target.value)}
              placeholder="Nome da lista (ex: webinar-fev-2026)"
              className="w-full rounded-lg border border-white/12 bg-black/50 px-3 py-2.5 text-sm text-white"
            />
            <textarea
              value={importCsv}
              onChange={(e) => setImportCsv(e.target.value)}
              rows={8}
              placeholder={"email,first_name,locale\nfulano@exemplo.com,Fulano,pt"}
              className="w-full rounded-lg border border-white/12 bg-black/50 px-3 py-2.5 font-mono text-xs text-white"
            />
            <label className="flex items-start gap-2 text-xs text-white/60">
              <input
                type="checkbox"
                checked={importConsent}
                onChange={(e) => setImportConsent(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Confirmo que estes contatos pediram para receber e-mail da NOVA. Lista comprada gera
                reclamação, e acima de 0,3% o domínio inteiro para de entregar — inclusive recuperação
                de senha e recibo do Stripe.
              </span>
            </label>
            <button
              onClick={runImport}
              disabled={busy === "import" || !importCsv.trim() || !importList.trim() || !importConsent}
              className="rounded-xl px-5 py-3 text-sm font-black uppercase tracking-wider disabled:opacity-40"
              style={{ background: GREEN, color: "#000" }}
            >
              {busy === "import" ? "Importando…" : "Importar e inscrever"}
            </button>
          </div>

          {importResult ? (
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-xs">
              <p className="font-bold text-white/80">Resultado — {importResult.listName}</p>
              <ul className="mt-2 space-y-1 text-white/55">
                <li>Recebidos: {importResult.received}</li>
                <li>Importados: {importResult.imported}</li>
                <li>Inscritos na sequência: {importResult.enrolled}</li>
                <li>Ignorados: {importResult.skipped?.length ?? 0}</li>
                <li>Inválidos: {importResult.invalid?.length ?? 0}</li>
              </ul>
            </div>
          ) : null}
        </div>
      </Section>

      <Section
        title="Performance por e-mail"
        description="Na ordem da sequência. Assunto com abertura baixa é o primeiro a reescrever; reclamação alta num passo específico indica cadência apertada demais naquele ponto."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/40">
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">Arco</th>
                <th className="py-2 pr-3">Dia</th>
                <th className="py-2 pr-3">Assunto (EN)</th>
                <th className="py-2 pr-3 text-right">Enviados</th>
                <th className="py-2 pr-3 text-right">Abertura</th>
                <th className="py-2 pr-3 text-right">Clique</th>
                <th className="py-2 text-right">Reclam.</th>
              </tr>
            </thead>
            <tbody>
              {(s.sequence?.perStep || []).map((step) => (
                <tr key={step.id} className="border-b border-white/5 text-white/70">
                  <td className="py-2 pr-3 text-white/35">{step.stepNumber + 1}</td>
                  <td className="py-2 pr-3 text-[11px] text-white/45">{ARC_LABELS[step.arc]}</td>
                  <td className="py-2 pr-3 text-white/40">D{step.day}</td>
                  <td className="max-w-[320px] truncate py-2 pr-3" title={step.subjectEn}>
                    {step.subjectEn}
                  </td>
                  <td className="py-2 pr-3 text-right">{step.sent}</td>
                  <td className="py-2 pr-3 text-right" style={{ color: step.openRate >= 25 ? GREEN : undefined }}>
                    {step.openRate}%
                  </td>
                  <td className="py-2 pr-3 text-right">{step.clickRate}%</td>
                  <td
                    className="py-2 text-right"
                    style={{ color: step.complaintRate >= 0.3 ? "#ff6b6b" : undefined }}
                  >
                    {step.complaintRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Contatos"
        actions={
          <div className="flex flex-wrap gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar e-mail…"
              className="rounded-lg border border-white/12 bg-black/50 px-3 py-2 text-sm text-white"
            />
            <select
              value={contactFilter}
              onChange={(e) => setContactFilter(e.target.value)}
              className="rounded-lg border border-white/12 bg-black/50 px-3 py-2 text-sm text-white"
            >
              <option value="">Todos</option>
              <option value="subscribed">Inscritos</option>
              <option value="unsubscribed">Descadastrados</option>
              <option value="bounced">Bounce</option>
              <option value="complained">Reclamação</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/40">
                <th className="py-2 pr-3">E-mail</th>
                <th className="py-2 pr-3">Idioma</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Origem</th>
                <th className="py-2 pr-3 text-right">Passo</th>
                <th className="py-2 pr-3 text-right">Enviados</th>
                <th className="py-2 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-b border-white/5 text-white/70">
                  <td className="py-2 pr-3">
                    {contact.email}
                    {contact.isCustomer ? (
                      <span className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: GREEN, color: "#000" }}>
                        CLIENTE
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2 pr-3 uppercase text-white/45">{contact.locale}</td>
                  <td className="py-2 pr-3">{contact.status}</td>
                  <td className="py-2 pr-3 text-white/45">{contact.source}</td>
                  <td className="py-2 pr-3 text-right">
                    {contact.currentStep === null ? "—" : contact.currentStep + 1}
                  </td>
                  <td className="py-2 pr-3 text-right">{contact.sentCount}</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() =>
                        changeContactStatus(
                          contact.email,
                          contact.status === "subscribed" ? "suppressed" : "subscribed"
                        )
                      }
                      disabled={busy === contact.email}
                      className="rounded-lg border border-white/15 px-2.5 py-1 text-[11px] font-bold text-white/70 disabled:opacity-40"
                    >
                      {contact.status === "subscribed" ? "Suprimir" : "Reinscrever"}
                    </button>
                  </td>
                </tr>
              ))}
              {!contacts.length ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/35">
                    Nenhum contato encontrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
