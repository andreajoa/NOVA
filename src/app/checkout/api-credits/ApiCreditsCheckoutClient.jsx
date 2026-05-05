"use client";

import { useCallback, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const PACKS = {
  starter: {
    label: "Starter",
    fullName: "API Credits Starter",
    price: "$10",
    credits: 140,
    perDollar: 14,
    tagline: "Minimum API top-up",
    bestFor: "Testing external API generation",
  },
  growth: {
    label: "Growth",
    fullName: "API Credits Growth",
    price: "$25",
    credits: 375,
    perDollar: 15,
    tagline: "Recommended starter upgrade",
    bestFor: "Light automation and early API usage",
  },
  pro: {
    label: "Pro",
    fullName: "API Credits Pro",
    price: "$50",
    credits: 800,
    perDollar: 16,
    tagline: "Better value for creators",
    bestFor: "Regular API workflows",
  },
  scale: {
    label: "Scale",
    fullName: "API Credits Scale",
    price: "$100",
    credits: 1750,
    perDollar: 17.5,
    tagline: "Best API credit value",
    bestFor: "Agencies, apps, and production workloads",
  },
};

const order = ["starter", "growth", "pro", "scale"];

function getNextPack(pack) {
  const index = order.indexOf(pack);
  if (index < 0) return "growth";
  return order[Math.min(index + 1, order.length - 1)];
}

function PackCard({ packKey, selected, highlighted, onSelect }) {
  const pack = PACKS[packKey];

  return (
    <button
      type="button"
      onClick={() => onSelect(packKey)}
      className={[
        "text-left rounded-3xl border p-5 transition",
        selected
          ? "border-[#D7FF00]/70 bg-[#D7FF00]/10 shadow-[0_0_45px_rgba(215,255,0,.12)]"
          : "border-white/10 bg-white/[.035] hover:border-[#D7FF00]/35 hover:bg-[#D7FF00]/5",
      ].join(" ")}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[.18em] text-white/35">
          {pack.label}
        </p>

        {highlighted && (
          <span className="rounded-full bg-[#D7FF00] px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] text-black">
            Recommended
          </span>
        )}
      </div>

      <p className="text-3xl font-black text-white">{pack.price}</p>
      <p className="mt-1 text-lg font-black text-[#D7FF00]">
        {pack.credits.toLocaleString()} API credits
      </p>

      <p className="mt-3 text-xs leading-5 text-white/40">{pack.tagline}</p>
      <p className="mt-2 text-xs leading-5 text-white/30">{pack.bestFor}</p>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
        <p className="text-[11px] font-bold text-white/35">Value</p>
        <p className="mt-1 text-sm font-black text-white">
          {pack.perDollar} credits per $1
        </p>
      </div>
    </button>
  );
}

function EmbeddedPayment({ packKey }) {
  const fetchClientSecret = useCallback(async () => {
    const res = await fetch("/api/checkout/api-credits/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pack: packKey }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to create checkout session");
    }

    return data.clientSecret;
  }, [packKey]);

  if (!stripePromise) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
        Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY. Add it to production environment.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white p-2">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ fetchClientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}

export default function ApiCreditsCheckoutClient({ initialPack = "starter" }) {
  const safeInitialPack = PACKS[initialPack] ? initialPack : "starter";
  const recommendedPack = getNextPack(safeInitialPack);

  const [selectedPack, setSelectedPack] = useState(recommendedPack);
  const [showPayment, setShowPayment] = useState(false);

  const selected = PACKS[selectedPack];

  const comparison = useMemo(() => {
    const original = PACKS[safeInitialPack];

    return {
      original,
      selected,
      extraCredits: selected.credits - original.credits,
    };
  }, [safeInitialPack, selected]);

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-10 text-white md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <a
            href="/dashboard/settings/api-keys"
            className="text-xs font-black uppercase tracking-[.16em] text-white/35 no-underline transition hover:text-white"
          >
            ← Back to API Keys
          </a>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
          <section className="rounded-[32px] border border-white/10 bg-white/[.035] p-6 md:p-8">
            <div className="mb-5 inline-flex rounded-full bg-[#D7FF00] px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-black">
              API Credits Checkout
            </div>

            <h1 className="max-w-3xl text-4xl font-black uppercase leading-none tracking-tight md:text-6xl">
              Power your NOVA API workflows.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50">
              API credits are prepaid and separate from dashboard credits. Use them with your NOVA API Key for external video, image, and AI generation.
            </p>

            {!showPayment && (
              <>
                <div className="mt-8 rounded-3xl border border-[#D7FF00]/30 bg-[#D7FF00]/10 p-5">
                  <p className="text-sm font-black text-[#D7FF00]">
                    Smart upgrade suggestion
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/55">
                    You came in with{" "}
                    <span className="font-black text-white">
                      {comparison.original.fullName}
                    </span>
                    . We recommend{" "}
                    <span className="font-black text-[#D7FF00]">
                      {PACKS[recommendedPack].fullName}
                    </span>{" "}
                    because it gives you more API runway and better value before your first external workflow hits limits.
                  </p>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <PackCard
                    packKey={safeInitialPack}
                    selected={selectedPack === safeInitialPack}
                    highlighted={false}
                    onSelect={setSelectedPack}
                  />

                  <PackCard
                    packKey={recommendedPack}
                    selected={selectedPack === recommendedPack}
                    highlighted={recommendedPack !== safeInitialPack}
                    onSelect={setSelectedPack}
                  />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {order
                    .filter((key) => key !== safeInitialPack && key !== recommendedPack)
                    .map((key) => (
                      <PackCard
                        key={key}
                        packKey={key}
                        selected={selectedPack === key}
                        highlighted={key === "scale"}
                        onSelect={setSelectedPack}
                      />
                    ))}
                </div>
              </>
            )}
          </section>

          <aside className="rounded-[32px] border border-white/10 bg-[#0D0D0D] p-6 md:p-7">
            <p className="text-xs font-black uppercase tracking-[.18em] text-white/30">
              Order summary
            </p>

            <div className="mt-5 rounded-3xl border border-[#D7FF00]/35 bg-[#D7FF00]/10 p-5">
              <p className="text-sm font-black text-white">{selected.fullName}</p>

              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-black text-[#D7FF00]">{selected.price}</p>
                  <p className="mt-1 text-xs font-bold text-white/35">one-time payment</p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-black text-white">
                    {selected.credits.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs font-bold text-white/35">API credits</p>
                </div>
              </div>
            </div>

            {comparison.extraCredits > 0 && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.035] p-4">
                <p className="text-xs leading-5 text-white/45">
                  You are getting{" "}
                  <span className="font-black text-[#D7FF00]">
                    +{comparison.extraCredits.toLocaleString()} more credits
                  </span>{" "}
                  than your original selection.
                </p>
              </div>
            )}

            <div className="mt-5 space-y-3 text-sm text-white/45">
              <div className="flex justify-between gap-3">
                <span>API credit pack</span>
                <span className="font-black text-white">{selected.price}</span>
              </div>

              <div className="flex justify-between gap-3">
                <span>Billing type</span>
                <span className="font-black text-white">One-time</span>
              </div>

              <div className="flex justify-between gap-3">
                <span>Total today</span>
                <span className="font-black text-[#D7FF00]">{selected.price}</span>
              </div>
            </div>

            {!showPayment ? (
              <button
                onClick={() => setShowPayment(true)}
                className="mt-6 h-12 w-full rounded-2xl bg-[#D7FF00] text-xs font-black uppercase tracking-[.16em] text-black transition hover:bg-[#c8f000]"
              >
                Continue to secure payment →
              </button>
            ) : (
              <div className="mt-6">
                <button
                  onClick={() => setShowPayment(false)}
                  className="mb-4 text-xs font-black uppercase tracking-[.16em] text-white/35 transition hover:text-white"
                >
                  ← Edit package
                </button>

                <EmbeddedPayment packKey={selectedPack} />
              </div>
            )}

            <p className="mt-5 text-xs leading-5 text-white/30">
              Secure payment powered by Stripe. Your credits are added automatically after payment confirmation.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
