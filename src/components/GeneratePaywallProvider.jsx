"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function normalizePaywallPayload(data) {
  return {
    ...data,
    code: data?.code || "INSUFFICIENT_CREDITS",
    error: data?.error || "INSUFFICIENT_CREDITS",
    message:
      data?.message ||
      "Saldo insuficiente para gerar. Faça upgrade para continuar.",
    plans: data?.plans || {
      annual: {
        label: "Annual",
        price: "$5/mo",
        href: "/checkout/plan?plan=basic&billing=annual",
      },
      monthly: {
        label: "Monthly",
        price: "$7/mo",
        href: "/checkout/plan?plan=basic&billing=monthly",
      },
    },
  };
}

function shouldShowPaywall(response, data, url) {
  if (!String(url || "").includes("/api/generate")) return false;

  const msg = String(data?.error || data?.message || "").toLowerCase();

  return (
    response.status === 402 ||
    response.status === 403 ||
    data?.code === "INSUFFICIENT_CREDITS" ||
    data?.code === "IMAGE_TRIAL_LIMIT_REACHED" ||
    msg.includes("forbidden") ||
    msg.includes("insufficient") ||
    msg.includes("saldo insuficiente")
  );
}

export default function GeneratePaywallProvider({ children = null } = {}) {
  const [paywall, setPaywall] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      try {
        const url = typeof args[0] === "string" ? args[0] : args[0]?.url;

        if (String(url || "").includes("/api/generate")) {
          const cloned = response.clone();
          const data = await cloned.json().catch(() => ({}));

          if (shouldShowPaywall(response, data, url)) {
            setPaywall(normalizePaywallPayload(data));
          }
        }
      } catch {
        // Nunca quebra a geração por causa do popup.
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <>
      {children}

      {paywall && (
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/75 px-4 backdrop-blur-md">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-[#D7FF00]/35 bg-[#070707] p-6 text-white shadow-[0_0_120px_rgba(215,255,0,.18)] md:p-8">
            <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-[#D7FF00]/15 blur-3xl" />
            <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-fuchsia-500/12 blur-3xl" />

            <div className="relative">
              <div className="mb-4 inline-flex rounded-full bg-[#D7FF00] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-black">
                Saldo insuficiente
              </div>

              <h2 className="text-3xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-white md:text-5xl">
                Você precisa de créditos para continuar.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-white/55 md:text-base">
                {paywall.message.includes("Forbidden")
                  ? "Saldo insuficiente para gerar. Escolha um plano para liberar mais gerações, mais qualidade e modelos premium."
                  : paywall.message}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link
                  href={paywall?.plans?.annual?.href || "/pricing"}
                  onClick={() => setPaywall(null)}
                  className="rounded-2xl bg-[#D7FF00] px-5 py-4 text-black no-underline transition hover:scale-[1.02]"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.16em]">
                    Melhor valor
                  </p>
                  <p className="mt-1 text-3xl font-black">
                    {paywall?.plans?.annual?.price || "Ver planos"}
                  </p>
                  <p className="mt-1 text-xs font-bold text-black/60">
                    Assinatura anual
                  </p>
                </Link>

                <Link
                  href={paywall?.plans?.monthly?.href || "/pricing"}
                  onClick={() => setPaywall(null)}
                  className="rounded-2xl border border-white/10 bg-white/[.04] px-5 py-4 text-white no-underline transition hover:bg-white/[.08]"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
                    Flexível
                  </p>
                  <p className="mt-1 text-3xl font-black">
                    {paywall?.plans?.monthly?.price || "Mensal"}
                  </p>
                  <p className="mt-1 text-xs font-bold text-white/40">
                    Cancele quando quiser
                  </p>
                </Link>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href="/pricing"
                  onClick={() => setPaywall(null)}
                  className="text-sm font-black uppercase tracking-[0.12em] text-[#D7FF00] no-underline hover:underline"
                >
                  Ver todos os planos →
                </Link>

                <button
                  type="button"
                  onClick={() => setPaywall(null)}
                  className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/60 transition hover:text-white"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
