import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Veo 3.1 AI Video Generator — NOVA AI",
  description: "Generate realistic videos with Veo 3.1 by Google DeepMind. Text-to-video and image-to-video AI for ecommerce ads, TikTok, Reels and Shorts. Try free on NOVA AI.",
  keywords: ["veo 3 video generator", "veo 3.1", "google deepmind video ai", "veo ai alternative", "text to video ai"],
  openGraph: {
    title: "Veo 3.1 AI Video Generator — NOVA AI",
    description: "Generate realistic videos with Veo 3.1 by Google DeepMind. Try free.",
    url: "https://www.novvideos.online/ai/veo-video-generator",
  },
};

export default function VeoVideoGeneratorPage() {
  return (
    <main className="min-h-screen bg-[#020303] text-white">
      <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-6 md:py-24">
        <div className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">AI Video Generator</div>
        <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] md:text-7xl">
          Veo 3.1<br />Video Generator
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60">
          Generate photorealistic videos with Veo 3.1 — Google DeepMind's most advanced AI video model. Text-to-video, image-to-video, and reference-to-video on NOVA AI.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/sign-up" className="rounded-2xl bg-[#D7FF00] px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-black transition hover:bg-white">Try Free — 10 Credits</Link>
          <Link href="/explore" className="rounded-2xl border border-white/15 px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-white/70 transition hover:border-white/40 hover:text-white">See Examples</Link>
        </div>
        <section className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            ["✦", "Text to Video", "Describe your scene and Veo 3.1 generates a photorealistic video with accurate physics and natural motion."],
            ["▧", "Image to Video", "Animate any product photo into a dynamic video. Great for ecommerce and social ads."],
            ["◈", "Reference to Video", "Use a reference image to guide style, composition, and motion of the generated video."],
          ].map(([icon, title, desc]) => (
            <div key={title} className="rounded-[1.5rem] border border-white/10 bg-[#070707] p-7">
              <div className="mb-4 text-2xl">{icon}</div>
              <h2 className="text-xl font-black uppercase tracking-[-0.04em]">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/50">{desc}</p>
            </div>
          ))}
        </section>
        <section className="mt-16">
          <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">What is Veo 3.1?</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/55">
            Veo 3.1 is Google DeepMind's latest AI video generation model, known for exceptional realism, accurate physics simulation, and high-fidelity motion. It is one of the most capable text-to-video models available today. Access Veo 3.1 on NOVA AI alongside Kling 3.0, Seedance 2.0, and other top models — starting free.
          </p>
        </section>
        <section className="mt-16 rounded-[1.5rem] border border-[#D7FF00]/20 bg-[#D7FF00]/5 p-8">
          <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">Try Veo 3.1 Free</h2>
          <p className="mt-3 text-base text-white/55">10 free credits on signup. No credit card required.</p>
          <Link href="/sign-up" className="mt-6 inline-block rounded-2xl bg-[#D7FF00] px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-black transition hover:bg-white">Try NOVA Free →</Link>
        </section>
      </div>
    </main>
  );
}
