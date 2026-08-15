import { renderEmailHtml, renderEmailText } from "@/lib/crm/emails/shell";
import { TACTICS } from "@/lib/crm/emails/tactics";

export function baseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://www.novvideos.online"
  ).replace(/\/$/, "");
}

export function normalizeLocale(value = "") {
  return String(value || "").toLowerCase().startsWith("pt") ? "pt" : "en";
}

/**
 * Adivinha o idioma a partir do que o Clerk devolve. Cai em inglês quando
 * não dá para saber — o produto e a landing são em inglês.
 */
export function detectLocale({ acceptLanguage = "", country = "" } = {}) {
  const lang = String(acceptLanguage || "").toLowerCase();
  const ctry = String(country || "").toUpperCase();
  if (lang.includes("pt") || ["BR", "PT", "AO", "MZ"].includes(ctry)) return "pt";
  return "en";
}

function withUtm(path, { campaign, content }) {
  const url = new URL(path.startsWith("http") ? path : `${baseUrl()}${path}`);
  url.searchParams.set("utm_source", "email");
  url.searchParams.set("utm_medium", "crm");
  url.searchParams.set("utm_campaign", campaign);
  url.searchParams.set("utm_content", content);
  return url.toString();
}

export function unsubscribeUrl(token) {
  return `${baseUrl()}/api/crm/unsubscribe?token=${encodeURIComponent(token)}`;
}

/**
 * Monta o e-mail final: copy (content.js) + camada de conversão (tactics.js) + shell.
 * Retorna exatamente o que a Resend precisa receber.
 */
export function renderStepEmail({ step, contact }) {
  const locale = normalizeLocale(contact.locale);
  const email = step.email;
  const copy = email[locale] || email.en;
  const tacticsEntry = TACTICS[email.id] || {};
  const extra = tacticsEntry[locale] || tacticsEntry.en || {};
  const ask = tacticsEntry.ask || "jab";

  // Media fields live at the top level of the tactics entry (not inside en/pt)
  const heroImage = tacticsEntry.heroImage || null;
  const images = tacticsEntry.images || null;
  const videoThumb = tacticsEntry.videoThumb || null;

  const firstName = String(contact.firstName || "").trim();
  const greetingName = firstName ? firstName.split(" ")[0] : "";

  // Personalização leve: só o primeiro nome no primeiro parágrafo, e só se existir.
  // "Olá {nome}" com o campo vazio é o tell clássico de e-mail em massa.
  const body = [...copy.body];
  if (greetingName && body.length) {
    body[0] = `${greetingName}, ${body[0].charAt(0).toLowerCase()}${body[0].slice(1)}`;
  }

  const ctaUrl = withUtm(copy.href, { campaign: "nurture60", content: email.id });
  const unsubUrl = unsubscribeUrl(contact.unsubToken);

  const opts = {
    headline: copy.headline,
    body,
    tactic: extra.tactic || null,
    proof: extra.proof || null,
    cta: copy.cta,
    ctaUrl,
    ask,
    ps: extra.ps || "",
    preheader: copy.preheader,
    unsubUrl,
    locale,
    heroImage,
    images,
    videoThumb,
  };

  return {
    subject: copy.subject,
    html: renderEmailHtml(opts),
    text: renderEmailText(opts),
    unsubUrl,
    locale,
    ask,
  };
}
