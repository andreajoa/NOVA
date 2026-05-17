"use client";

import Link from "next/link";

const HERO_VIDEO_URL = "https://pub-c1436a1811c64a27a4f69459e98ad02a.r2.dev/explore/Hero/1.mp4";


export default function HomeVideoHero() {

  return (
    <section className="relative min-h-[92svh] overflow-hidden bg-black text-white">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={HERO_VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />

      <div className="absolute inset-0 bg-black/65" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_24%,rgba(215,255,0,0.22),transparent_34%),radial-gradient(circle_at_80%_70%,rgba(215,255,0,0.10),transparent_32%)]" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#050505] to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[92svh] max-w-[1500px] items-center px-4 py-28 md:px-8">
        <div className="max-w-6xl">
          <div className="mb-5 inline-flex rounded-full border border-[#D7FF00]/35 bg-black/45 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#D7FF00] backdrop-blur-xl md:text-xs">
            The next era of AI video
          </div>

          <h1 className="max-w-6xl text-[clamp(3.15rem,10vw,10rem)] font-black uppercase leading-[0.84] tracking-[-0.095em]">
            <span className="block">The Future of</span>
            <span className="block font-black text-[#D7FF00] drop-shadow-[0_0_38px_rgba(215,255,0,0.42)]">
              Video Generation
            </span>
            <span className="block">Starts Here</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-white/68 md:mt-8 md:text-xl md:leading-8">
            Turn prompts, products and ideas into scroll-stopping AI videos for ads,
            creators and e-commerce — in minutes.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/generate"
              className="inline-flex justify-center rounded-2xl bg-[#D7FF00] px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-black no-underline transition hover:scale-[1.02] hover:bg-[#e3ff2f]"
            >
              Generate Video
            </Link>

            <Link
              href="/product-ad-generator"
              className="inline-flex justify-center rounded-2xl border border-white/16 bg-white/[0.04] px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-white no-underline backdrop-blur-xl transition hover:border-[#D7FF00]/60 hover:text-[#D7FF00]"
            >
              Watch Examples
            </Link>
          </div>

          <div className="mt-8 grid max-w-3xl grid-cols-2 gap-3 text-xs font-bold text-white/62 sm:grid-cols-4">
            {["10 free credits", "No studio needed", "Product ads", "Export MP4"].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-xl"
              >
                <span className="text-[#D7FF00]">✓</span> {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
