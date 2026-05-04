"use client";
import { useState } from "react";

function maskKey(k) {
  return k.slice(0,10) + "••••••••••••••••••••" + k.slice(-4);
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([
    { id:1, name:"Production", key:"nv_live_sk_xK9mP2qRjLd8vNcT7wYhB3eA", created:"May 1, 2026", lastUsed:"Today" },
    { id:2, name:"Development", key:"nv_test_sk_aZ4nH6uXpQs1mJkE9rVbF2cW", created:"Apr 15, 2026", lastUsed:"3 days ago" },
  ]);
  const [copied, setCopied] = useState(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  function copy(key, id) {
    navigator.clipboard.writeText(key).catch(()=>{});
    setCopied(id);
    setTimeout(()=>setCopied(null), 2000);
  }

  function create(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    const newKey = { id:Date.now(), name:newName.trim(), key:"nv_live_sk_" + Math.random().toString(36).slice(2,30), created:"Today", lastUsed:"Never" };
    setKeys(k=>[...k, newKey]);
    setNewName("");
    setCreating(false);
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-1">API Keys</h1>
          <p className="text-white/40 text-sm">Use these keys to access the Nova API.</p>
        </div>
        <button onClick={()=>setCreating(v=>!v)} className="bg-[#D7FF00] text-black text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-[#c8f000] transition">
          + New Key
        </button>
      </div>

      {creating && (
        <form onSubmit={create} className="bg-[#0D0D0D] border border-[#D7FF00]/30 rounded-2xl p-5 mb-6 flex gap-3">
          <input
            autoFocus
            value={newName}
            onChange={e=>setNewName(e.target.value)}
            placeholder="Key name (e.g. My App)"
            className="flex-1 bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D7FF00]/60 transition"
          />
          <button type="submit" className="bg-[#D7FF00] text-black text-xs font-black uppercase px-5 py-2.5 rounded-xl hover:bg-[#c8f000] transition">Create</button>
          <button type="button" onClick={()=>setCreating(false)} className="text-white/30 text-xs px-3 hover:text-white transition">Cancel</button>
        </form>
      )}

      <div className="space-y-3">
        {keys.map(k => (
          <div key={k.id} className="bg-[#0D0D0D] border border-white/8 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white font-black text-sm">{k.name}</p>
                <p className="text-white/30 text-xs mt-0.5">Created {k.created} · Last used {k.lastUsed}</p>
              </div>
              <button onClick={()=>setKeys(keys.filter(x=>x.id!==k.id))} className="text-white/20 hover:text-red-400 transition text-xs font-bold">Revoke</button>
            </div>
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-[#111] border border-white/8 rounded-lg px-3 py-2 text-white/40 text-xs font-mono truncate">{maskKey(k.key)}</code>
              <button onClick={()=>copy(k.key, k.id)} className={"text-xs font-bold px-4 py-2 rounded-lg transition border " + (copied===k.id ? "text-[#D7FF00] border-[#D7FF00]/30 bg-[#D7FF00]/10" : "text-white/40 border-white/10 hover:text-white hover:border-white/20")}>
                {copied===k.id ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-5 bg-[#0D0D0D] border border-white/8 rounded-2xl">
        <p className="text-xs font-black uppercase tracking-wider text-white/30 mb-2">Docs</p>
        <p className="text-white/50 text-xs leading-relaxed mb-3">Use your API key in the Authorization header:</p>
        <code className="block bg-[#111] border border-white/8 rounded-lg px-4 py-3 text-[#D7FF00] text-xs font-mono">Authorization: Bearer nv_live_sk_...</code>
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