"use client";

import { useEffect, useMemo, useState } from "react";

const MCP_BASE_URL = "https://www.novvideos.online/api/claude/mcp";

function extractApiKey(data) {
  if (!data) return "";

  // IMPORTANT:
  // /api/api-keys returns { key: publicMetadataObject, secret: "nv_live_sk_..." }.
  // So secret must be checked BEFORE key, because key is an object.
  const candidates = [
    data.secret,
    data.plainTextKey,
    data.plaintextKey,
    data.rawKey,
    data.novaApiKey,
    data.apiKey,
    data.token,
    data.value,

    data.data?.secret,
    data.data?.plainTextKey,
    data.data?.plaintextKey,
    data.data?.rawKey,
    data.data?.novaApiKey,
    data.data?.apiKey,
    data.data?.token,
    data.data?.value,

    data.key?.secret,
    data.key?.plainTextKey,
    data.key?.plaintextKey,
    data.key?.rawKey,
    data.key?.apiKey,
    data.key?.value,

    data.apiKey?.secret,
    data.apiKey?.key,
    data.apiKey?.value,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.startsWith("nv_live_sk_")) {
      return candidate;
    }
  }

  const list =
    data.keys ||
    data.apiKeys ||
    data.items ||
    data.data?.keys ||
    data.data?.apiKeys ||
    data.data?.items ||
    [];

  if (Array.isArray(list)) {
    for (const item of list) {
      const value =
        item?.secret ||
        item?.plainTextKey ||
        item?.plaintextKey ||
        item?.rawKey ||
        item?.apiKey ||
        item?.key ||
        item?.token ||
        item?.value ||
        "";

      if (typeof value === "string" && value.startsWith("nv_live_sk_")) {
        return value;
      }
    }
  }

  return "";
}

export default function ClaudeConnectPage() {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState("Ready");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");

  const connectorUrl = useMemo(() => {
    const clean = String(apiKey || "").trim();
    return clean ? `${MCP_BASE_URL}?apiKey=${encodeURIComponent(clean)}` : MCP_BASE_URL;
  }, [apiKey]);

  useEffect(() => {
    const saved = localStorage.getItem("nova_claude_api_key") || "";
    if (saved) setApiKey(saved);
  }, []);

  function saveManualKey(value) {
    setApiKey(value);
    localStorage.setItem("nova_claude_api_key", value);
  }

  async function copy(value, label) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(""), 1800);
  }

  async function createKey() {
    if (loading) {
      setStatus("Still working. If this stays here for more than 20 seconds, click Reset and try again.");
      return;
    }

    setLoading(true);
    setStatus("Creating your Full NOVA API Key...");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const createRes = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Claude AI Connector" }),
        signal: controller.signal,
      });

      const createdText = await createRes.text();
      let created = {};

      try {
        created = createdText ? JSON.parse(createdText) : {};
      } catch {
        created = { raw: createdText };
      }

      if (!createRes.ok) {
        setStatus(
          `API Key creation failed (${createRes.status}). ` +
          `${created?.message || created?.error || created?.code || createdText || "Unknown error"}`
        );
        return;
      }

      const createdKey = extractApiKey(created);

      if (createdKey) {
        saveManualKey(createdKey);
        setStatus("API Key created. The full key is shown below. Copy it now — for security, NOVA will only show the full key at creation time.");
        return;
      }

      setStatus(`API Key response received, but secret was not found. Response fields: ${Object.keys(created || {}).join(", ")}`);
    } catch (err) {
      if (err?.name === "AbortError") {
        setStatus("Request timed out after 20 seconds. Click Reset and try again, or open API Keys page.");
      } else {
        setStatus(err?.message || "Could not create API Key automatically. Paste your key manually.");
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  function resetCreateState() {
    setLoading(false);
    setStatus("Ready. You can try creating the API Key again.");
  }

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white md:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-lime-300/20 bg-white/[0.035] p-6 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-300">
            NOVA Claude Connect
          </p>

          <h1 className="mt-5 max-w-5xl text-4xl font-black uppercase leading-[0.88] tracking-[-0.07em] md:text-7xl">
            Connect Claude AI to NOVA with a Full NOVA API Key.
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-white/60 md:text-lg">
            Claude does not show a separate Full NOVA API Key field. To generate through Claude,
            use a personalized MCP URL that includes your Full NOVA API Key.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">Claude cost</p>
              <p className="mt-2 text-2xl font-black text-lime-300">API credits</p>
              <p className="mt-2 text-sm leading-7 text-white/55">External Claude usage uses API credits, not internal dashboard credits.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">Landing page</p>
              <p className="mt-2 text-2xl font-black text-lime-300">24 credits</p>
              <p className="mt-2 text-sm leading-7 text-white/55">Complete landing page with layout, copy, 4 AI images and ZIP export.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">Minimum</p>
              <p className="mt-2 text-2xl font-black text-lime-300">$10</p>
              <p className="mt-2 text-sm leading-7 text-white/55">API credits are required only when generating from Claude AI. Creating an API Key does not require credits.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.75fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
            <h2 className="text-2xl font-black tracking-[-0.04em]">Your Claude connector URL</h2>
            <p className="mt-3 text-sm leading-7 text-white/60">
              Create or paste your Full NOVA API Key below. Creating an API Key is free. API credits are only required when generating from Claude AI; owner/admin accounts can generate without API credit debit.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={createKey}
                aria-busy={loading}
                className="rounded-2xl bg-lime-300 px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-black shadow-[0_0_30px_rgba(217,255,0,.18)]"
              >
                {loading ? "Creating API Key..." : "Create / load API Key"}
              </button>

              <button
                type="button"
                onClick={resetCreateState}
                className="rounded-2xl border border-white/10 px-5 py-4 text-center text-sm font-bold text-white/80"
              >
                Reset
              </button>

              <a
                href="/checkout/api-credits?pack=starter"
                className="rounded-2xl border border-lime-300/30 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.12em] text-lime-300"
              >
                Buy API credits
              </a>

              <a
                href="/dashboard/settings/api-keys"
                className="rounded-2xl border border-white/10 px-5 py-4 text-center text-sm font-bold text-white/80"
              >
                API Keys page
              </a>
            </div>

            <p className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/60">
              {status}
            </p>

            <label className="mt-5 block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-white/45">
                Full NOVA API Key
              </span>
              <input
                value={apiKey}
                onChange={(e) => saveManualKey(e.target.value)}
                placeholder="Paste your Full NOVA API Key here"
                className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-4 text-white outline-none focus:border-lime-300/60"
              />
            </label>

            {apiKey ? (
              <div className="mt-5 rounded-3xl border border-lime-300/20 bg-black/50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-300">
                  Full API Key — shown only after creation
                </p>
                <code className="mt-3 block break-all rounded-2xl bg-black/70 p-4 text-sm text-lime-300">
                  {apiKey}
                </code>
                <button
                  type="button"
                  onClick={() => copy(apiKey, "apiKey")}
                  className="mt-4 rounded-2xl border border-lime-300/30 px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-lime-300"
                >
                  {copied === "apiKey" ? "Copied!" : "Copy full API Key"}
                </button>
                <p className="mt-3 text-xs leading-6 text-white/45">
                  Save this key now. For security, NOVA only shows the complete secret when it is created.
                </p>
              </div>
            ) : null}

            <div className="mt-5 rounded-3xl border border-lime-300/20 bg-lime-300/10 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/45">
                Copy this URL into Claude
              </p>
              <code className="mt-3 block break-all rounded-2xl bg-black/70 p-4 text-sm text-lime-300">
                {connectorUrl}
              </code>
              <button
                onClick={() => copy(connectorUrl, "connector")}
                className="mt-4 rounded-2xl bg-lime-300 px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-black"
              >
                {copied === "connector" ? "Copied!" : "Copy connector URL"}
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
            <h2 className="text-2xl font-black tracking-[-0.04em]">How to reconnect in Claude</h2>

            <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-7 text-white/65">
              <li>Open Claude.ai.</li>
              <li>Go to Settings / Customize.</li>
              <li>Open Connectors.</li>
              <li>Click NOVA.</li>
              <li>Click Disconnect.</li>
              <li>Click + / Add custom connector.</li>
              <li>Name: <b className="text-white">NOVA</b>.</li>
              <li>URL: paste the personalized URL from this page.</li>
              <li>Leave OAuth Client ID empty.</li>
              <li>Leave OAuth Client Secret empty.</li>
              <li>Click Add.</li>
              <li>Set tool permissions to Always allow.</li>
            </ol>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm leading-7 text-white/60">
              Use a dedicated API Key for Claude. You can revoke it later in NOVA API settings.
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
