"use client";
import { useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm() {
  const params = useSearchParams();
  const plan = params.get("plan") || "plus";
  const billing = params.get("billing") || "monthly";

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch("/api/checkout/plans/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, billing }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create session");
    return data.clientSecret;
  }, [plan, billing]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <a href="/pricing" className="text-xs font-black uppercase tracking-widest text-white/35 hover:text-white mb-6 block">
          ← Back to Pricing
        </a>
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white p-2">
          <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  );
}

export default function PlanCheckoutPage() {
  return (
    <Suspense>
      <CheckoutForm />
    </Suspense>
  );
}
