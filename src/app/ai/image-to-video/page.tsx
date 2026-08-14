import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Image to Video AI Generator — NOVA AI",
  description: "Animate any image into a video using the best AI models: Kling 3.0, Veo 3.1, Seedance 2.0, PixVerse V6 and more. Try free on NOVA AI — no credit card required.",
  keywords: ["image to video ai", "image to video generator", "animate image ai", "best image to video ai", "free image to video"],
  openGraph: {
    title: "Image to Video AI Generator — NOVA AI",
    description: "Animate any image into a video with Kling, Veo, Seedance, PixVerse and more. Try free.",
    url: "https://www.novvideos.online/ai/image-to-video",
  },
};

export default function ImageToVideoPage() {
  return (
    <main className="min-h-screen bg-[#020303] text-white">
      <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-6 md:py-24">
        <div className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">AI Video Generator</div>
        <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] md:text-7xl">
          Image to Video<br />AI Generator
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60">
          Turn any product photo or image into a dynamic video using the world&apos;s best AI models. Kling 3.0, Veo 3.1, Seedance 2.0, PixVerse V6 and more — all on NOVA AI. Start free.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/sign-up" className="rounded-2xl bg-[#D7FF00] px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-black transition hover:bg-white">Try Free — 10 Credits</Link>
          <Link href="/explore" className="rounded-2xl border border-white/15 px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-white/70 transition hover:border-white/40 hover:text-white">See Examples</Link>
        </div>
        <section className="mt-20">
          <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">Available Image-to-Video Models</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ["Kling 3.0", "Kuaishou", "Pro-grade cinematic animation from product photos."],
              ["Veo 3.1", "Google DeepMind", "Photorealistic animation with accurate physics."],
              ["Seedance 2.0", "ByteDance", "High-motion animation perfect for TikTok ads."],
              ["PixVerse V6", "PixVerse", "Cinematic, stylized animation for luxury and fashion brands."],
              ["Wan 2.2", "Open Source", "Flexible, high-quality animation from any image."],
              ["Happy Horse", "Alibaba", "Creative animation for ecommerce and brand content."],
            ].map(([model, company, desc]) => (
              <div key={model} className="rounded-[1.5rem] border border-white/10 bg-[#070707] p-6">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-black uppercase tracking-[-0.04em]">{model}</h3>
                  <span className="text-xs font-bold text-white/30 uppercase tracking-wider">{company}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/50">{desc}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-16">
          <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">How Image to Video Works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["1", "Upload your image", "Upload any product photo, illustration, or creative image."],
              ["2", "Choose your model", "Pick from Kling, Veo, Seedance, PixVerse and more."],
              ["3", "Generate and download", "Your animated video is ready in seconds."],
            ].map(([step, title, desc]) => (
              <div key={step} className="rounded-[1.5rem] border border-white/10 bg-[#070707] p-6">
                <div className="mb-3 text-3xl font-black text-[#D7FF00]">{step}</div>
                <h3 className="text-lg font-black uppercase tracking-[-0.04em]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/50">{desc}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-16">
          <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">Use Cases</h2>
          <ul className="mt-6 grid gap-3 text-sm text-white/60 md:grid-cols-2">
            {[
              "Animate product photos for ecommerce",
              "Create TikTok and Reels from images",
              "Shopify product video banners",
              "Amazon listing videos",
              "Fashion and beauty content",
              "Luxury brand video ads",
              "YouTube Shorts from photos",
              "Social media ads at scale",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <span className="text-[#D7FF00]">→</span> {item}
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-16 rounded-[1.5rem] border border-[#D7FF00]/20 bg-[#D7FF00]/5 p-8">
          <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">Start Animating Your Images</h2>
          <p className="mt-3 text-base text-white/55">10 free credits on signup. No credit card required. Access 6 image-to-video models on NOVA AI.</p>
          <Link href="/sign-up" className="mt-6 inline-block rounded-2xl bg-[#D7FF00] px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-black transition hover:bg-white">Try NOVA Free →</Link>
        </section>
      </div>
    </main>
  );
}
