export default function ApiCreditsReturnPage({ searchParams }) {
  return (
    <main className="min-h-screen bg-[#050505] px-5 py-16 text-white">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-[#D7FF00]/35 bg-[#D7FF00]/10 p-8 text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-[#D7FF00] text-2xl font-black text-black">
          ✓
        </div>

        <h1 className="text-4xl font-black uppercase tracking-tight">
          Payment received
        </h1>

        <p className="mt-4 text-sm leading-7 text-white/55">
          Your API credits are being added to your NOVA account. This usually happens instantly after Stripe confirms the payment.
        </p>

        <a
          href="/dashboard/settings/api-keys"
          className="mt-8 inline-grid h-12 place-items-center rounded-2xl bg-[#D7FF00] px-7 text-xs font-black uppercase tracking-[.16em] text-black no-underline transition hover:bg-[#c8f000]"
        >
          Go to API Keys →
        </a>

        <p className="mt-5 text-xs text-white/25">
          Session: {String(searchParams?.session_id || "pending")}
        </p>
      </div>
    </main>
  );
}
