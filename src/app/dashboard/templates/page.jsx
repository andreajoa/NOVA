"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const UGC_MODELS = [
  {
    key: "kling",
    mode: "image-to-video",
    label: "Kling 3.0",
    description: "Melhor para animação de produto com movimento realista",
    badge: "Recomendado",
  },
  {
    key: "seedance",
    mode: "image-to-video",
    label: "Seedance 2.0",
    description: "Audio nativo sincronizado, perfeito para anúncios com som",
    badge: "Com Áudio",
  },
  {
    key: "happyhorse",
    mode: "image-to-video",
    label: "Happy Horse",
    description: "Estilo criativo e expressivo para conteúdo de marca",
    badge: "",
  },
  {
    key: "wan",
    mode: "image-to-video",
    label: "Wan 2.2",
    description: "Open-source robusto, ótimo para volume de produção",
    badge: "",
  },
  {
    key: "lyra",
    mode: "image-to-video",
    label: "Lyra 2",
    description: "Alta fidelidade de movimento para produtos premium",
    badge: "Beta",
  },
  {
    key: "kling-avatar",
    mode: "lipsync",
    label: "Kling Avatar",
    description: "Gera avatar com lipsync — ideal para UGC com apresentador",
    badge: "Avatar",
  },
];

export default function UGCProdutoPage() {
  const router = useRouter();
  const [productFile, setProductFile] = useState(null);
  const [productPreview, setProductPreview] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [selectedModel, setSelectedModel] = useState(null);
  const productRef = useRef(null);
  const logoRef = useRef(null);

  function handleProduct(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setProductFile(f);
    setProductPreview(URL.createObjectURL(f));
  }

  function handleLogo(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
  }

  function handleGenerate() {
    if (!selectedModel) return;
    router.push("/dashboard/models/" + selectedModel.key + "/" + selectedModel.mode);
  }

  return (
    <div className="p-8 text-white min-h-screen">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D7FF00] mb-2">Criação</p>
      <h1 className="text-4xl font-black uppercase tracking-[-0.05em] mb-2">UGC Produto</h1>
      <p className="text-white/40 text-sm mb-10">Suba seu produto e logo, escolha o modelo e gere seu vídeo de anúncio.</p>

      {/* Upload row */}
      <div className="grid grid-cols-2 gap-6 mb-10 max-w-2xl">
        {/* Product */}
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-3">Produto / Cena</p>
          <label className="grid min-h-[180px] cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/[.025] transition hover:border-[#D7FF00]/50">
            {productPreview ? (
              productFile?.type?.startsWith("video/") ? (
                <video src={productPreview} className="h-full max-h-[180px] w-full object-cover rounded-2xl" />
              ) : (
                <img src={productPreview} alt="produto" className="h-full max-h-[180px] w-full object-cover rounded-2xl" />
              )
            ) : (
              <div className="text-center px-4">
                <p className="text-3xl text-white/20 mb-2">+</p>
                <p className="text-xs text-white/30">Imagem ou vídeo do produto</p>
              </div>
            )}
            <input ref={productRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleProduct} />
          </label>
        </div>

        {/* Logo */}
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-3">Logo (opcional)</p>
          <label className="grid min-h-[180px] cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/[.025] transition hover:border-[#D7FF00]/50">
            {logoPreview ? (
              <img src={logoPreview} alt="logo" className="h-full max-h-[180px] w-full object-contain p-4" />
            ) : (
              <div className="text-center px-4">
                <p className="text-3xl text-white/20 mb-2">+</p>
                <p className="text-xs text-white/30">Logo da marca</p>
              </div>
            )}
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
          </label>
        </div>
      </div>

      {/* Model selector */}
      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-4">Escolha o Modelo</p>
      <div className="grid grid-cols-3 gap-4 mb-10 max-w-4xl">
        {UGC_MODELS.map((m) => (
          <div
            key={m.key + m.mode}
            onClick={() => setSelectedModel(m)}
            className={[
              "rounded-2xl border p-5 cursor-pointer transition",
              selectedModel?.key === m.key && selectedModel?.mode === m.mode
                ? "border-[#D7FF00] bg-[#D7FF00]/10 shadow-[0_0_30px_rgba(215,255,0,0.12)]"
                : "border-white/10 bg-[#0D0D0D] hover:border-white/30",
            ].join(" ")}
          >
            {m.badge && (
              <span className="text-[9px] font-black uppercase tracking-wider bg-[#D7FF00] text-black px-2 py-0.5 rounded-full mb-3 inline-block">{m.badge}</span>
            )}
            <p className="font-black uppercase text-sm tracking-tight text-white mb-1">{m.label}</p>
            <p className="text-white/35 text-xs leading-relaxed">{m.description}</p>
          </div>
        ))}
      </div>

      <button
        onClick={handleGenerate}
        disabled={!selectedModel}
        className="h-14 rounded-2xl bg-[#D7FF00] px-9 text-sm font-black uppercase tracking-[.16em] text-black transition hover:bg-[#c8f000] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Gerar Vídeo UGC →
      </button>

      <footer className="mt-16 pt-8 border-t border-white/8 flex items-center justify-between">
        <p className="text-white/20 text-xs">© 2026 Nova AI · All rights reserved</p>
        <div className="flex gap-6">
          <a href="/pricing" className="text-white/20 text-xs hover:text-white transition">Pricing</a>
          <a href="/terms" className="text-white/20 text-xs hover:text-white transition">Terms</a>
          <a href="/privacy" className="text-white/20 text-xs hover:text-white transition">Privacy</a>
        </div>
      </footer>
    </div>
  );
}
