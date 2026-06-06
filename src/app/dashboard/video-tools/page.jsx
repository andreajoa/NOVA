export default function VideoToolsPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <section className="mx-auto max-w-6xl">
        <a href="/dashboard" className="text-xs font-black uppercase tracking-[0.18em] text-white/35 no-underline hover:text-white">
          ← Dashboard
        </a>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-[#070707] p-6 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D7FF00]">NOVA Video Tools</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.08em] md:text-7xl">
            Extend Videos
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/55">
            Continue a generated video by extracting the last frame, generating the next scene, and concatenating the result. This page is prepared for the production R2 + FFmpeg worker.
          </p>

          <div className="mt-8 rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
            <p className="text-sm font-bold text-yellow-100">
              Production note: this feature should run as an async job, not as a single browser request. The API placeholder is ready at /api/video/extend.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
