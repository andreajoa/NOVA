import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createUserApiKey } from "@/lib/apiKeys"
import { isNovaAdminFromAuth } from "@/lib/novaAdminAccess"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function html(body: string, status = 200) {
  return new NextResponse(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>NOVA Claude API Key</title>
  <style>
    body{margin:0;background:#000;color:#fff;font-family:Inter,Arial,sans-serif;padding:32px}
    main{max-width:980px;margin:0 auto}
    .card{border:1px solid rgba(217,255,0,.22);background:rgba(255,255,255,.035);border-radius:28px;padding:28px;margin:18px 0}
    h1{font-size:42px;line-height:.95;letter-spacing:-.06em;text-transform:uppercase;margin:0 0 18px}
    p{color:rgba(255,255,255,.68);line-height:1.7}
    button,a{display:inline-flex;border:0;border-radius:18px;padding:16px 20px;background:#d9ff00;color:#000;font-weight:900;text-transform:uppercase;letter-spacing:.08em;text-decoration:none;cursor:pointer}
    input,textarea{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(0,0,0,.55);color:#d9ff00;padding:16px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px}
    textarea{min-height:110px}
    .muted{font-size:13px;color:rgba(255,255,255,.48)}
    .row{display:flex;gap:12px;flex-wrap:wrap}
    code{color:#d9ff00;word-break:break-all}
  </style>
</head>
<body>
<main>${body}</main>
</body>
</html>`, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate",
    },
  })
}

export async function GET() {
  const authState = await auth()
  const { userId, sessionClaims } = authState

  if (!userId) {
    return html(`
      <div class="card">
        <h1>Login required</h1>
        <p>You need to be logged into NOVA to create a Claude API Key.</p>
        <a href="/sign-in">Sign in</a>
      </div>
    `, 401)
  }

  const adminBypass = await isNovaAdminFromAuth(userId, sessionClaims)

  return html(`
    <div class="card">
      <p class="muted">NOVA Claude Connect</p>
      <h1>Create your Claude API Key directly</h1>
      <p>This page bypasses the React button and creates the API Key directly using your current NOVA login session.</p>
      <p>Admin bypass: <code>${adminBypass ? "true" : "false"}</code></p>

      <form method="POST" action="/api/api-keys/claude-direct">
        <input name="name" value="Claude AI Connector ${new Date().toISOString()}" />
        <br /><br />
        <button type="submit">Create Claude API Key</button>
      </form>

      <p class="muted">The full secret key is shown only once, immediately after creation.</p>
    </div>
  `)
}

export async function POST(request: Request) {
  const authState = await auth()
  const { userId, sessionClaims } = authState

  if (!userId) {
    return html(`
      <div class="card">
        <h1>Unauthorized</h1>
        <p>Your NOVA login session was not found.</p>
        <a href="/sign-in">Sign in again</a>
      </div>
    `, 401)
  }

  try {
    const form = await request.formData().catch(() => null)
    const name = String(form?.get("name") || `Claude AI Connector ${new Date().toISOString()}`).slice(0, 80)

    const adminBypass = await isNovaAdminFromAuth(userId, sessionClaims)
    const result = await createUserApiKey(userId, name)
    const secret = result.secret
    const connectorUrl = `https://www.novvideos.online/api/claude/mcp?apiKey=${encodeURIComponent(secret)}`

    return html(`
      <div class="card">
        <p class="muted">NOVA Claude Connect</p>
        <h1>API Key created</h1>
        <p>Admin bypass: <code>${adminBypass ? "true" : "false"}</code></p>
        <p>Copy this now. NOVA will not show the full secret again after this page.</p>

        <h3>Full NOVA API Key</h3>
        <textarea readonly onclick="this.select()">${escapeHtml(secret)}</textarea>

        <h3>Claude Connector URL</h3>
        <textarea readonly onclick="this.select()">${escapeHtml(connectorUrl)}</textarea>

        <div class="row">
          <a href="/dashboard/claude-connect">Back to Claude Connect</a>
          <a href="/dashboard/settings/api-keys">API Keys Settings</a>
        </div>

        <p class="muted">In Claude: Name = NOVA, URL = the connector URL above, OAuth fields empty.</p>
      </div>
    `)
  } catch (err: any) {
    return html(`
      <div class="card">
        <h1>API Key creation failed</h1>
        <p>Error:</p>
        <pre>${escapeHtml(err?.message || String(err))}</pre>
        <a href="/api/api-keys/claude-direct">Try again</a>
      </div>
    `, 500)
  }
}
