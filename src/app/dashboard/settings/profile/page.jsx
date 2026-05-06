"use client";
import { useState } from "react";

export default function ProfilePage() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: "Nova Studio", email: "info@novvideos.online", bio: "" });

  function save(e) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-1">Profile</h1>
      <p className="text-white/40 text-sm mb-8">Manage your account identity and preferences.</p>

      <div className="flex items-center gap-5 mb-8 p-5 bg-[#0D0D0D] border border-white/8 rounded-2xl">
        <div className="w-16 h-16 rounded-full bg-[#D7FF00] flex items-center justify-center text-black text-2xl font-black flex-shrink-0">N</div>
        <div>
          <p className="text-white font-black">{form.name}</p>
          <p className="text-white/40 text-sm">{form.email}</p>
          <button className="mt-2 text-xs text-[#D7FF00] font-bold hover:underline">Change avatar</button>
        </div>
      </div>

      <form onSubmit={save} className="space-y-5">
        {[["Full name","name","text","Nova Studio"],["Email","email","email","info@novvideos.online"]].map(([label,field,type,ph]) => (
          <div key={field}>
            <label className="block text-xs font-black uppercase tracking-wider text-white/40 mb-2">{label}</label>
            <input
              type={type}
              value={form[field]}
              placeholder={ph}
              onChange={e => setForm({...form,[field]:e.target.value})}
              className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D7FF00]/60 transition"
            />
          </div>
        ))}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-white/40 mb-2">Bio</label>
          <textarea
            value={form.bio}
            onChange={e => setForm({...form,bio:e.target.value})}
            placeholder="Tell us about your brand..."
            rows={3}
            className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-[#D7FF00]/60 transition"
          />
        </div>
        <button type="submit" className="bg-[#D7FF00] text-black text-sm font-black uppercase tracking-wider px-8 py-3 rounded-xl hover:bg-[#c8f000] transition">
          {saved ? "✓ Saved!" : "Save changes"}
        </button>
      </form>

      <div className="mt-10 pt-8 border-t border-white/8">
        <h2 className="text-sm font-black uppercase tracking-wider text-white/40 mb-4">Danger Zone</h2>
        <button className="text-red-400 text-sm font-bold border border-red-400/30 px-5 py-2.5 rounded-xl hover:bg-red-400/10 transition">Delete account</button>
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