/**
 * Shell HTML dos e-mails da NOVA.
 *
 * Estrutura de conversão (Hormozi + Gary Vee):
 *   1. HOOK      — headline curta e pesada, alinhada à esquerda (lê mais rápido que centralizado)
 *   2. BODY      — frases curtas, uma ideia por linha
 *   3. TÁTICA    — bloco destacado que ENSINA algo aplicável hoje, de graça, sem precisar pagar.
 *                  É o "jab": entrega valor antes de pedir qualquer coisa.
 *   4. PROVA     — número concreto quando existir (especificidade > adjetivo)
 *   5. CTA       — UM só. Em e-mail 'jab' ele é discreto (link de texto);
 *                  em e-mail 'hook' ele é botão sólido.
 *   6. P.S.      — Hormozi usa sempre; é a segunda linha mais lida do e-mail depois do assunto.
 *
 * Regras técnicas: tabelas (Outlook), 600px, coluna única, texto real (não imagem —
 * e-mail feito de imagem cai em spam e não carrega com imagens bloqueadas).
 */

const GREEN = "#c8f135";
const BG = "#000000";
const PANEL = "#0a0a0a";
const CARD = "#0f0f0f";
const LINE = "#1c1c1c";
const MUTED = "#9a9a9a";

function esc(value = "") {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const FONT = `-apple-system,'Segoe UI',Helvetica,Arial,sans-serif`;

/**
 * @param {object} opts
 * @param {string} opts.headline    gancho principal
 * @param {string[]} opts.body      parágrafos curtos
 * @param {object} [opts.tactic]    { label, text } — bloco de valor grátis
 * @param {object} [opts.proof]     { stat, caption } — número concreto
 * @param {string} opts.cta         texto do CTA
 * @param {string} opts.ctaUrl      URL absoluta já com UTM
 * @param {'jab'|'hook'} opts.ask   jab = CTA discreto · hook = botão sólido
 * @param {string} [opts.ps]        linha de P.S.
 * @param {string} opts.preheader
 * @param {string} opts.unsubUrl
 * @param {string} opts.locale
 * @param {object} [opts.heroImage]   { src, alt, href } — imagem hero full-width
 * @param {object[]} [opts.images]    [{ src, alt, href?, caption? }] — grid de imagens (max 4)
 * @param {object} [opts.videoThumb]  { src, alt, href, duration? } — thumbnail de vídeo com play button
 */
export function renderEmailHtml(opts) {
  const {
    headline = "",
    body = [],
    tactic = null,
    proof = null,
    cta = "",
    ctaUrl = "#",
    ask = "jab",
    ps = "",
    preheader = "",
    unsubUrl = "#",
    locale = "en",
    heroImage = null,
    images = null,
    videoThumb = null,
  } = opts;

  const t =
    locale === "pt"
      ? {
          unsub: "Descadastrar",
          why: "Você recebe este e-mail porque criou uma conta na NOVA.",
          prefs: "Não quer mais receber?",
        }
      : {
          unsub: "Unsubscribe",
          why: "You're receiving this because you created a NOVA account.",
          prefs: "Don't want these?",
        };

  const paragraphs = body
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;color:#d4d4d4;font-size:16px;line-height:1.65;font-family:${FONT};">${esc(
          paragraph
        )}</p>`
    )
    .join("");

  // Bloco de tática: o valor entregue de graça. É o que faz o e-mail ser
  // guardado em vez de deletado, e o que compra o direito de pedir a venda.
  const tacticBlock = tactic
    ? `
  <tr><td style="padding:8px 28px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background-color:${CARD};border:1px solid rgba(200,241,53,.28);border-left:3px solid ${GREEN};border-radius:10px;">
      <tr><td style="padding:18px 20px;">
        <p style="margin:0 0 7px;color:${GREEN};font-size:10px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;">${esc(
          tactic.label
        )}</p>
        <p style="margin:0;color:#e8e8e8;font-size:15px;line-height:1.65;font-family:${FONT};">${esc(
          tactic.text
        )}</p>
      </td></tr>
    </table>
  </td></tr>`
    : "";

  // Hero image: imagem full-width acima do corpo, com bordas arredondadas
  const heroBlock = heroImage
    ? `
  <tr><td style="padding:0 28px 18px;">
    ${heroImage.href ? `<a href="${esc(heroImage.href)}" style="text-decoration:none;">` : ""}
    <img src="${esc(heroImage.src)}" alt="${esc(heroImage.alt || "")}"
         width="544" style="display:block;width:100%;max-width:544px;height:auto;border-radius:10px;border:1px solid ${LINE};" />
    ${heroImage.href ? "</a>" : ""}
  </td></tr>`
    : "";

  // Grid de imagens: 2 colunas desktop, 1 coluna mobile (stacked via .img-grid-cell)
  const imageGridBlock = images && images.length > 0
    ? `
  <tr><td style="padding:8px 28px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${(() => {
        const rows = [];
        for (let i = 0; i < Math.min(images.length, 4); i += 2) {
          const img1 = images[i];
          const img2 = images[i + 1];
          rows.push(`<tr>
            <td class="img-grid-cell" style="width:50%;padding:0 4px 8px 0;vertical-align:top;">
              ${img1.href ? `<a href="${esc(img1.href)}" style="text-decoration:none;">` : ""}
              <img src="${esc(img1.src)}" alt="${esc(img1.alt || "")}"
                   width="262" style="display:block;width:100%;max-width:262px;height:auto;border-radius:8px;border:1px solid ${LINE};" />
              ${img1.caption ? `<p style="margin:4px 0 0;color:${MUTED};font-size:11px;font-family:${FONT};">${esc(img1.caption)}</p>` : ""}
              ${img1.href ? "</a>" : ""}
            </td>
            ${img2 ? `<td class="img-grid-cell" style="width:50%;padding:0 0 8px 4px;vertical-align:top;">
              ${img2.href ? `<a href="${esc(img2.href)}" style="text-decoration:none;">` : ""}
              <img src="${esc(img2.src)}" alt="${esc(img2.alt || "")}"
                   width="262" style="display:block;width:100%;max-width:262px;height:auto;border-radius:8px;border:1px solid ${LINE};" />
              ${img2.caption ? `<p style="margin:4px 0 0;color:${MUTED};font-size:11px;font-family:${FONT};">${esc(img2.caption)}</p>` : ""}
              ${img2.href ? "</a>" : ""}
            </td>` : `<td class="img-grid-cell" style="width:50%;padding:0 0 8px 4px;"></td>`}
          </tr>`);
        }
        return rows.join("");
      })()}
    </table>
  </td></tr>`
    : "";

  // Video thumbnail: imagem com overlay de play button estilizado
  const videoBlock = videoThumb
    ? `
  <tr><td style="padding:12px 28px 0;">
    <a href="${esc(videoThumb.href || "#")}" style="text-decoration:none;display:block;position:relative;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="background-color:${CARD};border:1px solid ${LINE};border-radius:10px;overflow:hidden;">
        <tr><td style="position:relative;text-align:center;">
          <img src="${esc(videoThumb.src)}" alt="${esc(videoThumb.alt || "Watch video")}"
               width="544" style="display:block;width:100%;max-width:544px;height:auto;border-radius:10px 10px 0 0;opacity:0.85;" />
        </td></tr>
        <tr><td class="video-bar" style="padding:12px 16px;background-color:${CARD};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="vertical-align:middle;padding-right:10px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="background-color:${GREEN};width:36px;height:36px;border-radius:18px;text-align:center;vertical-align:middle;">
                  <span style="font-size:14px;color:#0a0a0a;line-height:36px;font-family:Arial,sans-serif;">&#9654;</span>
                </td></tr>
              </table>
            </td>
            <td style="vertical-align:middle;">
              <span style="color:#ffffff;font-size:13px;font-weight:700;font-family:${FONT};">${esc(
                locale === "pt" ? "Assistir video" : "Watch video"
              )}</span>
              ${videoThumb.duration ? `<span style="color:${MUTED};font-size:12px;font-family:${FONT};margin-left:6px;">${esc(videoThumb.duration)}</span>` : ""}
            </td>
          </tr></table>
        </td></tr>
      </table>
    </a>
  </td></tr>`
    : "";

  const proofBlock = proof
    ? `
  <tr><td style="padding:20px 28px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="padding-right:12px;vertical-align:middle;">
        <span style="color:${GREEN};font-size:30px;font-weight:900;line-height:1;font-family:${FONT};">${esc(
          proof.stat
        )}</span>
      </td>
      <td style="vertical-align:middle;">
        <span style="color:${MUTED};font-size:13px;line-height:1.45;font-family:${FONT};">${esc(
          proof.caption
        )}</span>
      </td>
    </tr></table>
  </td></tr>`
    : "";

  // Gary Vee: jab = valor sem pedir nada, o link some no texto.
  // right hook = o pedido explícito, botão sólido.
  const ctaBlock =
    ask === "hook"
      ? `
  <tr><td style="padding:26px 28px 6px;">
    <a href="${esc(ctaUrl)}" class="cta"
       style="display:inline-block;background-color:${GREEN};color:#0a0a0a;text-decoration:none;font-weight:800;font-size:15px;padding:15px 32px;border-radius:8px;font-family:${FONT};">${esc(
          cta
        )} &rarr;</a>
  </td></tr>`
      : `
  <tr><td style="padding:22px 28px 6px;">
    <a href="${esc(ctaUrl)}"
       style="color:${GREEN};text-decoration:underline;font-weight:700;font-size:15px;font-family:${FONT};">${esc(
          cta
        )} &rarr;</a>
  </td></tr>`;

  const psBlock = ps
    ? `
  <tr><td style="padding:18px 28px 0;">
    <p style="margin:0;color:${MUTED};font-size:14px;line-height:1.6;font-family:${FONT};">
      <span style="color:#e8e8e8;font-weight:800;">P.S.</span> ${esc(ps)}
    </p>
  </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="${esc(locale)}" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<meta name="color-scheme" content="dark" />
<title>${esc(headline)}</title>
<style>
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
  img{-ms-interpolation-mode:bicubic;border:0;line-height:100%;outline:none;text-decoration:none}
  body{margin:0;padding:0;width:100%!important}
  a{color:${GREEN}}
  @media screen and (max-width:600px){
    .container{width:100%!important}
    .px{padding-left:20px!important;padding-right:20px!important}
    .h1{font-size:27px!important}
    .cta{display:block!important;text-align:center!important;box-sizing:border-box!important}
    .img-grid-cell{display:block!important;width:100%!important;padding:0 0 8px 0!important}
    .img-grid-cell img{max-width:100%!important;width:100%!important}
    .video-bar{padding:10px 12px!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:${FONT};">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(preheader)}</div>
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BG};">
<tr><td align="center" style="padding:28px 12px;">
<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

  <tr><td class="px" style="padding:0 28px 20px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="background-color:${GREEN};width:30px;height:30px;border-radius:6px;text-align:center;vertical-align:middle;">
        <span style="font-size:17px;font-weight:900;color:#0a0a0a;line-height:30px;font-family:Helvetica,Arial,sans-serif;">N</span>
      </td>
      <td style="padding-left:10px;">
        <span style="color:#ffffff;font-weight:800;font-size:15px;font-family:Helvetica,Arial,sans-serif;">NOVA <span style="color:${GREEN};">AI STUDIO</span></span>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="background-color:${PANEL};border-top:1px solid ${LINE};border-bottom:1px solid ${LINE};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

      <tr><td class="px" style="padding:34px 28px 14px;">
        <h1 class="h1" style="margin:0;color:#ffffff;font-size:32px;font-weight:900;line-height:1.12;letter-spacing:-0.5px;font-family:${FONT};">${esc(
          headline
        )}</h1>
      </td></tr>

      ${heroBlock}

      <tr><td class="px" style="padding:4px 28px 0;">${paragraphs}</td></tr>

      ${imageGridBlock}
      ${videoBlock}
      ${tacticBlock}
      ${proofBlock}
      ${ctaBlock}
      ${psBlock}

      <tr><td style="height:32px;line-height:32px;">&nbsp;</td></tr>
    </table>
  </td></tr>

  <tr><td style="background-color:#070707;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td class="px" style="padding:22px 28px;">
        <p style="margin:0 0 6px;color:#5a5a5a;font-size:11.5px;line-height:1.65;font-family:${FONT};">${esc(
          t.why
        )}</p>
        <p style="margin:0;color:#5a5a5a;font-size:11.5px;line-height:1.65;font-family:${FONT};">
          &copy; 2026 NOVA AI Studio &middot;
          <a href="https://www.novvideos.online" style="color:#7a7a7a;text-decoration:none;">novvideos.online</a>
          &middot; ${esc(t.prefs)}
          <a href="${esc(unsubUrl)}" style="color:#7a7a7a;text-decoration:underline;">${esc(t.unsub)}</a>
        </p>
      </td>
    </tr></table>
  </td></tr>

</table>
</td></tr></table>
</body>
</html>`;
}

/** Versão texto puro. Melhora entregabilidade e é exigida por vários filtros. */
export function renderEmailText(opts) {
  const { headline, body = [], tactic, cta, ctaUrl, ps, unsubUrl, locale, videoThumb } = opts;
  const lines = [headline.toUpperCase(), ""];

  body.forEach((paragraph) => lines.push(paragraph, ""));

  if (videoThumb?.href) {
    const label = locale === "pt" ? "Assistir video" : "Watch video";
    lines.push(`${label}: ${videoThumb.href}`, "");
  }

  if (tactic) lines.push(`[ ${tactic.label} ]`, tactic.text, "");
  lines.push(`${cta}: ${ctaUrl}`, "");
  if (ps) lines.push(`P.S. ${ps}`, "");

  lines.push(
    "—",
    locale === "pt"
      ? `Você recebe este e-mail porque criou uma conta na NOVA. Descadastrar: ${unsubUrl}`
      : `You're receiving this because you created a NOVA account. Unsubscribe: ${unsubUrl}`
  );

  return lines.join("\n");
}
