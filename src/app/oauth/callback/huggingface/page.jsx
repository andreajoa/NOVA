"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const TOKEN_KEY = "nova_hf_access_token";
const EXPIRY_KEY = "nova_hf_token_expiry";
const VERIFIER_KEY = "nova_hf_pkce_verifier";
const STATE_KEY = "nova_hf_oauth_state";
const RETURN_KEY = "nova_hf_return_to";

export default function HuggingFaceOAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Ativando sua capacidade gratuita pessoal de vídeo...");

  useEffect(() => {
    let cancelled = false;

    async function complete() {
      const error = searchParams.get("error");
      const code = searchParams.get("code") || "";
      const state = searchParams.get("state") || "";
      const expectedState = sessionStorage.getItem(STATE_KEY) || "";
      const verifier = sessionStorage.getItem(VERIFIER_KEY) || "";
      const returnTo = sessionStorage.getItem(RETURN_KEY) || "/dashboard/free";

      if (error) {
        setMessage("A autorização foi cancelada. Você pode voltar ao NOVA e tentar novamente.");
        window.setTimeout(() => router.replace(returnTo), 1800);
        return;
      }

      if (!code || !state || !expectedState || state !== expectedState || !verifier) {
        setMessage("Não foi possível validar a autorização gratuita. Volte ao NOVA e tente novamente.");
        window.setTimeout(() => router.replace(returnTo), 2200);
        return;
      }

      try {
        const response = await fetch("/api/huggingface/oauth-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, code_verifier: verifier }),
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok || !payload?.success || !payload?.accessToken) {
          throw new Error(payload?.error || "Falha ao ativar capacidade gratuita.");
        }

        const expiresIn = Math.max(300, Number(payload.expiresIn || 8 * 60 * 60));
        sessionStorage.setItem(TOKEN_KEY, payload.accessToken);
        sessionStorage.setItem(EXPIRY_KEY, String(Date.now() + (expiresIn - 60) * 1000));
        sessionStorage.removeItem(VERIFIER_KEY);
        sessionStorage.removeItem(STATE_KEY);
        sessionStorage.removeItem(RETURN_KEY);

        if (!cancelled) {
          setMessage("Capacidade gratuita pessoal ativada. Voltando ao gerador...");
          window.setTimeout(() => router.replace(returnTo), 700);
        }
      } catch (err) {
        if (!cancelled) {
          setMessage(err?.message || "Não foi possível ativar a capacidade gratuita pessoal.");
        }
      }
    }

    complete();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020303] px-5 text-white">
      <section className="w-full max-w-xl rounded-[2rem] border border-[#D7FF00]/20 bg-[#080808] p-8 text-center">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D7FF00]">NOVA VIDEO FREE</p>
        <h1 className="mt-4 text-3xl font-black uppercase tracking-[-0.05em]">Capacidade gratuita</h1>
        <p className="mt-5 text-sm leading-7 text-white/55">{message}</p>
      </section>
    </main>
  );
}
