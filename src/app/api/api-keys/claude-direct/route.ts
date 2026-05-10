import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createUserApiKey } from "@/lib/apiKeys"
import { isNovaAdminFromAuth } from "@/lib/novaAdminAccess"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function page(body: string, status = 200) {
  return new NextResponse(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>NOVA Claude API Key</title>
<style>
  body{margin:0;background:#000;color:#fff;font-family:Arial,sans-serif;padding:28px}
  main{max-width:980px;margin:0 auto}
  .card{border:1px solid rgba(217,255,0,.25);background:rgba(255,255,255,.04);border-radius:28px;padding:28px;margin:18px 0}
  h1{font-size:40px;line-height:.95;letter-spacing:-.05em;text-transform:uppercase;margin:0 0 18px}
  p{color:rgba(255,255,255,.68);line-height:1.7}
  a{display:inline-flex;border-radius:18px;padding:16px 20px;background:#d9ff00;color:#000;font-weight:900;text-transform:uppercase;letter-spacing:.08em;text-decoration:none;margin:6px 8px 6px 0}
  textarea{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(0,0,0,.65);color:#d9ff00;padding:16px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;min-height:110px}
  code{color:#d9ff00;word-break:break-all}
  .muted{font-size:13px;color:rgba(255,255,255,.48)}
  pre{white-space:pre-wrap;background:#111;border-radius:18px;padding:16px;color:#ffb4b4;overflow:auto}
</style>
</head>
<body><main>${body}</main></body>
</html>`, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate",
    },
  })
}

export async function GET(request: Request) {
  const authState = await auth()
  const { userId, sessionClaims } = authState
  const url = new URL(request.url)
  const shouldCreate = url.searchParams.get("create") === "1"

  if (!userId) {
    return page(`
      <div class="card">
        <h1>Login required</h1>
        <p>Faça login na NOVA antes de gerar a API Key.</p>
        <a href="/sign-in">Sign in</a>
      </div>
    `, 401)
  }

  const adminBypass = await isNovaAdminFromAuth(userId, sessionClaims)

  if (!shouldCreate) {
    return page(`
      <div class="card">
        <p class="muted">NOVA Claude Connect</p>
        <h1>Gerador direto de API Key</h1>
        <p>Essa página não depende do botão React. Ela gera a API Key diretamente no servidor usando sua sessão logada da NOVA.</p>
        <p>Admin bypass detectado: <code>${adminBypass ? "true" : "false"}</code></p>
        <a href="/api/api-keys/claude-direct?create=1">Create Claude API Key Now</a>
        <a href="/dashboard/claude-connect">Back to Claude Connect</a>
      </div>
    `)
  }

  try {
    const result = await createUserApiKey(
      userId,
      `Claude AI Connector ${new Date().toISOString()}`
    )

    const secret = result.secret

    if (!secret || !secret.startsWith("nv_live_sk_")) {
      return page(`
        <div class="card">
          <h1>API Key created but secret missing</h1>
          <pre>${esc(JSON.stringify(result, null, 2))}</pre>
          <a href="/api/api-keys/claude-direct">Try again</a>
        </div>
      `, 500)
    }

    const connectorUrl =
      "https://www.novvideos.online/api/claude/mcp?apiKey=" +
      encodeURIComponent(secret)

    return page(`
      <div class="card">
        <p class="muted">NOVA Claude Connect</p>
        <h1>API Key criada</h1>
        <p>Admin bypass detectado: <code>${adminBypass ? "true" : "false"}</code></p>
        <p>Copie agora. A NOVA só mostra a chave completa no momento da criação.</p>

        <h3>Full NOVA API Key</h3>
        <textarea readonly onclick="this.select()">${esc(secret)}</textarea>

        <h3>Claude Connector URL</h3>
        <textarea readonly onclick="this.select()">${esc(connectorUrl)}</textarea>

        <p class="muted">No Claude: Name = NOVA, URL = a URL acima, OAuth Client ID/Secret vazios.</p>

        <a href="/dashboard/settings/api-keys">API Keys Settings</a>
        <a href="/api/api-keys/claude-direct">Create another</a>
      </div>
    `)
  } catch (err: any) {
    return page(`
      <div class="card">
        <h1>API Key creation failed</h1>
        <p>Erro real do servidor:</p>
        <pre>${esc(err?.message || String(err))}</pre>
        <a href="/api/api-keys/claude-direct">Try again</a>
      </div>
    `, 500)
  }
}
