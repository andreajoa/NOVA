"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { templates, categories } from "@/lib/templates";

export default function TemplatesPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = templates.filter(t => {
    const matchCat = activeCategory === "All" || t.category === activeCategory;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.tags.some(tag => tag.includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handleUse = (template) => {
    const params = new URLSearchParams({ prompt: template.prompt, from: template.id });
    router.push("/dashboard/models/" + template.model + "/" + template.mode + "?" + params.toString());
  };

  return (
    <div className="p-8 text-white min-h-full">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D7FF00] mb-2">Ready to use</p>
          <h1 className="text-4xl font-black uppercase tracking-[-0.05em]">Templates</h1>
          <p className="text-white/30 text-sm mt-2">{templates.length} prompt templates to accelerate your workflow</p>
        </div>
        {/* Search */}
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#D7FF00]/40 transition w-64"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={[
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition border",
              activeCategory === cat
                ? "bg-[#D7FF00] text-black border-[#D7FF00]"
                : "bg-transparent text-white/40 border-white/10 hover:border-white/30 hover:text-white"
            ].join(" ")}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-4">
        {filtered.map(template => (
          <TemplateCard key={template.id} template={template} onUse={() => handleUse(template)} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-4 text-center py-20 text-white/20 text-sm border border-dashed border-white/10 rounded-2xl">
            No templates found.
          </div>
        )}
      </div>


      <footer className="mt-16 pt-8 border-t border-white/8 flex items-center justify-between">
        <p className="text-white/20 text-xs">© 2026 Nova AI · All rights reserved</p>
        <div className="flex gap-6">
          <a href="/pricing" className="text-white/20 text-xs hover:text-white transition">Pricing</a>
          <a href="/terms" className="text-white/20 text-xs hover:text-white transition">Terms</a>
          <a href="/privacy" className="text-white/20 text-xs hover:text-white transition">Privacy</a>
          <a href="/contact" className="text-white/20 text-xs hover:text-white transition">Contact</a>
        </div>
      </footer>
    </div>
  );
}

function TemplateCard({ template, onUse }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0D0D0D] cursor-pointer transition-all hover:border-[#D7FF00]/40 hover:shadow-[0_0_30px_rgba(215,255,0,0.08)]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onUse}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <Image
          src={template.image}
          alt={template.title}
          width={400}
          height={300}
          className="w-full aspect-video object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="text-[9px] font-black uppercase tracking-wider bg-[#D7FF00] text-black px-2 py-1 rounded-full">
            {template.category}
          </span>
        </div>

        {/* Hover overlay */}
        <div className={["absolute inset-0 bg-[#D7FF00]/10 flex items-center justify-center transition-opacity duration-200", hovered ? "opacity-100" : "opacity-0"].join(" ")}>
          <div className="bg-[#D7FF00] text-black text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg">
            Use Template →
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-black uppercase text-sm tracking-tight text-white mb-1">{template.title}</h3>
        <p className="text-white/30 text-xs leading-relaxed mb-3">{template.description}</p>

        {/* Model + Mode */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#D7FF00]/70 bg-[#D7FF00]/10 border border-[#D7FF00]/20 px-2 py-0.5 rounded">
            {template.model}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-white/30 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
            {template.mode.replace(/-/g, " ")}
          </span>
        </div>

        {/* Tags */}
        <div className="flex gap-1 flex-wrap">
          {template.tags.map(tag => (
            <span key={tag} className="text-[9px] text-white/20 bg-white/5 px-2 py-0.5 rounded">#{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
