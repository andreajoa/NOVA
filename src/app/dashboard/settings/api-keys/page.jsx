"use client";
import { useState } from "react";
import Link from "next/link";

const demoKeys = [
  { id: 1, name: "Production",  key: "nva_prod_sk_xK9mP3tR7qL2nA5j", created: "Apr 12, 2026", lastUsed: "2 hours ago", status: "active" },
  { id: 2, name: "Development", key: "nva_dev_sk_bQ8wY1cF4vZ6dE0h",  created: "Mar 3, 2026",  lastUsed: "5 days ago",  status: "active" },
  { id: 3, name: "Old Staging", key: "nva_stg_sk_gH5sN9oT3uW7iX2k",  created: "Jan 7, 2026",  lastUsed: "Never",       status: "revoked" },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState(demoKeys);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [revealed, setRevealed] = useState(null);
  const [copied, setCopied] = useState(null);

  const revoke = (id) => setKeys(prev => prev.map(k => k.id === id ? {...k, status:"revoked"} : k));
  const copy = (id) => { setCopied(id); setTimeout(() => setCopied(null), 2000); };
  const create = () => {
    if (!newName.trim()) return;
    const rand = () => Math.random().toString(36).slice(2, 10);
    setKeys(prev => [...prev, { id: Date.now(), name: newName, key: "nva_new_sk_" + rand() + rand(), created: "Now", lastUsed: "Never", status: "active" }]);
    setNewName(""); setCreating(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard/settings" className="text-white/30 text-xs font-bold uppercase tracking-wider hover:text-white transition mb-6 inline-block no-underline">← Settings</Link>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">API Keys</h1>
            <p className="text-white/40 text-sm mt-1">Use para integrar Nova ao seu app ou pipeline</p>
          </div>
          <button onClick={() => setCreating(true)} className="bg-[#D7FF00] text-black text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-[#c8f000] transition">+ New Key</button>
        </div>
        <div className="bg-[#0D0D0D] border border-white/8 rounded-2xl p-5 mb-6 flex items-center gap-4">
          <span className="text-2xl">📖</span>
          <div>
            <p className="text-sm font-bold text-white">API Documentation</p>
            <p className="text-xs text-white/40 mt-0.5">Veja como usar a Nova API para gerar videos programaticamente</p>
          </div>
          <a href="#" className="ml-auto text-xs font-black uppercase tracking-wider text-[#D7FF00] hover:underline">View Docs</a>
        </div>
        {creating && (
          <div className="bg-[#0D0D0D] border border-[#D7FF00]/40 rounded-2xl p-5 mb-6">
            <p className="text-sm font-black uppercase tracking-wider text-[#D7FF00] mb-4">New API Key</p>
            <div className="flex gap-3">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Key name (ex: Production)"
                className="flex-1 bg-[#050505] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#D7FF00]/60" />
              <button onClick={create} className="bg-[#D7FF00] text-black text-xs font-black uppercase tracking-wider px-5 rounded-xl hover:bg-[#c8f000] transition">Create</button>
              <button onClick={() => setCreating(false)} className="text-white/30 text-xs hover:text-white transition px-3">Cancel</button>
            </div>
          </div>
        )}
        <div className="space-y-3">
          {keys.map(k => (
            <div key={k.id} className={"border rounded-2xl p-5 bg-[#0D0D0D] " + (k.status === "revoked" ? "border-white/5 opacity-50" : "border-white/8")}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-black text-white">{k.name}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">Created {k.created} · Last used {k.lastUsed}</p>
                </div>
                <span className={"text-[9px] font-black uppercase px-2 py-1 rounded-full " + (k.status === "active" ? "bg-green-500/15 text-green-400" : "bg-white/5 text-white/25")}>{k.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-[#050505] rounded-lg px-3 py-2 text-xs text-white/50 font-mono truncate">
                  {revealed === k.id ? k.key : k.key.slice(0,14) + "••••••••••••"}
                </code>
                <button onClick={() => setRevealed(revealed === k.id ? null : k.id)} className="text-[10px] font-bold text-white/30 hover:text-white transition px-2">{revealed === k.id ? "Hide" : "Show"}</button>
                <button onClick={() => copy(k.id)} className={"text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition " + (copied === k.id ? "bg-green-500/20 text-green-400" : "bg-white/8 text-white/50 hover:text-white")}>{copied === k.id ? "Copied!" : "Copy"}</button>
                {k.status === "active" && <button onClick={() => revoke(k.id)} className="text-[10px] font-bold text-red-400/60 hover:text-red-400 transition px-2">Revoke</button>}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 p-6 bg-[#0D0D0D] border border-white/8 rounded-2xl">
          <p className="text-xs font-black uppercase tracking-wider text-white/30 mb-4">Rate Limits — Plus Plan</p>
          <div className="grid grid-cols-3 gap-4">
            {[["60","Requests / min"],["500","Generations / month"],["4","Concurrent jobs"]].map(([v,l]) => (
              <div key={l}>
                <p className="text-[#D7FF00] text-2xl font-black">{v}</p>
                <p className="text-white/30 text-xs mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}