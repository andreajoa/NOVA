"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const tags = ["All", "Logo", "Product", "Colors", "Typography", "Other"];

function formatSize(bytes) {
  const n = Number(bytes) || 0;
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " MB";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + " KB";
  return n + " B";
}

export default function BrandKitPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState("All");
  const [uploading, setUploading] = useState(false);
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("#D7FF00");
  const [showColorForm, setShowColorForm] = useState(false);

  const loadAssets = useCallback(async () => {
    try {
      const res = await fetch("/api/brandkit");
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  const colors = assets.filter((a) => a.tag === "Colors" && a.hex_value);
  const filtered = activeTag === "All"
    ? assets.filter((a) => a.tag !== "Colors" || !a.hex_value)
    : assets.filter((a) => a.tag === activeTag);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const upRes = await fetch("/api/upload", { method: "POST", body: formData });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error || "Upload failed");

      const ext = file.name.split(".").pop()?.toUpperCase() || "";
      let tag = "Other";
      if (["SVG", "PNG", "JPG", "JPEG", "WEBP"].includes(ext)) {
        tag = file.name.toLowerCase().includes("logo") ? "Logo" : "Product";
      }
      if (["TTF", "OTF", "WOFF", "WOFF2"].includes(ext)) tag = "Typography";

      await fetch("/api/brandkit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name.replace(/\.[^.]+$/, ""),
          tag,
          fileType: ext,
          fileSize: String(file.size),
          url: upData.url || upData.publicUrl || "",
          r2Key: upData.key || upData.r2_key || "",
        }),
      });
      await loadAssets();
    } catch (err) {
      alert(err?.message || "Upload failed");
    }
    setUploading(false);
    e.target.value = "";
  }

  async function addColor() {
    if (!colorName.trim() || !colorHex.trim()) return;
    await fetch("/api/brandkit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: colorName.trim(),
        tag: "Colors",
        fileType: "COLOR",
        hexValue: colorHex.trim(),
      }),
    });
    setColorName("");
    setColorHex("#D7FF00");
    setShowColorForm(false);
    await loadAssets();
  }

  async function deleteAsset(id) {
    await fetch(`/api/brandkit?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="p-8 text-white min-h-screen bg-[#050505]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D7FF00] mb-1">Workspace</p>
          <h1 className="text-4xl font-black uppercase tracking-[-0.05em]">Brand Kit</h1>
          <p className="text-white/40 text-sm mt-1">Your brand assets, colors, and fonts in one place.</p>
        </div>
        <label className={`cursor-pointer bg-[#D7FF00] text-black text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-[#c8f000] transition ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          {uploading ? "Uploading..." : "+ Upload Asset"}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading}
            accept="image/*,.svg,.ttf,.otf,.woff,.woff2,.json,.pdf" />
        </label>
      </div>

      {/* Brand Colors */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-black uppercase tracking-wider text-white/30">Brand Colors</p>
          <button onClick={() => setShowColorForm(!showColorForm)}
            className="text-xs font-bold text-[#D7FF00] bg-transparent border-none cursor-pointer hover:underline">
            {showColorForm ? "Cancel" : "+ Add Color"}
          </button>
        </div>
        {showColorForm && (
          <div className="mb-4 flex items-end gap-3 p-4 rounded-xl border border-white/10 bg-white/[.03]">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-white/30 mb-1">Name</p>
              <input value={colorName} onChange={(e) => setColorName(e.target.value)} placeholder="e.g. Primary Yellow"
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/30 mb-1">Hex</p>
              <div className="flex items-center gap-2">
                <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                <input value={colorHex} onChange={(e) => setColorHex(e.target.value)}
                  className="w-24 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none" />
              </div>
            </div>
            <button onClick={addColor} className="bg-[#D7FF00] text-black text-xs font-black uppercase px-4 py-2.5 rounded-lg hover:bg-[#c8f000]">
              Add
            </button>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {colors.map((c) => (
            <div key={c.id} className="bg-[#0D0D0D] border border-white/8 rounded-2xl p-4 group relative">
              <div className="w-full h-14 rounded-xl mb-3 border border-white/10" style={{ background: c.hex_value }} />
              <p className="text-white text-xs font-black">{c.name}</p>
              <p className="text-white/30 text-xs font-mono mt-0.5">{c.hex_value}</p>
              <button onClick={() => deleteAsset(c.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 text-xs bg-transparent border-none cursor-pointer transition">
                ✕
              </button>
            </div>
          ))}
          {colors.length === 0 && !showColorForm && (
            <button onClick={() => setShowColorForm(true)}
              className="bg-[#0D0D0D] border border-dashed border-white/15 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 hover:border-[#D7FF00]/40 transition cursor-pointer">
              <span className="text-white/20 text-xl">+</span>
              <span className="text-white/30 text-[10px] font-bold">Add color</span>
            </button>
          )}
        </div>
      </section>

      {/* Assets */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-black uppercase tracking-wider text-white/30">Assets</p>
          <div className="flex gap-2">
            {tags.filter((t) => t !== "Colors").map((t) => (
              <button key={t} onClick={() => setActiveTag(t)}
                className={"text-xs font-bold px-3 py-1.5 rounded-lg transition border-none cursor-pointer " +
                  (activeTag === t ? "bg-[#D7FF00] text-black" : "text-white/40 hover:text-white bg-white/5")}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-white/30 text-sm">Loading assets...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((asset) => (
              <div key={asset.id}
                className="bg-[#0D0D0D] border border-white/8 rounded-2xl p-5 group hover:border-white/20 transition relative">
                {asset.url && /\.(png|jpg|jpeg|webp|svg|gif)$/i.test(asset.url) && (
                  <div className="mb-3 rounded-xl overflow-hidden border border-white/10 bg-black">
                    <img src={asset.url} alt={asset.name} className="w-full h-32 object-contain" />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 text-[10px] font-black shrink-0">
                      {asset.file_type}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-bold truncate">{asset.name}</p>
                      <p className="text-white/30 text-xs">{formatSize(asset.file_size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    {asset.url && (
                      <a href={asset.url} target="_blank" rel="noopener noreferrer"
                        className="text-white/30 hover:text-[#D7FF00] text-sm font-bold no-underline">↓</a>
                    )}
                    <button onClick={() => deleteAsset(asset.id)}
                      className="text-red-400/60 hover:text-red-400 text-xs bg-transparent border-none cursor-pointer">✕</button>
                  </div>
                </div>
              </div>
            ))}
            <label className="bg-[#0D0D0D] border border-dashed border-white/15 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 hover:border-[#D7FF00]/40 transition cursor-pointer">
              <span className="text-2xl text-white/20">+</span>
              <span className="text-white/30 text-xs font-bold">Upload asset</span>
              <input type="file" className="hidden" onChange={handleUpload} disabled={uploading}
                accept="image/*,.svg,.ttf,.otf,.woff,.woff2,.json,.pdf" />
            </label>
          </div>
        )}
      </section>
    </div>
  );
}
