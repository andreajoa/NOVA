import { NextResponse } from "next/server";
import { getContactByToken, setContactStatus } from "@/lib/crm/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function page(title, message, locale = "en") {
  return new NextResponse(
    `<!doctype html><html lang="${locale}"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>
 body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
      background:#000;color:#fff;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;padding:24px}
 .card{max-width:520px;text-align:center;border:1px solid #1c1c1c;background:#0a0a0a;border-radius:20px;padding:40px 32px}
 .logo{display:inline-block;width:34px;height:34px;line-height:34px;border-radius:7px;background:#c8f135;
       color:#0a0a0a;font-weight:900;font-size:19px;margin-bottom:20px}
 h1{margin:0 0 12px;font-size:26px;font-weight:900;letter-spacing:-.4px}
 p{margin:0 0 22px;color:#9a9a9a;font-size:15px;line-height:1.65}
 a{display:inline-block;color:#c8f135;text-decoration:none;font-weight:700;font-size:14px}
</style></head><body>
<div class="card"><div class="logo">N</div><h1>${title}</h1><p>${message}</p>
<a href="https://www.novvideos.online">novvideos.online</a></div>
</body></html>`,
    { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } }
  );
}

async function unsubscribe(token) {
  const contact = await getContactByToken(token);
  if (!contact) return null;

  if (contact.status !== "unsubscribed") {
    await setContactStatus(contact.email, "unsubscribed", "user_request");
  }

  return contact;
}

/** Clique no link do rodapé. */
export async function GET(request) {
  const token = new URL(request.url).searchParams.get("token");
  const contact = await unsubscribe(token);

  if (!contact) {
    return page("Link inválido", "Este link de descadastro não é mais válido.", "pt");
  }

  return contact.locale === "pt"
    ? page(
        "Pronto, você saiu",
        `<b>${contact.email}</b> não vai mais receber nossos e-mails de marketing. Sua conta na NOVA continua ativa normalmente.`,
        "pt"
      )
    : page(
        "You're unsubscribed",
        `<b>${contact.email}</b> won't receive our marketing emails anymore. Your NOVA account stays active.`,
        "en"
      );
}

/**
 * One-click unsubscribe (RFC 8058). O Gmail e o Yahoo chamam este POST
 * direto, sem abrir o navegador. Precisa responder 200 rápido.
 */
export async function POST(request) {
  const token = new URL(request.url).searchParams.get("token");
  await unsubscribe(token);
  return NextResponse.json({ ok: true });
}
