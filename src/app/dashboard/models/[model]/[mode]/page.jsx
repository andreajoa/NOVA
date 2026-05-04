"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { falModels } from "@/lib/falModels";

function GenerateContent() {
  const router = useRouter();
  const { model: modelKey, mode: modeKey } = useParams();
  const searchParams = useSearchParams();
  const model = falModels.video[modelKey];
  const modeData = model?.modes[modeKey];

  const [prompt, setPrompt] = useState(searchParams.get("prompt") || "");
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fromTemplate = searchParams.get("from");

  if (!model || !modeData) return <div className="p-8 text-white">Mode not found.</div>;

  const handleFiles = (e) => {
    const selected = [...e.target.files];
    setPreviews(selected.map(f => URL.createObjectURL(f)));
  };

  const handleGenerate = async () => {
    setLoading(true); setResult(null); setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: modeData.endpoint, prompt, model: modelKey, mode: modeKey }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-8 text-white max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-white/30 mb-8">
        {fromTemplate && (
          <>
            <span className="cursor-pointer hover:text-white" onClick={() => router.push("/dashboard/templates")}>Templates</span>
            <span>›</span>
          </>
        )}
        <span className="cursor-pointer hover:text-white" onClick={() => router.push("/dashboard/models")}>Models</span>
        <span>›</span>
        <span className="cursor-pointer hover:text-white" onClick={() => router.push("/dashboard/models/" + modelKey)}>{model.label}</span>
        <span>›</span>
        <span className="text-white/60">{modeData.label}</span>
      </div>

      {fromTemplate && (
        <div className="mb-6 flex items-center gap-3 bg-[#D7FF00]/8 border border-[#D7FF00]/20 rounded-xl px-4 py-3">
          <span className="text-[#D7FF00] text-xs">✦</span>
          <p className="text-[#D7FF00] text-xs font-bold uppercase tracking-wider">Template loaded — prompt is pre-filled, just upload your asset and generate</p>
        </div>
      )}

      <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D7FF00] mb-2">{model.label}</p>
      <h1 className="text-4xl font-black uppercase tracking-[-0.05em] mb-8">{modeData.label}</h1>

      {modeData.needsImage && (
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-3">Input Image / Video</p>
          <label className="flex flex-col items-center justify-center border border-dashed border-white/15 rounded-2xl p-10 cursor-pointer hover:border-[#D7FF00]/40 transition group">
            <input type="file" multiple accept="image/*,video/*" onChange={handleFiles} className="hidden" />
            {previews.length > 0
              ? <div className="flex gap-3 flex-wrap">{previews.map((url, i) => <img key={i} src={url} alt="" className="h-20 rounded-lg object-cover" />)}</div>
              : <div className="text-center"><p className="text-2xl text-white/20 mb-2">↑</p><p className="text-white/30 text-sm">Click to upload</p><p className="text-white/15 text-xs mt-1">Image or video</p></div>
            }
          </label>
        </div>
      )}

      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-3">Prompt</p>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Describe what you want to generate..."
          rows={5}
          className="w-full bg-[#0D0D0D] border border-white/10 rounded-2xl text-white text-sm p-5 resize-none outline-none placeholder:text-white/20 focus:border-[#D7FF00]/40 transition font-sans"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className={["px-8 py-4 rounded-xl text-sm font-black uppercase tracking-[0.08em] transition",
          loading ? "bg-white/10 text-white/30 cursor-not-allowed" : "bg-[#D7FF00] text-black hover:bg-[#c8f000]"
        ].join(" ")}
      >
        {loading ? "Generating..." : "Generate →"}
      </button>

      {error && <div className="mt-6 text-red-400 text-sm bg-red-950/30 border border-red-900/40 rounded-xl p-4">{error}</div>}

      {result && (
        <div className="mt-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-4">Result</p>
          <div className="rounded-2xl overflow-hidden border border-white/10">
            {(result.data?.url || result.url || "").includes(".mp4")
              ? <video src={result.data?.url || result.url} controls className="w-full" />
              : <img src={result.data?.url || result.url} alt="result" className="w-full" />}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="p-8 text-white/30">Loading...</div>}>
      <GenerateContent />
    </Suspense>
  );
}
