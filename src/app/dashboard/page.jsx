"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function FalBalanceAlert() {
  const [balance, setBalance] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/me")
      .then(r => r.ok ? r.json() : { isAdmin: false })
      .then(d => {
        if (!d.isAdmin) { setLoading(false); return; }
        setIsAdmin(true);
        fetch("/api/admin/fal-balance")
          .then(r => r.ok ? r.json() : null)
          .then(b => {
            if (b && b.balance !== null) {
              setBalance(b.balance);
              setInputVal(String(b.balance));
            }
          })
          .finally(() => setLoading(false));
      })
      .catch(() => setLoading(false));
  }, []);

  async function saveBalance() {
    setSaving(true);
    const val = parseFloat(inputVal);
    if (!isNaN(val)) {
      await fetch("/api/admin/fal-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: val }),
      });
      setBalance(val);
    }
    setSaving(false);
    setEditing(false);
  }

  if (loading || !isAdmin) return null;

  const bal = typeof balance === "number" ? balance : 0;
  const critical = bal < 3;
  const low = bal < 10;

  const borderClass = critical
    ? "border-red-500/40 bg-red-500/10"
    : low
    ? "border-yellow-400/40 bg-yellow-400/10"
    : "border-white/10 bg-white/[.03]";
  const labelClass = critical ? "text-red-400" : low ? "text-yellow-300" : "text-white/40";
  const valueClass = critical ? "text-red-300" : low ? "text-yellow-300" : "text-[#D7FF00]";
  const label = critical ? "fal.ai balance CRITICAL" : low ? "fal.ai balance low" : "fal.ai balance";
  const msg = critical ? " — Recharge now!" : low ? " — Consider recharging soon." : "";

  return (
    <div className={"mx-8 mt-4 rounded-2xl border p-4 flex items-center justify-between gap-4 " + borderClass}>
      <div className="flex-1 min-w-0">
        <p className={"text-xs font-black uppercase tracking-wider mb-1 " + labelClass}>{label}</p>
        {editing ? (
          <div className="flex items-center gap-2">
            <span className="text-white/50 text-sm">$</span>
            <input
              autoFocus
              type="number"
              step="0.01"
              min="0"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") saveBalance(); if (e.key === "Escape") setEditing(false); }}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm w-28 outline-none focus:border-yellow-400/50"
            />
            <button onClick={saveBalance} disabled={saving}
              className="bg-[#D7FF00] text-black text-xs font-black uppercase px-3 py-1 rounded-lg hover:bg-[#c8f000] transition disabled:opacity-50">
              {saving ? "..." : "Save"}
            </button>
            <button onClick={() => setEditing(false)}
              className="text-white/40 text-xs font-black uppercase px-2 py-1 hover:text-white transition">
              Cancel
            </button>
          </div>
        ) : (
          <p className="text-sm text-white/60">
            Balance: <span className={"font-black " + valueClass}>${bal.toFixed(2)}</span>{msg}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!editing && (
          <button onClick={() => setEditing(true)}
            className="rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-black uppercase tracking-wider text-white/50 hover:text-white hover:border-white/20 transition">
            Update balance
          </button>
        )}
        <a href="https://fal.ai/dashboard/billing" target="_blank" rel="noopener noreferrer"
          className="rounded-xl bg-[#D7FF00] px-3 py-2 text-xs font-black uppercase tracking-wider text-black no-underline hover:bg-[#c8f000] transition">
          fal.ai
        </a>
      </div>
    </div>
  );
}

