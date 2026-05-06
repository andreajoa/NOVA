"use client";
import Link from "next/link";

const plans = [
  { id:"free", name:"Free", price:"$0", credits:"10 cr total", active:true },
  { id:"starter", name:"Starter", price:"$5/mo", credits:"70 cr/mo", active:false },
  { id:"plus", name:"Plus", price:"$34/mo", credits:"500 cr/mo", active:false },
  { id:"ultra", name:"Ultra", price:"$119/mo", credits:"3,000 cr/mo", active:false },
];

const invoices = [
  { date:"May 1, 2026", desc:"Plus Plan – Monthly", amount:"$34.00", status:"Paid" },
  { date:"Apr 1, 2026", desc:"Plus Plan – Monthly", amount:"$34.00", status:"Paid" },
  { date:"Mar 1, 2026", desc:"Starter Plan – Monthly", amount:"$5.00", status:"Paid" },
];

export default function BillingPage() {
  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-1">Billing</h1>
      <p className="text-white/40 text-sm mb-8">Manage your subscription and payment history.</p>

      {/* Current Plan */}
      <div className="bg-[#D7FF00]/8 border border-[#D7FF00]/25 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-[#D7FF00] mb-1">Current Plan</p>
            <p className="text-2xl font-black text-white">Free</p>
            <p className="text-white/40 text-sm mt-1">10 total credits · No renewal</p>
          </div>
          <Link href="/pricing" className="bg-[#D7FF00] text-black text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-[#c8f000] transition no-underline">
            Upgrade Plan →
          </Link>
        </div>
      </div>

      {/* Credit balance */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[["Credits Left","10","of 10 total"],["Next Renewal","—","No active plan"],["Spent this month","0 cr","0 generations"]].map(([label,val,sub]) => (
          <div key={label} className="bg-[#0D0D0D] border border-white/8 rounded-2xl p-5">
            <p className="text-xs font-black uppercase tracking-wider text-white/30 mb-2">{label}</p>
            <p className="text-2xl font-black text-white">{val}</p>
            <p className="text-white/30 text-xs mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Plans */}
      <h2 className="text-sm font-black uppercase tracking-wider text-white/40 mb-4">Available Plans</h2>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {plans.map(p => (
          <div key={p.id} className={"rounded-xl border p-4 flex items-center justify-between " + (p.active ? "border-[#D7FF00]/40 bg-[#D7FF00]/5" : "border-white/8 bg-[#0D0D0D]")}>
            <div>
              <p className={"text-sm font-black " + (p.active ? "text-[#D7FF00]" : "text-white")}>{p.name}</p>
              <p className="text-white/40 text-xs">{p.credits}</p>
            </div>
            <div className="text-right">
              <p className="text-white font-black text-sm">{p.price}</p>
              {p.active
                ? <span className="text-[10px] text-[#D7FF00] font-bold">CURRENT</span>
                : <Link href="/pricing" className="text-[10px] text-white/40 hover:text-[#D7FF00] transition no-underline">Select →</Link>
              }
            </div>
          </div>
        ))}
      </div>

      {/* Invoices */}
      <h2 className="text-sm font-black uppercase tracking-wider text-white/40 mb-4">Payment History</h2>
      <div className="border border-white/8 rounded-2xl overflow-hidden">
        {invoices.map((inv,i) => (
          <div key={i} className={"flex items-center justify-between px-5 py-4 " + (i < invoices.length-1 ? "border-b border-white/8" : "")}>
            <div>
              <p className="text-white text-sm font-semibold">{inv.desc}</p>
              <p className="text-white/30 text-xs">{inv.date}</p>
            </div>
            <div className="text-right">
              <p className="text-white font-black text-sm">{inv.amount}</p>
              <span className="text-[10px] text-green-400 font-bold">{inv.status}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-[#0D0D0D] border border-white/8 rounded-xl flex items-center justify-between">
        <div>
          <p className="text-white/60 text-xs font-bold">Payment method</p>
          <p className="text-white/30 text-xs mt-0.5">No card on file</p>
        </div>
        <button className="text-xs text-[#D7FF00] font-bold border border-[#D7FF00]/30 px-4 py-2 rounded-lg hover:bg-[#D7FF00]/10 transition">Add card</button>
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