"use client";
export default function ProjectsPage() {
  return (
    <div className="p-8 text-white">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D7FF00] mb-2">Your work</p>
      <h1 className="text-4xl font-black uppercase tracking-[-0.05em] mb-8">Projects</h1>
      <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center text-white/20 text-sm">No projects yet. Start generating to save your work.</div>

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
