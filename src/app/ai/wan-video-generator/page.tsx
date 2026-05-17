import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Wan 2.2 AI Video Generator — NOVA AI",
  description: "Generate videos with Wan 2.2, the open-source AI video powerhouse. Text-to-video and image-to-video for ecommerce ads and social media. Try free on NOVA AI.",
  keywords: ["wan 2.2 video generator", "wan ai video", "open source video ai", "text to video ai", "image to video ai"],
  openGraph: {
    title: "Wan 2.2 AI Video Generator — NOVA AI",
    description: "Generate videos with Wan 2.2 open-source AI. Try free on NOVA AI.",
    url: "https://www.novvideos.online/ai/wan-video-generator",
  },
};

export default function WanVideoGeneratorPage() {
  return (
    <main className="min-h-screen bg-[#020303] text-white">
      <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-6 md:py-24">
        <div className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">AI Video Generator</div>
        <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] md:text-7xl">
          Wan 2.2<br />Video Generator
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60">
          Generate high-quality videos with Wan 2.2 — one of the most powerful open-source AI video models. Available on NOVA AI with text-to-video and image-to-video modes.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/sign-up" className="rounded-2xl bg-[#D7FF00] px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-black transition hover:bg-white">Try Free — 10 Credits</Link>
          <Link href="/explore" className="rounded-2xl border border-white/15 px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-white/70 transition hover:border-white/40 hover:text-white">See Examples</Link>
        </div>
        <section className="mt-20 grid gap-6 md:grid-cols-2">
          {[
            ["✦", "Text to Video", "Write a prompt and Wan 2.2 generates a detailed, high-quality video. Great for creative campaigns and product storytelling."],
            ["▧", "Image to Video", "Animate any product photo or image into a smooth video. Ideal for ecommerce and social media ads."],
          ].map(([icon, title, desc]) => (
            <div key={title} className="rounded-[1.5rem] border border-white/10 bg-[#070707] p-7">
              <div className="mb-4 text-2xl">{icon}</div>
              <h2 className="text-xl font-black uppercase tracking-[-0.04em]">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/50">{desc}</p>
            </div>
          ))}
        </section>
        <section className="mt-16">
          <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">What is Wan 2.2?</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/55">
            Wan 2.2 is a leading open-source AI video generation model known for its flexibility, quality, and strong community support. It delivers excellent results for both creative and commercial video production, making it a popular choice among developers, creators, and ecommerce brands. On NOVA AI, you can use Wan 2.2 without any technical setup — just describe your video and generate.
          </p>
        </section>
        <section className="mt-16 rounded-[1.5rem] border border-[#D7FF00]/20 bg-[#D7FF00]/5 p-8">
          <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">Try Wan 2.2 Free</h2>
          <p className="mt-3 text-base text-white/55">10 free credits on signup. No credit card required.</p>
          <Link href="/sign-up" className="mt-6 inline-block rounded-2xl bg-[#D7FF00] px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-black transition hover:bg-white">Try NOVA Free →</Link>
        </section>
      </div>
    </main>
  );
}
