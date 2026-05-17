"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const starterCheckout = "/checkout/api-credits?pack=starter";

const toolExample = `POST https://www.novvideos.online/api/claude/tools/generate-image
Authorization: Bearer YOUR_NOVA_API_KEY
Content-Type: application/json

{
  "prompt": "Premium neon green product ad on black background, cinematic lighting",
  "model": "flux-pro",
  "mode": "text-to-image",
  "aspect_ratio": "1:1",
  "num_images": 2
}`;

const claudeInstruction = `You can use NOVA as my AI creative execution engine.

Rules:
- Ask me before spending NOVA API credits.
- Use my NOVA API key only for NOVA generation.
- If NOVA returns NOVA_API_CREDITS_REQUIRED, tell me I need to buy API credits with the minimum $10 starter pack.
- For images, call: https://www.novvideos.online/api/claude/tools/generate-image
- For videos, call: https://www.novvideos.online/api/claude/tools/generate-video
- For campaign prompts, call: https://www.novvideos.online/api/claude/tools/create-campaign`;

export default function ClaudeConnectorPage() {
  const router = useRouter();
  const [popup, setPopup] = useState(false);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState("");

  async function copy(text, key) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1300);
  }

  async function checkCreditsAndConnect() {
    setChecking(true);

    try {
      const res = await fetch("/api/me/api-credits", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        router.push("/sign-in?redirect_url=/claude");
        return;
      }

      const balance =
        Number(data?.balance ?? data?.apiCredits ?? data?.wallet?.balance ?? data?.currentApiCredits ?? 0);

      if (balance > 0) {
        router.push("/dashboard/settings/api-keys");
        return;
      }

      setPopup(true);
    } catch {
      setPopup(true);
    } finally {
      setChecking(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020303] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-8 md:px-8 md:py-12">
        <section className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#070707] p-6 shadow-[0_0_120px_rgba(215,255,0,.08)] md:p-10">
          <div className="absolute -left-24 top-10 h-96 w-96 rounded-full bg-[#D7FF00]/15 blur-3xl" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D7FF00]">
                NOVA × Claude AI
              </p>
              <h1 className="mt-4 text-5xl font-black uppercase leading-[0.86] tracking-[-0.09em] md:text-7xl">
                Connect Claude to NOVA.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/58 md:text-base">
                Use Claude as your creative brain and NOVA as your AI image/video execution engine. Claude plans, NOVA generates.
              </p>

              <div className="mt-6 rounded-2xl border border-[#D7FF00]/30 bg-[#D7FF00]/10 p-4 text-sm leading-7 text-[#D7FF00]/90">
                Requires a NOVA API key with paid API credits. Minimum API credit purchase: <b>$10</b>.
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={checkCreditsAndConnect}
                  disabled={checking}
                  className="rounded-2xl bg-[#D7FF00] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-black transition hover:scale-[1.02] disabled:opacity-50"
                >
                  {checking ? "Checking..." : "Connect using Claude AI →"}
                </button>

                <Link
                  href={starterCheckout}
                  className="rounded-2xl border border-[#D7FF00]/30 bg-[#D7FF00]/10 px-6 py-4 text-center text-xs font-black uppercase tracking-[0.14em] text-[#D7FF00] no-underline transition hover:bg-[#D7FF00] hover:text-black"
                >
                  Buy API Credits — $10
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-3xl font-black text-[#D7FF00]">01</p>
                <p className="mt-2 text-sm font-bold text-white">Buy NOVA API credits</p>
                <p className="mt-2 text-xs leading-5 text-white/42">Minimum $10 starter pack.</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-3xl font-black text-[#D7FF00]">02</p>
                <p className="mt-2 text-sm font-bold text-white">Create API key</p>
                <p className="mt-2 text-xs leading-5 text-white/42">Use it with Claude tools.</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-3xl font-black text-[#D7FF00]">03</p>
                <p className="mt-2 text-sm font-bold text-white">Generate via NOVA</p>
                <p className="mt-2 text-xs leading-5 text-white/42">Image, video and campaigns.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-[#070707] p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">Claude setup</p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.06em]">Paste this into Claude</h2>
            <p className="mt-3 text-sm leading-7 text-white/50">
              Use this instruction in Claude if your Claude environment supports external tools, MCP, API calls or connector workflows.
            </p>

            <pre className="mt-5 overflow-auto rounded-2xl border border-white/10 bg-black/55 p-4 text-xs leading-6 text-white/65">
              {claudeInstruction}
            </pre>

            <button
              type="button"
              onClick={() => copy(claudeInstruction, "instruction")}
              className="mt-4 rounded-xl bg-[#D7FF00] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-black"
            >
              {copied === "instruction" ? "Copied" : "Copy Claude Instructions"}
            </button>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#070707] p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">NOVA API Tool</p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.06em]">Example tool call</h2>
            <p className="mt-3 text-sm leading-7 text-white/50">
              This is the kind of NOVA API call Claude can make after you connect your API key.
            </p>

            <pre className="mt-5 overflow-auto rounded-2xl border border-white/10 bg-black/55 p-4 text-xs leading-6 text-white/65">
              {toolExample}
            </pre>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => copy(toolExample, "tool")}
                className="rounded-xl bg-[#D7FF00] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-black"
              >
                {copied === "tool" ? "Copied" : "Copy API Example"}
              </button>

              <Link
                href="/api/claude/manifest"
                className="rounded-xl border border-white/10 bg-white/[.04] px-5 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-white/60 no-underline hover:text-white"
              >
                View Manifest
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-[#070707] p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">Important</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
              <h3 className="text-xl font-black text-white">Claude plan support</h3>
              <p className="mt-2 text-sm leading-6 text-white/45">
                Claude must support external tools/connectors/MCP in the user’s plan or environment.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
              <h3 className="text-xl font-black text-white">NOVA billing</h3>
              <p className="mt-2 text-sm leading-6 text-white/45">
                NOVA execution requires NOVA API credits. Minimum top-up is $10.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
              <h3 className="text-xl font-black text-white">Claude does not generate</h3>
              <p className="mt-2 text-sm leading-6 text-white/45">
                Claude plans and calls tools. NOVA executes image/video generation through its API.
              </p>
            </div>
          </div>
        </section>
      </div>

      {popup && (
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/70 px-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[2rem] border border-[#D7FF00]/35 bg-[#070707] p-6 shadow-[0_0_100px_rgba(215,255,0,.18)]">
            <div className="mb-4 inline-flex rounded-full bg-[#D7FF00] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-black">
              API credits required
            </div>

            <h2 className="text-3xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-white">
              Buy NOVA API credits to connect Claude.
            </h2>

            <p className="mt-4 text-sm leading-7 text-white/55">
              To use NOVA inside Claude AI, you need a NOVA API key with paid API credits. Minimum purchase: <b className="text-[#D7FF00]">$10</b>.
            </p>

            <div className="mt-6 grid gap-3">
              <Link
                href={starterCheckout}
                onClick={() => setPopup(false)}
                className="rounded-2xl bg-[#D7FF00] px-5 py-4 text-center text-xs font-black uppercase tracking-[0.12em] text-black no-underline"
              >
                Buy API Credits — $10 →
              </Link>

              <button
                type="button"
                onClick={() => setPopup(false)}
                className="rounded-2xl border border-white/10 bg-white/[.04] px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-white/60"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
