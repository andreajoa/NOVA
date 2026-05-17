import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kling 3.0 AI Video Generator — NOVA AI",
  description: "Generate cinematic videos with Kling 3.0 by Kuaishou. Text-to-video and image-to-video AI generation for ecommerce ads, TikTok, Reels and Shorts. Try free on NOVA AI.",
  keywords: ["kling ai video generator", "kling 3.0", "kling video generator online", "kling ai alternative", "text to video ai", "image to video ai"],
  openGraph: {
    title: "Kling 3.0 AI Video Generator — NOVA AI",
    description: "Generate cinematic videos with Kling 3.0. Try free — no credit card required.",
    url: "https://www.novvideos.online/ai/kling-video-generator",
  },
};

export default function KlingVideoGeneratorPage() {
  return (
    <main className="min-h-screen bg-[#020303] text-white">
      <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-6 md:py-24">

        <div className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">
          AI Video Generator
        </div>

        <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] md:text-7xl">
          Kling 3.0<br />Video Generator
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60">
          Generate pro-grade cinematic videos with Kling 3.0 by Kuaishou — one of the most powerful AI video models available. Available on NOVA AI with text-to-video and image-to-video modes.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/sign-up"
            className="rounded-2xl bg-[#D7FF00] px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-black transition hover:bg-white"
          >
            Try Free — 10 Credits
          </Link>
          <Link
            href="/explore"
            className="rounded-2xl border border-white/15 px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-white/70 transition hover:border-white/40 hover:text-white"
          >
            See Examples
          </Link>
        </div>

        <section className="mt-20 grid gap-6 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/10 bg-[#070707] p-7">
            <div className="mb-4 text-2xl">✦</div>
            <h2 className="text-xl font-black uppercase tracking-[-0.04em]">Text to Video</h2>
            <p className="mt-3 text-sm leading-7 text-white/50">
              Describe your scene in text and Kling 3.0 generates a high-quality video. Perfect for product ads, social media content, and creative campaigns.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-[#070707] p-7">
            <div className="mb-4 text-2xl">▧</div>
            <h2 className="text-xl font-black uppercase tracking-[-0.04em]">Image to Video</h2>
            <p className="mt-3 text-sm leading-7 text-white/50">
              Upload a product photo and animate it into a video. Ideal for ecommerce brands, Shopify stores, and Amazon sellers who want dynamic product content.
            </p>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">What is Kling AI?</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/55">
            Kling is an AI video generation model developed by Kuaishou, a leading Chinese technology company. Kling 3.0 is the latest version, offering high-fidelity motion, realistic physics, and cinematic quality output. It supports both text-to-video and image-to-video generation, making it one of the most versatile AI video tools available today.
          </p>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/55">
            On NOVA AI, you can access Kling 3.0 alongside other top models like Veo 3.1, Seedance 2.0, and PixVerse V6 — all in one platform, starting free.
          </p>
        </section>

        <section className="mt-16">
          <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">Use Cases</h2>
          <ul className="mt-6 grid gap-3 text-sm text-white/60 md:grid-cols-2">
            {[
              "Ecommerce product video ads",
              "TikTok and Instagram Reels content",
              "YouTube Shorts automation",
              "Shopify store video banners",
              "Amazon product listings",
              "UGC-style ad creatives",
              "Brand campaigns and commercials",
              "Social media content at scale",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <span className="text-[#D7FF00]">→</span> {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16">
          <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">Kling vs Other AI Video Models</h2>
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="px-5 py-4 text-left font-black uppercase tracking-[0.1em] text-white/50">Model</th>
                  <th className="px-5 py-4 text-left font-black uppercase tracking-[0.1em] text-white/50">Best For</th>
                  <th className="px-5 py-4 text-left font-black uppercase tracking-[0.1em] text-white/50">On NOVA</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Kling 3.0", "Cinematic quality, ecommerce ads", "✅"],
                  ["Veo 3.1", "Google DeepMind realism", "✅"],
                  ["Seedance 2.0", "ByteDance motion quality", "✅"],
                  ["PixVerse V6", "Stylized cinematic videos", "✅"],
                  ["Wan 2.2", "Open-source flexibility", "✅"],
                  ["Runway", "Creative studio workflows", "❌"],
                  ["Pika", "Simple consumer videos", "❌"],
                ].map(([model, best, onNova]) => (
                  <tr key={model} className="border-b border-white/5">
                    <td className="px-5 py-4 font-bold text-white">{model}</td>
                    <td className="px-5 py-4 text-white/50">{best}</td>
                    <td className="px-5 py-4">{onNova}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16 rounded-[1.5rem] border border-[#D7FF00]/20 bg-[#D7FF00]/5 p-8">
          <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">Start Generating with Kling 3.0</h2>
          <p className="mt-3 text-base text-white/55">
            Get 10 free credits on signup. No credit card required. Access Kling 3.0 and 8 other AI video models on NOVA AI.
          </p>
          <Link
            href="/sign-up"
            className="mt-6 inline-block rounded-2xl bg-[#D7FF00] px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-black transition hover:bg-white"
          >
            Try NOVA Free →
          </Link>
        </section>

      </div>
    </main>
  );
}
