"use client";
import { useState } from "react";
import Link from "next/link";

const invoices = [
  { date: "May 1, 2026",  amount: "$34.00", status: "paid", plan: "Plus Monthly" },
  { date: "Apr 1, 2026",  amount: "$34.00", status: "paid", plan: "Plus Monthly" },
  { date: "Mar 1, 2026",  amount: "$34.00", status: "paid", plan: "Plus Monthly" },
  { date: "Feb 1, 2026",  amount: "$34.00", status: "paid", plan: "Plus Monthly" },
];
const plans = [
  { id:"free",    name:"Free",    price:"$0",   credits:50,   color:"text-white/40",  border:"border-white/8",     current:false },
  { id:"starter", name:"Starter", price:"$5",   credits:70,   color:"text-green-400", border:"border-green-500/20",current:false },
  { id:"plus",    name:"Plus",    price:"$34",  credits:500,  color:"text-[#D7FF00]", border:"border-[#D7FF00]",   current:true },
  { id:"ultra",   name:"Ultra",   price:"$89",  credits:3000, color:"text-blue-400",  border:"border-blue-500/20", current:false },
];

export default function BillingPage() {
  const [tab, setTab] = useState("overview");
  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard/settings" className="text-white/30 text-xs font-bold uppercase tracking-wider hover:text-white transition mb-6 inline-block no-underline">← Settings</Link>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-8">Billing</h1>
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-8 w-fit">
          {[["overview","Overview"],["plan","Upgrade Plan"],["invoices","Invoices"]].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} className={"px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition " + (tab === id ? "bg-[#D7FF00] text-black" : "text-white/40 hover:text-white")}>{label}</button>
          ))}
        </div>
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="bg-[#0D0D0D] border border-[#D7FF00]/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#D7FF00] bg-[#D7FF00]/10 px-2 py-1 rounded-full">Current Plan</span>
                  <h2 className="text-2xl font-black mt-2">Plus</h2>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-[#D7FF00]">$34</p>
                  <p className="text-white/30 text-xs">/month</p>
                </div>
              </div>
              <div className="bg-[#050505] rounded-xl p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-white/40">Credits used this month</span>
                  <span className="text-xs font-black text-white">247 / 500</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#D7FF00] rounded-full" style={{width:"49.4%"}} />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setTab("plan")} className="flex-1 bg-[#D7FF00] text-black text-xs font-black uppercase tracking-wider py-2.5 rounded-xl hover:bg-[#c8f000] transition">Upgrade to Ultra</button>
                <button className="px-4 py-2.5 border border-white/15 rounded-xl text-xs font-bold text-white/40 hover:text-white hover:border-white/40 transition">Cancel Plan</button>
              </div>
            </div>
            <div className="bg-[#0D0D0D] border border-white/8 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-7 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-black">VISA</div>
                <div>
                  <p className="text-sm font-bold">**** **** **** 4242</p>
                  <p className="text-white/30 text-xs">Expires 12/27</p>
                </div>
              </div>
              <button className="text-xs font-bold text-white/30 hover:text-white transition">Change</button>
            </div>
            <div className="bg-[#0D0D0D] border border-white/8 rounded-2xl p-5">
              <p className="text-xs text-white/40">Next billing date</p>
              <p className="text-white font-black text-sm mt-1">June 1, 2026</p>
            </div>
          </div>
        )}
        {tab === "plan" && (
          <div className="grid gap-3">
            {plans.map(p => (
              <div key={p.id} className={"border rounded-2xl p-5 flex items-center justify-between bg-[#0D0D0D] " + p.border + (p.current ? " bg-[#D7FF00]/5" : "")}>
                <div>
                  <p className={"text-xs font-black uppercase tracking-wider " + p.color}>{p.name}</p>
                  <p className="text-white/40 text-xs mt-1">{p.credits.toLocaleString()} credits/month</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className={"text-xl font-black " + p.color}>{p.price}<span className="text-xs text-white/30 ml-1">/mo</span></p>
                  {p.current ? <span className="text-[10px] font-black uppercase px-3 py-1.5 rounded-lg bg-[#D7FF00]/20 text-[#D7FF00]">Current</span>
                    : <button className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg bg-white text-black hover:bg-[#D7FF00] transition">Select</button>}
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "invoices" && (
          <div className="bg-[#0D0D0D] border border-white/8 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/8">
                {["Date","Plan","Amount","Status",""].map(h => <th key={h} className="text-left py-4 px-5 text-[10px] font-black uppercase tracking-widest text-white/30">{h}</th>)}
              </tr></thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-4 px-5 text-white/60 text-xs">{inv.date}</td>
                    <td className="py-4 px-5 text-white text-xs font-bold">{inv.plan}</td>
                    <td className="py-4 px-5 text-white font-black text-xs">{inv.amount}</td>
                    <td className="py-4 px-5"><span className="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-green-500/15 text-green-400">{inv.status}</span></td>
                    <td className="py-4 px-5"><button className="text-[10px] font-bold text-white/30 hover:text-white transition uppercase tracking-wider">PDF</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}