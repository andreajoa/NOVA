"use client";

import MobileAutoPlayVideo from "@/components/MobileAutoPlayVideo";

const R2_BASE =
  "https://pub-c1436a1811c64a27a4f69459e98ad02a.r2.dev/explore/videos";

const videos = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  src: `${R2_BASE}/${index + 1}.mp4`,
  title: [
    "Product Reveal",
    "Fashion Drop",
    "Luxury Detail",
    "Beauty Creative",
    "UGC Style",
    "Fast Promo",
    "Lifestyle Ad",
    "Product Motion",
    "Social Hook",
    "Hero Visual",
    "Brand Moment",
    "Ad Creative",
  ][index],
}));

export default function ProductAdVideoShowcase() {
  return (
    <section
      id="nova-video-showcase"
      className="relative overflow-hidden bg-[#030303] px-4 py-14 text-white md:px-8 md:py-20"
    >
      <div className="pointer-events-none absolute left-0 top-20 h-80 w-80 rounded-full bg-[#D7FF00]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-10 h-96 w-96 rounded-full bg-[#D7FF00]/10 blur-3xl" />

      <div className="relative mx-auto max-w-[1540px]">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D7FF00]">
              Created with NOVA
            </p>
            <h2 className="mt-3 max-w-4xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.08em] md:text-7xl">
              Product videos that stop the scroll.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50 md:text-base">
              Real product-style creatives, UGC vibes and ad visuals powered by NOVA.
            </p>
          </div>

          <a
            href="/dashboard/generate"
            className="inline-flex rounded-2xl bg-[#D7FF00] px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-black no-underline transition hover:scale-[1.02] hover:bg-[#e3ff2f]"
          >
            Create yours →
          </a>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video, index) => (
            <article
              key={video.id}
              className="group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-black shadow-[0_30px_90px_rgba(0,0,0,.45)] transition duration-500 hover:-translate-y-1 hover:border-[#D7FF00]/50"
            >
              <video
                src={video.src}
                className="aspect-[9/16] w-full bg-black object-cover opacity-95 transition duration-700 group-hover:scale-[1.04] group-hover:opacity-100"
                autoPlay
                muted
                loop
                playsInline
                preload={index < 4 ? "auto" : "metadata"}
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

              <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D7FF00]">
                  NOVA demo
                </p>
                <h3 className="mt-1 text-lg font-black uppercase tracking-[-0.04em] text-white">
                  {video.title}
                </h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
