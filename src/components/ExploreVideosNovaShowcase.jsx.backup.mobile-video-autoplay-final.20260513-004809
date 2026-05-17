"use client";

import { useMemo } from "react";
import MobileAutoPlayVideo from "@/components/MobileAutoPlayVideo";

const R2_BASE =
  "https://pub-c1436a1811c64a27a4f69459e98ad02a.r2.dev/explore/videos";

const rawVideos = [
  { id: 1, title: "Cinematic Product Ad" },
  { id: 2, title: "Luxury Motion" },
  { id: 3, title: "UGC Creative" },
  { id: 4, title: "Fashion Drop" },
  { id: 5, title: "Beauty Visual" },
  { id: 6, title: "Fast Promo" },
  { id: 7, title: "Lifestyle Scene" },
  { id: 8, title: "Product Reveal" },
  { id: 9, title: "Social Hook" },
  { id: 10, title: "Hero Creative" },
  { id: 11, title: "Brand Moment" },
  { id: 12, title: "Scroll Stopper" },
  { id: 13, title: "E-commerce Ad" },
  { id: 14, title: "Creator Style" },
  { id: 15, title: "Premium Product" },
  { id: 16, title: "Visual Hook" },
  { id: 17, title: "Ad Concept" },
  { id: 18, title: "Brand Story" },
  { id: 19, title: "Product Shot" },
  { id: 20, title: "Social Proof" },
  { id: 21, title: "Motion Design" },
  { id: 22, title: "AI Commercial" },
  { id: 23, title: "NOVA Creative" },
];

function getUniqueVideos() {
  const seen = new Set();

  return rawVideos
    .filter((video) => {
      if (seen.has(video.id)) return false;
      seen.add(video.id);
      return true;
    })
    .map((video) => ({
      ...video,
      src: `${R2_BASE}/${video.id}.mp4`,
    }));
}

function ExploreVideoCard({ video, index }) {
  return (
    <article className="group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-black shadow-[0_30px_90px_rgba(0,0,0,.45)] transition duration-500 hover:-translate-y-1 hover:border-[#D7FF00]/50">
      <MobileAutoPlayVideo
        src={video.src}
        className="aspect-[9/16] w-full bg-black object-cover opacity-95 transition duration-700 group-hover:scale-[1.04] group-hover:opacity-100"
        preload={index < 4 ? "auto" : "metadata"}
        pauseWhenOffscreen
        title={video.title}
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
  const videos = useMemo(() => getUniqueVideos(), []);

  return (
    <section
      id="nova-explore-videos-showcase"
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
              23 unique AI video examples in loop — product ads, UGC visuals and cinematic creatives generated for brands that move fast.
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
