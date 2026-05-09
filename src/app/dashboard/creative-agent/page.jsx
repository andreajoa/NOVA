"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const quickPrompts = [
  "Crie uma campanha completa para vender esse produto com vídeos UGC, imagens e anúncios.",
  "Transforme esse produto em 10 prompts de imagem e 5 prompts de vídeo que vendem.",
  "Crie um funil criativo estilo Hormozi + branding premium para essa oferta.",
  "Monte um storyboard para um anúncio de 30 segundos com cenas para fal.ai.",
  "Crie uma estratégia de conteúdo para Reels/TikTok/YouTube Shorts por 30 dias.",
  "Crie prompts para um clipe musical completo usando a página Music Video da NOVA.",
];

const styleOptions = [
  "NOVA neon black/green",
  "Luxury commercial",
  "UGC creator",
  "Cinematic",
  "Cyberpunk",
  "Minimal premium",
  "High-converting product ads",
];

function routeWithPrompt(route, prompt) {
  if (!route) return "/dashboard/creative-agent";
  if (!prompt) return route;

  const glue = route.includes("?") ? "&" : "?";
  return `${route}${glue}prompt=${encodeURIComponent(prompt)}`;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/60 transition hover:border-[#D7FF00]/35 hover:text-[#D7FF00]"
    >
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

export default function CreativeAgentPage() {
  const [brand, setBrand] = useState("NOVA");
  const [product, setProduct] = useState("");
  const [goal, setGoal] = useState("Gerar vendas e desejo");
  const [audience, setAudience] = useState("");
  const [channel, setChannel] = useState("Reels, TikTok, YouTube Shorts e Ads");
  const [style, setStyle] = useState("NOVA neon black/green");
  const [language, setLanguage] = useState("pt-BR");

  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const estimatedPromptCount = useMemo(() => agent?.prompts?.length || 0, [agent]);

  async function send(customMessage = "") {
    const finalMessage = (customMessage || message).trim();
    if (!finalMessage || loading) return;

    setLoading(true);
    setError("");

    const nextHistory = [
      ...history,
      { role: "user", content: finalMessage },
    ];

    try {
      const res = await fetch("/api/creative-agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand,
          product,
          goal,
          audience,
          channel,
          style,
          language,
          message: finalMessage,
          messages: history,
          currentRoute: "/dashboard/creative-agent",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Claude Creative Agent failed.");
      }

      setAgent(data.agent);

      setHistory([
        ...nextHistory,
        { role: "assistant", content: data.agent?.answer || "" },
      ]);

      setMessage("");
    } catch (err) {
      setError(err?.message || "Claude Creative Agent failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020303] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8 md:py-10">
        <section className="relative overflow-hidden rounded-[2.3rem] border border-white/10 bg-[#070707] p-5 shadow-[0_0_110px_rgba(215,255,0,.08)] md:p-8">
          <div className="absolute -left-20 top-10 h-96 w-96 rounded-full bg-[#D7FF00]/14 blur-3xl" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/3 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative grid gap-8 xl:grid-cols-[0.85fr_1.15fr] xl:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D7FF00]">
                Claude × NOVA Creative Agent
              </p>
              <h1 className="mt-4 text-5xl font-black uppercase leading-[0.86] tracking-[-0.09em] md:text-7xl">
                Transforme ideias em campanhas prontas para gerar.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/55 md:text-base">
                Converse com Claude dentro da NOVA para criar estratégia, prompts, scripts, storyboards, campanhas e rotas de geração com fal.ai.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#D7FF00] px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-black">
                  Claude Brain
                </span>
                <span className="rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-white/55">
                  NOVA Execution
                </span>
                <span className="rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-white/55">
                  fal.ai Ready
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                <p className="text-3xl font-black text-[#D7FF00]">01</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/35">Estratégia</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                <p className="text-3xl font-black text-[#D7FF00]">{estimatedPromptCount}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/35">Prompts prontos</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                <p className="text-3xl font-black text-[#D7FF00]">AI</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/35">Creative Engine</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[430px_1fr]">
          <aside className="rounded-[2rem] border border-white/10 bg-[#070707] p-5 md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">
              Briefing
            </p>

            <div className="mt-5 grid gap-4">
              <label>
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Marca</span>
                <input value={brand} onChange={(e) => setBrand(e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-black/45 px-4 text-sm text-white outline-none focus:border-[#D7FF00]/50" />
              </label>

              <label>
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Produto / Oferta</span>
                <textarea value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Ex: perfume premium, tênis, curso, ebook, app, loja..." className="min-h-[100px] w-full resize-none rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-[#D7FF00]/50" />
              </label>

              <label>
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Objetivo</span>
                <input value={goal} onChange={(e) => setGoal(e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-black/45 px-4 text-sm text-white outline-none focus:border-[#D7FF00]/50" />
              </label>

              <label>
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Público</span>
                <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Ex: mulheres 25-45, empreendedores, ecommerce..." className="h-12 w-full rounded-xl border border-white/10 bg-black/45 px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#D7FF00]/50" />
              </label>

              <label>
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Canal</span>
                <input value={channel} onChange={(e) => setChannel(e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-black/45 px-4 text-sm text-white outline-none focus:border-[#D7FF00]/50" />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Estilo</span>
                  <select value={style} onChange={(e) => setStyle(e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-black/45 px-4 text-sm text-white outline-none focus:border-[#D7FF00]/50">
                    {styleOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Idioma</span>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-black/45 px-4 text-sm text-white outline-none focus:border-[#D7FF00]/50">
                    <option value="pt-BR">Português BR</option>
                    <option value="en">English</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#D7FF00]/25 bg-[#D7FF00]/10 p-4 text-xs leading-6 text-[#D7FF00]/85">
              Claude cria a estratégia e os prompts. A NOVA executa a geração nas rotas certas depois da sua aprovação.
            </div>
          </aside>

          <section className="rounded-[2rem] border border-white/10 bg-[#070707] p-5 md:p-6">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">
                Conversation
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.06em] text-white md:text-5xl">
                Creative command center.
              </h2>
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {quickPrompts.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => send(item)}
                  disabled={loading}
                  className="rounded-2xl border border-white/10 bg-black/35 p-4 text-left text-xs leading-5 text-white/55 transition hover:border-[#D7FF00]/40 hover:text-white disabled:opacity-40"
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/35 p-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Diga ao Claude o que você quer criar. Ex: crie uma campanha para vender esse perfume com 5 vídeos UGC e 10 imagens..."
                className="min-h-[140px] w-full resize-none rounded-2xl border border-white/10 bg-white/[.025] px-4 py-4 text-sm leading-7 text-white outline-none placeholder:text-white/25 focus:border-[#D7FF00]/45"
              />

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-white/35">
                  {loading ? "Claude está criando..." : "Pronto para criar campanha, prompts e rotas de geração."}
                </div>

                <button
                  type="button"
                  onClick={() => send()}
                  disabled={loading || !message.trim()}
                  className="rounded-2xl bg-[#D7FF00] px-6 py-4 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:scale-[1.01] disabled:opacity-40"
                >
                  {loading ? "Criando..." : "Enviar para Claude →"}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
                {error}
              </div>
            )}

            {agent && (
              <div className="mt-6 grid gap-5">
                <section className="rounded-[1.5rem] border border-[#D7FF00]/25 bg-[#D7FF00]/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D7FF00]">Resposta do Claude</p>
                  <p className="mt-3 text-sm leading-7 text-white/75">{agent.answer}</p>
                </section>

                {agent.campaign && (
                  <section className="rounded-[1.5rem] border border-white/10 bg-black/35 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D7FF00]">Campanha</p>
                    <h3 className="mt-3 text-3xl font-black uppercase tracking-[-0.06em] text-white">
                      {agent.campaign.name}
                    </h3>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <p className="rounded-2xl border border-white/10 bg-white/[.025] p-4 text-sm leading-6 text-white/55">
                        <b className="text-white">Posicionamento:</b> {agent.campaign.positioning}
                      </p>
                      <p className="rounded-2xl border border-white/10 bg-white/[.025] p-4 text-sm leading-6 text-white/55">
                        <b className="text-white">Público:</b> {agent.campaign.audience}
                      </p>
                      <p className="rounded-2xl border border-white/10 bg-white/[.025] p-4 text-sm leading-6 text-white/55">
                        <b className="text-white">Oferta:</b> {agent.campaign.offerAngle}
                      </p>
                      <p className="rounded-2xl border border-white/10 bg-white/[.025] p-4 text-sm leading-6 text-white/55">
                        <b className="text-white">Visual:</b> {agent.campaign.visualDirection}
                      </p>
                    </div>
                  </section>
                )}

                {agent.strategy?.length > 0 && (
                  <section className="rounded-[1.5rem] border border-white/10 bg-black/35 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D7FF00]">Estratégia</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {agent.strategy.map((item, index) => (
                        <div key={index} className="rounded-2xl border border-white/10 bg-white/[.025] p-4 text-sm leading-6 text-white/60">
                          <span className="mr-2 font-black text-[#D7FF00]">{String(index + 1).padStart(2, "0")}</span>
                          {item}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {agent.prompts?.length > 0 && (
                  <section className="rounded-[1.5rem] border border-white/10 bg-black/35 p-5">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D7FF00]">Prompts prontos</p>
                        <h3 className="mt-2 text-3xl font-black uppercase tracking-[-0.06em] text-white">
                          Pronto para executar na NOVA.
                        </h3>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {agent.prompts.map((item, index) => (
                        <article key={index} className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
                          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#D7FF00]">
                                {item.type} • {item.model}
                              </p>
                              <h4 className="mt-1 text-xl font-black text-white">{item.title}</h4>
                            </div>

                            <div className="flex gap-2">
                              <CopyButton text={item.prompt} />
                              <Link
                                href={routeWithPrompt(item.route, item.prompt)}
                                className="rounded-xl bg-[#D7FF00] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-black no-underline"
                              >
                                Usar →
                              </Link>
                            </div>
                          </div>

                          <p className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/35 p-4 text-sm leading-7 text-white/65">
                            {item.prompt}
                          </p>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                {agent.contentIdeas?.length > 0 && (
                  <section className="rounded-[1.5rem] border border-white/10 bg-black/35 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D7FF00]">Conteúdo</p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {agent.contentIdeas.map((item, index) => (
                        <article key={index} className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#D7FF00]">{item.format}</p>
                          <h4 className="mt-2 text-lg font-black text-white">{item.hook}</h4>
                          <p className="mt-2 text-sm leading-6 text-white/55">{item.script}</p>
                          <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-white/40">{item.cta}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                {agent.nextActions?.length > 0 && (
                  <section className="rounded-[1.5rem] border border-white/10 bg-black/35 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D7FF00]">Próximas ações</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {agent.nextActions.map((item, index) => (
                        <Link key={index} href={item.route || "/dashboard/creative-agent"} className="rounded-2xl border border-[#D7FF00]/25 bg-[#D7FF00]/10 p-4 text-white no-underline transition hover:bg-[#D7FF00] hover:text-black">
                          <p className="text-sm font-black uppercase">{item.label}</p>
                          <p className="mt-2 text-xs leading-5 opacity-70">{item.reason}</p>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
