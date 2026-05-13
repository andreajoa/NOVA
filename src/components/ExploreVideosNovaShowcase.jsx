"use client";

import { useEffect, useRef } from "react";

const R2_BASE =
  "https://pub-c1436a1811c64a27a4f69459e98ad02a.r2.dev/explore/videos-nova";

const videos = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  src: `${R2_BASE}/${index + 1}.mp4`,
  title: [
    "Cinematic Product Ad",
    "Luxury Motion",
    "UGC Creative",
    "Fashion Drop",
    "Beauty Visual",
    "Fast Promo",
    "Lifestyle Scene",
    "Product Reveal",
    "Social Hook",
    "Hero Creative",
    "Brand Moment",
    "Scroll Stopper",
  ][index],
}));

function ExploreVideoCard({ video, index }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <article className="group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-black shadow-[0_30px_90px_rgba(0,0,0,.45)] transition duration-500 hover:-translate-y-1 hover:border-[#D7FF00]/50">
      <video
        ref={videoRef}
        src={video.src}
        className="aspect-[9/16] w-full bg-black object-cover opacity-95 transition duration-700 group-hover:scale-[1.04] group-hover:opacity-100"
        autoPlay
        muted
        loop
        playsInline
        preload={index < 4 ? "auto" : "metadata"}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D7FF00]">
          NOVA Explore
        </p>
        <h3 className="mt-1 text-lg font-black uppercase tracking-[-0.04em] text-white">
          {video.title}
        </h3>
      </div>
    </article>
  );
}

export default function ExploreVideosNovaShowcase() {
  return (
    <section
      id="nova-explore-videos-nova-showcase"
      className="relative overflow-hidden bg-[#030303] px-4 py-14 text-white md:px-8 md:py-20"
    >
      <div className="pointer-events-none absolute left-0 top-20 h-80 w-80 rounded-full bg-[#D7FF00]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-10 h-96 w-96 rounded-full bg-[#D7FF00]/10 blur-3xl" />

      <div className="relative mx-auto max-w-[1540px]">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D7FF00]">
              Explore NOVA
            </p>
            <h2 className="mt-3 max-w-5xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.08em] md:text-7xl">
              See what NOVA can create.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50 md:text-base">
              Real AI video examples in loop — product ads, UGC visuals and cinematic creatives generated for brands that move fast.
            </p>
          </div>

          <a
            href="/dashboard/generate"
            className="inline-flex rounded-2xl bg-[#D7FF00] px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-black no-underline transition hover:scale-[1.02] hover:bg-[#e3ff2f]"
          >
            Generate yours →
          </a>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video, index) => (
            <ExploreVideoCard key={video.id} video={video} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
