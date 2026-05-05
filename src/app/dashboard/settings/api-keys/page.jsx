"use client";

import { useEffect, useMemo, useState } from "react";

function generateApiKey() {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(32);

  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }

  let token = "";
  for (const byte of bytes) token += alphabet[byte % alphabet.length];

  return `nv_live_sk_${token}`;
}

function maskKey(prefix, suffix) {
  return `${prefix}••••••••••••••••••••••••${suffix}`;
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const fallbackKeys = [
  {
    id: "prod",
    name: "Production",
    prefix: "nv_live_sk",
    suffix: "eA9x",
    created: "May 1, 2026",
    lastUsed: "Today",
  },
  {
    id: "dev",
    name: "Development",
    prefix: "nv_test_sk",
    suffix: "F2cW",
    created: "Apr 15, 2026",
    lastUsed: "3 days ago",
  },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState(fallbackKeys);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newSecret, setNewSecret] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("nova_api_key_metadata");
      if (saved) setKeys(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("nova_api_key_metadata", JSON.stringify(keys));
    } catch {}
  }, [keys]);

  const activeCount = useMemo(() => keys.length, [keys]);

  async function copySecret(secret) {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function createKey(e) {
    e.preventDefault();

    const name = newName.trim();
    if (!name) return;

    const secret = generateApiKey();
    const metadata = {
      id: String(Date.now()),
      name,
      prefix: secret.slice(0, 10),
      suffix: secret.slice(-4),
      created: todayLabel(),
      lastUsed: "Never",
    };

    setKeys((current) => [metadata, ...current]);
    setNewSecret({ name, secret });
    setNewName("");
    setCreating(false);
    setCopied(false);
  }

  function revokeKey(id) {
    setKeys((current) => current.filter((key) => key.id !== id));
    if (newSecret) setNewSecret(null);
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
            Create and manage keys for the NOVA API. For security, full keys are shown only once when created.
          </p>
        </div>

        <button
          onClick={() => setCreating((value) => !value)}
          className="h-11 rounded-xl bg-[#D7FF00] px-5 text-xs font-black uppercase tracking-[.14em] text-black transition hover:bg-[#c8f000]"
        >
          + New Key
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
          <p className="text-xs font-black uppercase tracking-[.16em] text-white/30">Active keys</p>
          <p className="mt-3 text-3xl font-black text-white">{activeCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
          <p className="text-xs font-black uppercase tracking-[.16em] text-white/30">Environment</p>
          <p className="mt-3 text-lg font-black text-[#D7FF00]">Live + Test</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
          <p className="text-xs font-black uppercase tracking-[.16em] text-white/30">Status</p>
          <p className="mt-3 text-lg font-black text-white">Ready for API access</p>
        </div>
      </div>

      {creating && (
        <form
          onSubmit={createKey}
          className="mb-6 rounded-2xl border border-[#D7FF00]/30 bg-[#0D0D0D] p-5"
        >
          <p className="mb-4 text-sm font-black text-white">Create a new API key</p>

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
              className="h-11 rounded-xl bg-[#D7FF00] px-5 text-xs font-black uppercase tracking-[.14em] text-black transition hover:bg-[#c8f000]"
            >
              Create
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
        {keys.map((key) => (
          <div key={key.id} className="rounded-2xl border border-white/8 bg-[#0D0D0D] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-black text-white">{key.name}</p>
                <p className="mt-1 text-xs text-white/30">
                  Created {key.created} · Last used {key.lastUsed}
                </p>
              </div>

              <button
                onClick={() => revokeKey(key.id)}
                className="w-fit rounded-lg border border-red-400/10 px-3 py-2 text-xs font-bold text-white/25 transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300"
              >
                Revoke
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-white/8 bg-[#111] px-3 py-2 text-xs text-white/40">
                {maskKey(key.prefix, key.suffix)}
              </code>

              <span className="rounded-lg border border-white/8 px-3 py-2 text-xs font-bold text-white/30">
                Full key visible once only
              </span>
            </div>
          </div>
        ))}
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
