import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PixVerse V6 AI Video Generator — NOVA AI",
  description: "Generate cinematic videos with PixVerse V6. Image-to-video AI for ecommerce ads, TikTok, Reels and Shorts. Try free on NOVA AI.",
  keywords: ["pixverse video generator", "pixverse v6", "pixverse ai", "cinematic video ai", "image to video ai"],
  openGraph: {
    title: "PixVerse V6 AI Video Generator — NOVA AI",
    description: "Generate cinematic videos with PixVerse V6. Try free on NOVA AI.",
    url: "https://www.novvideos.online/ai/pixverse-video-generator",
  },
};

export default function PixverseVideoGeneratorPage() {
  return (
    <main className="min-h-screen bg-[#020303] text-white">
      <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-6 md:py-24">
        <div className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">AI Video Generator</div>
        <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] md:text-7xl">
          PixVerse V6<br />Video Generator
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60">
          Generate cinematic, stylized videos with PixVerse V6 — one of the most visually impressive AI video models available. Animate your product photos into stunning video ads on NOVA AI.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/sign-up" className="rounded-2xl bg-[#D7FF00] px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-black transition hover:bg-white">Try Free — 10 Credits</Link>
          <Link href="/explore" className="rounded-2xl border border-white/15 px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-white/70 transition hover:border-white/40 hover:text-white">See Examples</Link>
        </div>
        <section className="mt-20">
          <div className="rounded-[1.5rem] border border-white/10 bg-[#070707] p-7 max-w-lg">
            <div className="mb-4 text-2xl">▧</div>
            <h2 className="text-xl font-black uppercase tracking-[-0.04em]">Image to Video</h2>
            <p className="mt-3 text-sm leading-7 text-white/50">
              Upload any product photo and PixVerse V6 animates it into a cinematic video. Perfect for luxury brands, fashion, beauty, and ecommerce product ads.
            </p>
          </div>
        </section>
        <section className="mt-16">
          <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">What is PixVerse V6?</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/55">
            PixVerse V6 is an AI video generation model specialized in cinematic, visually rich output. It excels at transforming static images into dynamic, high-quality videos with smooth motion and strong aesthetic quality. It is especially popular for luxury product ads, fashion content, and premium brand videos. Access PixVerse V6 on NOVA AI alongside Kling 3.0, Veo 3.1, and other top models.
          </p>
        </section>
        <section className="mt-16">
          <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">Use Cases</h2>
          <ul className="mt-6 grid gap-3 text-sm text-white/60 md:grid-cols-2">
            {[
              "Luxury product video ads",
              "Fashion and beauty content",
              "TikTok and Instagram Reels",
              "Ecommerce product animations",
              "Premium brand campaigns",
              "YouTube Shorts content",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <span className="text-[#D7FF00]">→</span> {item}
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-16 rounded-[1.5rem] border border-[#D7FF00]/20 bg-[#D7FF00]/5 p-8">
          <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">Try PixVerse V6 Free</h2>
          <p className="mt-3 text-base text-white/55">10 free credits on signup. No credit card required.</p>
          <Link href="/sign-up" className="mt-6 inline-block rounded-2xl bg-[#D7FF00] px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-black transition hover:bg-white">Try NOVA Free →</Link>
        </section>
      </div>
    </main>
  );
}
