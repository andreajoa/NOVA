"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function UsagePill({ remaining, limit }) {
  return (
    <span className="rounded-full border border-[#D7FF00]/30 bg-[#D7FF00]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#D7FF00]">
      {remaining ?? "—"} / {limit ?? "—"} hoje
    </span>
  );
}

function AvailabilityPill({ available }) {
  return (
    <span
      className={
        "rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] " +
        (available
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
          : "border-white/10 bg-white/[.04] text-white/35")
      }
    >
      {available ? "Online" : "Em preparação"}
    </span>
  );
}

export default function FreeGenerationHub() {
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    fetch("/api/free-usage", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => data?.success && setUsage(data))
      .catch(() => {});
  }, []);

  const image = usage?.image || {
    remaining: 10,
    limit: 10,
    resolution: "1K",
    available: false,
  };
  const video = usage?.video || {
    remaining: 3,
    limit: 3,
    durations: [5],
    resolution: "480p",
    available: false,
  };

  return (
    <main className="min-h-screen bg-[#020303] text-white">
      <div className="mx-auto max-w-[1350px] px-4 py-6 md:px-6 md:py-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-[#D7FF00]/25 bg-[#070707] p-6 shadow-[0_0_100px_rgba(215,255,0,.08)] md:p-10">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-[#D7FF00]/14 blur-3xl" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="relative max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D7FF00]">NOVA AI · criação incluída</p>
            <h1 className="mt-4 text-5xl font-black uppercase leading-[0.86] tracking-[-0.08em] md:text-7xl">GERAR GRÁTIS AGORA</h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/52 md:text-base">
              Escolha imagem ou vídeo. As gerações incluídas usam 0 créditos e renovam diariamente.
            </p>
            {usage && (
              <p className="mt-3 text-xs text-white/30">
                Plano atual: <span className="font-black uppercase text-white/55">{usage.plan}</span>
              </p>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <article className="relative overflow-hidden rounded-[2rem] border border-[#D7FF00]/30 bg-[#080808] p-6 md:p-8">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D7FF00]/10 blur-3xl" />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#D7FF00] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-black">FREE</span>
                  <AvailabilityPill available={image.available} />
                </div>
                <UsagePill remaining={image.remaining} limit={image.limit} />
              </div>
              <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-[#D7FF00]">Imagem</p>
              <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.06em]">NOVA IMAGEM FREE</h2>
              <p className="mt-4 text-sm leading-7 text-white/48">Text to Image · {image.resolution || "1K"} · 1 imagem por geração · 0 créditos.</p>
              {image.available ? (
                <Link
                  href="/dashboard/models/nova-image-free/text-to-image"
                  className="mt-8 flex min-h-16 items-center justify-between rounded-2xl bg-[#D7FF00] px-5 text-sm font-black uppercase tracking-[0.12em] text-black no-underline"
                >
                  <span>Gerar imagem grátis</span>
                  <span>→</span>
                </Link>
              ) : (
                <div className="mt-8 flex min-h-16 items-center rounded-2xl border border-white/10 bg-white/[.035] px-5 text-sm font-black uppercase tracking-[0.12em] text-white/30">
                  Geração de imagem em preparação
                </div>
              )}
            </div>
          </article>

          <article className="relative overflow-hidden rounded-[2rem] border border-cyan-400/25 bg-[#080808] p-6 md:p-8">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#D7FF00] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-black">FREE</span>
                  <AvailabilityPill available={video.available} />
                </div>
                <UsagePill remaining={video.remaining} limit={video.limit} />
              </div>
              <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Vídeo</p>
              <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.06em]">NOVA VIDEO FREE</h2>
              <p className="mt-4 text-sm leading-7 text-white/48">
                {video.resolution || "480p"} · duração disponível: {(video.durations || [5]).map((n) => `${n}s`).join(" ou ")} · 0 créditos.
              </p>

              {video.available ? (
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/dashboard/models/nova-video-free/text-to-video"
                    className="flex min-h-16 items-center justify-between rounded-2xl bg-[#D7FF00] px-5 text-xs font-black uppercase tracking-[0.11em] text-black no-underline"
                  >
                    <span>Text to Video</span><span>→</span>
                  </Link>
                  <Link
                    href="/dashboard/models/nova-video-free/image-to-video"
                    className="flex min-h-16 items-center justify-between rounded-2xl border border-[#D7FF00]/30 bg-[#D7FF00]/10 px-5 text-xs font-black uppercase tracking-[0.11em] text-[#D7FF00] no-underline"
                  >
                    <span>Image to Video</span><span>→</span>
                  </Link>
                </div>
              ) : (
                <div className="mt-8 flex min-h-16 items-center rounded-2xl border border-white/10 bg-white/[.035] px-5 text-sm font-black uppercase tracking-[0.12em] text-white/30">
                  Geração de vídeo em preparação
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[.025] p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/40">Quer mais qualidade e volume?</p>
              <p className="mt-2 text-sm text-white/55">Os planos premium mantêm o acesso às opções NOVA incluídas e liberam modelos e créditos adicionais.</p>
            </div>
            <Link href="/pricing" className="rounded-xl border border-white/10 bg-white/[.06] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white no-underline">Ver planos →</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
