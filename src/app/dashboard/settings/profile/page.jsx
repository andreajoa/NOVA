"use client";
import { useState } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const [name, setName] = useState("Andre Almeida");
  const [email, setEmail] = useState("info@nova.online");
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard/settings" className="text-white/30 text-xs font-bold uppercase tracking-wider hover:text-white transition mb-6 inline-block no-underline">← Settings</Link>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-8">Profile</h1>
        <div className="flex items-center gap-5 mb-10 p-6 bg-[#0D0D0D] border border-white/8 rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-[#D7FF00] flex items-center justify-center text-black text-2xl font-black">A</div>
          <div>
            <p className="text-white font-black text-sm">Andre Almeida</p>
            <p className="text-white/40 text-xs mt-0.5">Plus Plan · 500 credits remaining</p>
          </div>
          <button className="ml-auto text-xs font-bold uppercase tracking-wider border border-white/15 px-4 py-2 rounded-lg text-white/40 hover:text-white hover:border-white/40 transition">Change Photo</button>
        </div>
        <div className="space-y-5">
          {[{ label: "Full Name", value: name, set: setName },{ label: "Email Address", value: email, set: setEmail }].map(f => (
            <div key={f.label}>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-2">{f.label}</label>
              <input value={f.value} onChange={e => f.set(e.target.value)} className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#D7FF00]/60 transition" />
            </div>
          ))}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-2">Password</label>
            <input type="password" defaultValue="12345678" className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D7FF00]/60 transition" />
          </div>
          <button onClick={save} className={"w-full py-3 rounded-xl text-sm font-black uppercase tracking-wider transition " + (saved ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-[#D7FF00] text-black hover:bg-[#c8f000]")}>{saved ? "✓ Saved!" : "Save Changes"}</button>
        </div>
        <div className="mt-12 p-6 border border-red-500/20 rounded-2xl bg-red-500/5">
          <h3 className="text-red-400 font-black text-sm uppercase tracking-wider mb-2">Danger Zone</h3>
          <p className="text-white/30 text-xs mb-4">Deletar sua conta remove todos os dados permanentemente.</p>
          <button className="text-xs font-black uppercase tracking-wider text-red-400 border border-red-500/30 px-4 py-2 rounded-lg hover:bg-red-500/10 transition">Delete Account</button>
        </div>
      </div>
    </div>
  );
}