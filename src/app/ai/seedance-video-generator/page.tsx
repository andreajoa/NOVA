import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Seedance 2.0 AI Video Generator — NOVA AI",
  description: "Generate videos with Seedance 2.0 by ByteDance. Text-to-video, image-to-video and reference-to-video AI for ecommerce ads and social media. Try free on NOVA AI.",
  keywords: ["seedance video generator", "seedance 2.0", "bytedance video ai", "text to video ai", "image to video ai"],
  openGraph: {
    title: "Seedance 2.0 AI Video Generator — NOVA AI",
    description: "Generate videos with Seedance 2.0 by ByteDance. Try free on NOVA AI.",
    url: "https://www.novvideos.online/ai/seedance-video-generator",
  },
};

export default function SeedanceVideoGeneratorPage() {
  return (
    <main className="min-h-screen bg-[#020303] text-white">
      <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-6 md:py-24">
        <div className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">AI Video Generator</div>
        <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] md:text-7xl">
          Seedance 2.0<br />Video Generator
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60">
          Generate stunning videos with Seedance 2.0 — ByteDance&apos;s flagship AI video model. Supports text-to-video, image-to-video, and reference-to-video on NOVA AI.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/sign-up" className="rounded-2xl bg-[#D7FF00] px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-black transition hover:bg-white">Try Free — 10 Credits</Link>
          <Link href="/explore" className="rounded-2xl border border-white/15 px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-white/70 transition hover:border-white/40 hover:text-white">See Examples</Link>
        </div>
        <section className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            ["✦", "Text to Video", "Write a prompt and Seedance 2.0 generates a high-motion, high-quality video optimized for social media and ads."],
            ["▧", "Image to Video", "Turn any product image into a dynamic video ad. Perfect for Shopify, Amazon, and TikTok content."],
            ["◈", "Reference to Video", "Guide the generation with a reference image to control style, lighting, and composition."],
          ].map(([icon, title, desc]) => (
            <div key={title} className="rounded-[1.5rem] border border-white/10 bg-[#070707] p-7">
              <div className="mb-4 text-2xl">{icon}</div>
              <h2 className="text-xl font-black uppercase tracking-[-0.04em]">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/50">{desc}</p>
            </div>
          ))}
        </section>
        <section className="mt-16">
          <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">What is Seedance 2.0?</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/55">
            Seedance 2.0 is ByteDance&apos;s flagship AI video generation model — the same company behind TikTok. It delivers high-motion, high-fidelity video output that is especially well-suited for social media content, short-form ads, and ecommerce creatives. On NOVA AI, you can access Seedance 2.0 alongside 8 other top video models in one platform.
          </p>
        </section>
        <section className="mt-16 rounded-[1.5rem] border border-[#D7FF00]/20 bg-[#D7FF00]/5 p-8">
          <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">Try Seedance 2.0 Free</h2>
          <p className="mt-3 text-base text-white/55">10 free credits on signup. No credit card required.</p>
          <Link href="/sign-up" className="mt-6 inline-block rounded-2xl bg-[#D7FF00] px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-black transition hover:bg-white">Try NOVA Free →</Link>
        </section>
      </div>
    </main>
  );
}
