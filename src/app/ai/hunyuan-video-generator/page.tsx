import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hunyuan Video AI Generator — NOVA AI",
  description: "Generate high-fidelity videos with Hunyuan Video by Tencent. Text-to-video AI for ecommerce ads and social media. Try free on NOVA AI.",
  keywords: ["hunyuan video generator", "hunyuan video ai", "tencent video ai", "text to video ai"],
  openGraph: {
    title: "Hunyuan Video AI Generator — NOVA AI",
    description: "Generate high-fidelity videos with Hunyuan Video. Try free on NOVA AI.",
    url: "https://www.novvideos.online/ai/hunyuan-video-generator",
  },
};

export default function HunyuanVideoGeneratorPage() {
  return (
    <main className="min-h-screen bg-[#020303] text-white">
      <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-6 md:py-24">
        <div className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">AI Video Generator</div>
        <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] md:text-7xl">
          Hunyuan Video<br />Generator
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60">
          Generate high-fidelity, smooth motion videos with Hunyuan Video — available on NOVA AI with text-to-video generation.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/sign-up" className="rounded-2xl bg-[#D7FF00] px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-black transition hover:bg-white">Try Free — 10 Credits</Link>
          <Link href="/explore" className="rounded-2xl border border-white/15 px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-white/70 transition hover:border-white/40 hover:text-white">See Examples</Link>
        </div>
        <section className="mt-20">
          <div className="rounded-[1.5rem] border border-white/10 bg-[#070707] p-7 max-w-lg">
            <div className="mb-4 text-2xl">✦</div>
            <h2 className="text-xl font-black uppercase tracking-[-0.04em]">Text to Video</h2>
            <p className="mt-3 text-sm leading-7 text-white/50">
              Describe your scene in text and Hunyuan Video generates a high-fidelity video with smooth, natural motion synthesis.
            </p>
          </div>
        </section>
        <section className="mt-16">
          <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">What is Hunyuan Video?</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/55">
            Hunyuan Video is a state-of-the-art AI video generation model known for its high-fidelity output and smooth motion synthesis. It produces detailed, realistic videos from text prompts, making it ideal for creative content, product showcases, and social media ads. Available on NOVA AI alongside Kling 3.0, Veo 3.1, Seedance 2.0, and more.
          </p>
        </section>
        <section className="mt-16 rounded-[1.5rem] border border-[#D7FF00]/20 bg-[#D7FF00]/5 p-8">
          <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">Try Hunyuan Video Free</h2>
          <p className="mt-3 text-base text-white/55">10 free credits on signup. No credit card required.</p>
          <Link href="/sign-up" className="mt-6 inline-block rounded-2xl bg-[#D7FF00] px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-black transition hover:bg-white">Try NOVA Free →</Link>
        </section>
      </div>
    </main>
  );
}
