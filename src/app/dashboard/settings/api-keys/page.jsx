"use client";

import { useEffect, useMemo, useState } from "react";

function formatUnix(value) {
  if (!value) return "Never";

  try {
    return new Date(Number(value) * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Unknown";
  }
}

function maskKey(key) {
  return `${key.keyPrefix}••••••••••••••••••••••••${key.keySuffix}`;
}

const fallbackPacks = {
  starter: { label: "Starter", price: "$10", credits: 140, href: "/checkout/api-credits?pack=starter" },
  growth: { label: "Growth", price: "$25", credits: 375, href: "/checkout/api-credits?pack=growth" },
  pro: { label: "Pro", price: "$50", credits: 800, href: "/checkout/api-credits?pack=pro" },
  scale: { label: "Scale", price: "$100", credits: 1750, href: "/checkout/api-credits?pack=scale" },
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([]);
  const [apiWallet, setApiWallet] = useState({ balance: 0, packs: fallbackPacks });
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newSecret, setNewSecret] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const activeCount = useMemo(() => keys.length, [keys]);
  const packs = apiWallet?.packs || fallbackPacks;

  async function loadKeys() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/api-keys", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to load API keys");

      setKeys(data.keys || []);
    } catch (err) {
      setError(err.message || "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }

  async function loadApiWallet() {
    setWalletLoading(true);

    try {
      const res = await fetch("/api/me/api-credits", { cache: "no-store" });
      const data = await res.json();

      if (res.ok) {
        setApiWallet({
          balance: Number(data.balance || 0),
          packs: data.packs || fallbackPacks,
        });
      }
    } catch {
    } finally {
      setWalletLoading(false);
    }
  }

  useEffect(() => {
    // loadKeys/loadApiWallet são async: o setState acontece na continuação da
    // promise, não no corpo síncrono do efeito.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadKeys();
    loadApiWallet();
  }, []);

  async function createKey(e) {
    e.preventDefault();

    const name = newName.trim();
    if (!name || busy) return;
setBusy(true);
    setError("");
    setCopied(false);

    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || data.error || "Failed to create API key");

      setKeys((current) => [data.key, ...current]);
      setNewSecret({ name, secret: data.secret });
      setNewName("");
      setCreating(false);
    } catch (err) {
      setError(err.message || "Failed to create API key");
    } finally {
      setBusy(false);
    }
  }

  async function revokeKey(id) {
    if (busy) return;

    const confirmed = window.confirm("Revoke this API key? This cannot be undone.");
    if (!confirmed) return;

    setBusy(true);
    setError("");

    try {
      const res = await fetch(`/api/api-keys/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to revoke API key");

      setKeys((current) => current.filter((key) => key.id !== id));
    } catch (err) {
      setError(err.message || "Failed to revoke API key");
    } finally {
      setBusy(false);
    }
  }

  async function copySecret(secret) {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-[.22em] text-[#D7FF00]">
            Developer Settings
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
            API Keys
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
            Create API keys for external NOVA usage. Creating a key is free; API credits are only used when generating from external tools like Claude AI.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Rota de API que devolve HTML do servidor — next/link quebraria. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/api-keys/claude-direct"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D7FF00]/40 px-5 text-xs font-black uppercase tracking-[.14em] text-[#D7FF00] no-underline transition hover:bg-[#D7FF00]/10"
          >
            Claude API Key
          </a>

          <button
            onClick={() => setCreating((value) => !value)}
            className="h-11 rounded-xl bg-[#D7FF00] px-5 text-xs font-black uppercase tracking-[.14em] text-black transition hover:bg-[#c8f000]"
          >
            + New Key
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-[#D7FF00]/30 bg-[#D7FF00]/10 p-5">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#D7FF00]/70">API balance</p>
          <p className="mt-3 text-3xl font-black text-[#D7FF00]">
            {walletLoading ? "..." : apiWallet.balance}
          </p>
          <p className="mt-1 text-xs font-bold text-white/35">API credits</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
          <p className="text-xs font-black uppercase tracking-[.16em] text-white/30">Active keys</p>
          <p className="mt-3 text-3xl font-black text-white">{activeCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
          <p className="text-xs font-black uppercase tracking-[.16em] text-white/30">Database</p>
          <p className="mt-3 text-lg font-black text-[#D7FF00]">Cloudflare D1</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
          <p className="text-xs font-black uppercase tracking-[.16em] text-white/30">API cost</p>
          <p className="mt-3 text-lg font-black text-white">24 credits/sec</p>
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-white/10 bg-[#0D0D0D] p-5">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-white">Add API Credits</p>
            <p className="mt-1 text-xs leading-5 text-white/40">
              Use API credits with your NOVA API Key for external video, image, and AI generation.
            </p>
          </div>
          <p className="text-xs font-bold text-white/30">Minimum top-up: $10</p>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {Object.entries(packs).map(([key, pack]) => (
            <a
              key={key}
              href={pack.href}
              className="rounded-2xl border border-white/10 bg-white/[.035] p-4 text-white no-underline transition hover:border-[#D7FF00]/50 hover:bg-[#D7FF00]/10"
            >
              <p className="text-xs font-black uppercase tracking-[.16em] text-white/35">
                {pack.label}
              </p>
              <p className="mt-3 text-2xl font-black text-white">{pack.price}</p>
              <p className="mt-1 text-sm font-black text-[#D7FF00]">
                {pack.credits} credits
              </p>
              <p className="mt-3 text-[11px] font-bold text-white/30">One-time payment</p>
            </a>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-[#D7FF00]/30 bg-[#D7FF00]/10 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#D7FF00]">Need a Claude connector key?</p>
            <p className="mt-1 text-xs leading-5 text-white/50">
              Use the direct generator. It creates the full API key and shows the exact Claude connector URL.
            </p>
          </div>
          {/* Rota de API que devolve HTML do servidor — next/link quebraria. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/api-keys/claude-direct"
            className="rounded-xl bg-[#D7FF00] px-5 py-3 text-center text-xs font-black uppercase tracking-[.14em] text-black no-underline transition hover:bg-[#c8f000]"
          >
            Generate Claude API Key
          </a>
        </div>
      </div>

      {creating && (
        <form
          onSubmit={createKey}
          className="mb-6 rounded-2xl border border-[#D7FF00]/30 bg-[#0D0D0D] p-5"
        >
          <p className="mb-2 text-sm font-black text-white">Create a new API key</p>
          <p className="mb-4 text-xs text-white/35">
            Creating an API key is free. API credits are only required when generating through external tools like Claude AI. Full key secrets are shown once.
          </p>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Key name, e.g. Production App"
              className="min-h-11 flex-1 rounded-xl border border-white/10 bg-[#111] px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#D7FF00]/60"
            />

            <button
              type="submit"
              disabled={busy}
              className="h-11 rounded-xl bg-[#D7FF00] px-5 text-xs font-black uppercase tracking-[.14em] text-black transition hover:bg-[#c8f000]"
            >
              {busy ? "Creating..." : "Create"}
            </button>

            <button
              type="button"
              onClick={() => setCreating(false)}
              className="h-11 rounded-xl border border-white/10 px-5 text-xs font-black uppercase tracking-[.14em] text-white/45 transition hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {newSecret && (
        <div className="mb-6 rounded-2xl border border-[#D7FF00]/40 bg-[#D7FF00]/10 p-5">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black text-[#D7FF00]">
                New key created: {newSecret.name}
              </p>
              <p className="mt-1 text-xs leading-5 text-white/45">
                Copy this key now. You will not be able to see the full secret again.
              </p>
            </div>

            <button
              onClick={() => copySecret(newSecret.secret)}
              className="h-10 rounded-xl bg-[#D7FF00] px-5 text-xs font-black uppercase tracking-[.14em] text-black transition hover:bg-[#c8f000]"
            >
              {copied ? "Copied" : "Copy Secret"}
            </button>
          </div>

          <code className="block overflow-x-auto rounded-xl border border-[#D7FF00]/20 bg-black/40 px-4 py-3 text-xs text-[#D7FF00]">
            {newSecret.secret}
          </code>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-white/8 bg-[#0D0D0D] p-5 text-sm text-white/40">
            Loading API keys...
          </div>
        ) : keys.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-[#0D0D0D] p-8 text-center">
            <p className="text-lg font-black text-white">No API keys yet</p>
            <p className="mt-2 text-sm text-white/40">
              Create your first API key to connect NOVA with Claude AI, external apps and automations.
            </p>
          </div>
        ) : (
          keys.map((key) => (
            <div key={key.id} className="rounded-2xl border border-white/8 bg-[#0D0D0D] p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-black text-white">{key.name}</p>
                  <p className="mt-1 text-xs text-white/30">
                    Created {formatUnix(key.createdAt)} · Last used {formatUnix(key.lastUsedAt)}
                  </p>
                </div>

                <button
                  onClick={() => revokeKey(key.id)}
                  disabled={busy}
                  className="w-fit rounded-lg border border-red-400/10 px-3 py-2 text-xs font-bold text-white/25 transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300"
                >
                  Revoke
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-white/8 bg-[#111] px-3 py-2 text-xs text-white/40">
                  {maskKey(key)}
                </code>

                <span className="rounded-lg border border-white/8 px-3 py-2 text-xs font-bold text-white/30">
                  Full key visible once only
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-white/8 bg-[#0D0D0D] p-5">
        <p className="mb-2 text-xs font-black uppercase tracking-wider text-white/30">Docs</p>
        <p className="mb-3 text-xs leading-relaxed text-white/50">
          Send your API key in the Authorization header:
        </p>
        <code className="block overflow-x-auto rounded-lg border border-white/8 bg-[#111] px-4 py-3 text-xs text-[#D7FF00]">
          Authorization: Bearer nv_live_sk_...
        </code>
      </div>
    </div>
  );
}
