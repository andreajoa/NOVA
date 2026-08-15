import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fal } from "@fal-ai/client";
import { validateApiKeyFromRequest } from "@/lib/apiKeys";
import { extractGeneratedMediaUrl } from "@/lib/generatedMediaUrl";
import { MEDIA_MODELS } from "@/lib/mediaCapabilities";
import { logFalSpending } from "@/lib/falSpending";

import {
  debitApiCredits,
  debitGenerationCredits,
  checkAndDebitImageGen,
  ensureUserGenerationAccount,
  isAdminUser,
  refundApiCredits,
  refundGenerationCredits,
  refundImageGen,
} from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VIDEO_CREDITS_PER_SECOND = 24;
const DEFAULT_SECONDS = 5;
const MAX_SECONDS = 30;

/**
 * Per-model credit pricing. Looks up the fal endpoint in MEDIA_MODELS
 * and returns the correct novaCredits cost, scaled by duration.
 * Falls back to the flat rate (24 cr/s) only for unknown endpoints.
 */
function getModelCreditCost(endpoint, seconds) {
  const entry = Object.values(MEDIA_MODELS).find(
    (m) => m.endpoint === endpoint
  );

  if (!entry || !entry.novaCredits) {
    return seconds * VIDEO_CREDITS_PER_SECOND;
  }

  const baseSeconds = entry.maxSeconds || 5;
  const multiplier = Math.max(1, seconds / baseSeconds);
  return Math.ceil(entry.novaCredits * multiplier);
}


fal.config({ credentials: process.env.FAL_KEY });

function getFalErrorDetails(err) {
  return {
    name: err?.name || null,
    message: err?.message || String(err),
    status: err?.status || err?.statusCode || err?.response?.status || null,
    body: err?.body || err?.response?.body || err?.response?.data || null,
    cause: err?.cause?.message || null,
  };
}

function logFalError(label, err, context = {}) {
  const details = getFalErrorDetails(err);
  console.error(label, {
    ...context,
    ...details,
  });
}

function falEnvStatus() {
  const key = process.env.FAL_KEY || "";
  return {
    exists: Boolean(key),
    length: key.length,
    hasColon: key.includes(":"),
    prefix: key ? key.slice(0, 8) + "..." : null,
  };
}


function normalizeSeconds(value) {
  const n = Number(value || DEFAULT_SECONDS);
  if (!Number.isFinite(n)) return DEFAULT_SECONDS;
  return Math.max(1, Math.min(MAX_SECONDS, Math.ceil(n)));
}

function isImageEndpoint(endpoint) {
  const patterns = [
    "flux", "gpt-image", "recraft", "ideogram", "stable-diffusion",
    "aura-flow", "nano-banana", "hidream", "sana", "kolors",
  ];
  return patterns.some((p) => String(endpoint).toLowerCase().includes(p));
}

function dashboardPaywallPayload({ currentCredits, creditsRequired, seconds }) {
  return {
    success: false,
    code: "INSUFFICIENT_CREDITS",
    error: "INSUFFICIENT_CREDITS",
    message: "Not enough credits to generate this video. Upgrade to continue.",
    currentCredits,
    creditsRequired,
    creditsMissing: Math.max(0, creditsRequired - currentCredits),
    seconds,
    creditsPerSecond: VIDEO_CREDITS_PER_SECOND,
    plans: {
      annual:  { label: "Annual",  price: "$5/mo", href: "/checkout/plan?plan=basic&billing=annual"  },
      monthly: { label: "Monthly", price: "$7/mo", href: "/checkout/plan?plan=basic&billing=monthly" },
    },
  };
}

function imageTrialPaywallPayload({ imageGensUsed, imageMonthlyLimit, reason }) {
  const isSoftCap = reason === "image_soft_cap_no_credits";
  return {
    success: false,
    code: isSoftCap ? "IMAGE_SOFT_CAP_NO_CREDITS" : "IMAGE_TRIAL_LIMIT_REACHED",
    error: isSoftCap ? "IMAGE_SOFT_CAP_NO_CREDITS" : "IMAGE_TRIAL_LIMIT_REACHED",
    message: isSoftCap
      ? `You've used ${imageGensUsed} free images this month. Add credits or upgrade to continue.`
      : `Not enough credits. You have used ${imageMonthlyLimit} free generations. Upgrade to continue.`,
    imageGensUsed,
    imageMonthlyLimit,
    plans: {
      annual:  { label: "Annual",  price: "$5/mo", href: "/checkout/plan?plan=basic&billing=annual"  },
      monthly: { label: "Monthly", price: "$7/mo", href: "/checkout/plan?plan=basic&billing=monthly" },
    },
  };
}

function apiCreditsPayload({ currentBalance, creditsRequired, seconds }) {
  return {
    success: false,
    code: "INSUFFICIENT_API_CREDITS",
    error: "INSUFFICIENT_API_CREDITS",
    message: "Add API credits to continue generating through the NOVA API.",
    currentApiCredits: currentBalance,
    creditsRequired,
    creditsMissing: Math.max(0, creditsRequired - currentBalance),
    seconds,
    creditsPerSecond: VIDEO_CREDITS_PER_SECOND,
    packs: {
      starter: { label: "Starter", price: "$10",  credits: 140,  href: "/checkout/api-credits?pack=starter" },
      growth:  { label: "Growth",  price: "$25",  credits: 375,  href: "/checkout/api-credits?pack=growth"  },
      pro:     { label: "Pro",     price: "$50",  credits: 800,  href: "/checkout/api-credits?pack=pro"     },
      scale:   { label: "Scale",   price: "$100", credits: 1750, href: "/checkout/api-credits?pack=scale"   },
    },
  };
}


function isForbiddenOrBillingError(err) {
  const msg = String(err?.message || err || "").toLowerCase();
  return (
    msg.includes("forbidden") ||
    msg.includes("permission") ||
    msg.includes("billing") ||
    msg.includes("payment") ||
    msg.includes("quota") ||
    msg.includes("credit") ||
    msg.includes("insufficient") ||
    msg.includes("402") ||
    msg.includes("403")
  );
}

// Construtor de payload puro. A checagem de FAL_KEY que morava aqui referenciava
// endpoint/model/mode/userId, que só existem dentro do POST — era ReferenceError
// garantido. A verificação agora acontece no início do POST, antes de cobrar.
function generationUpgradePayload({ isImage, seconds, endpoint }) {
  const creditsRequired = isImage ? 1 : getModelCreditCost(endpoint || "", seconds);

  return {
    success: false,
    code: isImage ? "IMAGE_TRIAL_LIMIT_REACHED" : "INSUFFICIENT_CREDITS",
    error: isImage ? "IMAGE_TRIAL_LIMIT_REACHED" : "INSUFFICIENT_CREDITS",
    message: isImage
      ? "Not enough credits to generate image. Upgrade to continue."
      : "Not enough credits to generate this video. Upgrade to continue.",
    currentCredits: 0,
    creditsRequired,
    creditsMissing: creditsRequired,
    seconds,
    creditsPerSecond: VIDEO_CREDITS_PER_SECOND,
    plans: {
      annual:  { label: "Annual",  price: "$5/mo", href: "/checkout/plan?plan=basic&billing=annual"  },
      monthly: { label: "Monthly", price: "$7/mo", href: "/checkout/plan?plan=basic&billing=monthly" },
    },
  };
}


function withGeneratedMediaUrls(payload, rawOutput = null) {
  const mediaUrl = extractGeneratedMediaUrl(payload) || extractGeneratedMediaUrl(rawOutput);

  return {
    ...payload,
    mediaUrl,
    videoUrl: payload?.videoUrl || mediaUrl,
    url: payload?.url || mediaUrl,
    outputUrl: payload?.outputUrl || mediaUrl,
    rawOutput: payload?.rawOutput || rawOutput || payload?.rawOutput,
  };
}


function normalizeResolutionForEndpoint(endpoint, value) {
  const raw = String(value || "").toLowerCase();
  const ep = String(endpoint || "");

  if (ep.includes("wan/v2.2-a14b") || ep.includes("hunyuan-video")) {
    return ["480p", "580p", "720p"].includes(raw) ? raw : "480p";
  }

  if (ep.includes("seedance-2.0")) {
    return ["480p", "720p", "1080p"].includes(raw) ? raw : "480p";
  }

  if (ep.includes("pixverse")) {
    return ["360p", "540p", "720p", "1080p"].includes(raw) ? raw : "540p";
  }

  if (ep.includes("veo3.1")) {
    return ["720p", "1080p", "4k"].includes(raw) ? raw : "720p";
  }

  if (ep.includes("happy-horse")) {
    return ["720p", "1080p"].includes(raw) ? raw : "720p";
  }

  return undefined;
}


function normalizeGptImageEndpoint(endpoint, body = {}) {
  const hasReferenceImage = Boolean(body.image_url || body.image_urls?.length);

  if (endpoint === "openai/gpt-image-2" && hasReferenceImage) {
    return "openai/gpt-image-2/edit";
  }

  return endpoint;
}

function normalizeGptImageInput(endpoint, input = {}) {
  if (!String(endpoint || "").includes("openai/gpt-image-2/edit")) {
    return input;
  }

  const referenceUrls = [];

  if (Array.isArray(input.image_urls)) {
    referenceUrls.push(...input.image_urls.filter(Boolean));
  }

  if (input.image_url) {
    referenceUrls.push(input.image_url);
  }

  const uniqueReferenceUrls = [...new Set(referenceUrls)];

  const editPrompt = [
    "Use the uploaded image as the primary reference.",
    "Preserve the same subject, composition, pose, camera angle, lighting, colors, background and overall visual identity unless the user explicitly asks for a change.",
    "Do not redesign or replace the main subject.",
    input.prompt || "",
  ]
    .filter(Boolean)
    .join(" ");

  const normalized = {
    ...input,
    prompt: editPrompt,
    image_urls: uniqueReferenceUrls,
    image_size: "auto",
  };

  delete normalized.image_url;
  delete normalized.aspect_ratio;

  if (!normalized.image_urls.length) {
    delete normalized.image_urls;
  }

  return normalized;
}

function normalizeFalInput(endpoint, input = {}) {
  const safe = normalizeGptImageInput(endpoint, input);

  // Cada modelo aceita um conjunto próprio de resoluções. Mandar "1080p" para
  // um endpoint que só aceita até 720p faz o fal recusar a chamada inteira —
  // e o crédito já foi debitado nesse ponto.
  if (safe.resolution !== undefined) {
    const normalized = normalizeResolutionForEndpoint(endpoint, safe.resolution);
    if (normalized === undefined) delete safe.resolution;
    else safe.resolution = normalized;
  }

  return safe;
}

/** Monta o input do fal a partir do corpo da requisição, sem chaves repetidas. */
function buildFalInput(body, seconds) {
  return {
    prompt: body.prompt || "",
    ...(body.negative_prompt && { negative_prompt: body.negative_prompt }),
    ...(body.image_url && { image_url: body.image_url }),
    ...(body.image_urls && { image_urls: body.image_urls }),
    ...(body.duration && { duration: seconds }),
    ...(body.aspect_ratio && { aspect_ratio: body.aspect_ratio }),
    ...(body.resolution && { resolution: body.resolution }),
    ...(body.num_images && { num_images: body.num_images }),
    ...(body.image_size && { image_size: body.image_size }),
  };
}


export async function POST(req) {
  const apiIdentity = await validateApiKeyFromRequest(req);
  let userId = apiIdentity?.userId || null;
  const isApiRequest = Boolean(apiIdentity);

  if (!userId) {
    const session = await auth();
    userId = session.userId || null;
  }

  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  let { endpoint = "", prompt = "", model = "", mode = "" } = body;
  endpoint = normalizeGptImageEndpoint(endpoint, body);
  const seconds = normalizeSeconds(body.seconds || body.duration);
  const isImage = isImageEndpoint(endpoint) || body.type === "image";
  const creditsRequired = isImage ? 0 : getModelCreditCost(endpoint, seconds);

  if (!endpoint) {
    return NextResponse.json(
      { success: false, error: "MISSING_ENDPOINT", message: "Informe o endpoint do modelo." },
      { status: 400 }
    );
  }

  // Falha cedo, ANTES de cobrar: sem FAL_KEY a geração não tem como funcionar,
  // e debitar crédito para depois estourar no provedor é cobrar por nada.
  if (!process.env.FAL_KEY) {
    console.error("FAL_KEY ausente no ambiente", { endpoint, model, mode, userId });
    return NextResponse.json(
      {
        success: false,
        error: "FAL_KEY is missing on the server.",
        debug: { falEnv: falEnvStatus() },
      },
      { status: 500 }
    );
  }

  // ── Admin bypass ──────────────────────────────────────────────────────────
  const adminCheck = !isApiRequest && (await isAdminUser(userId));
  if (adminCheck) {
    try {
      const falInput = buildFalInput({ ...body, prompt }, seconds);
      const result = await fal.subscribe(endpoint, { input: normalizeFalInput(endpoint, falInput), logs: true });
      const outputUrl =
        result?.video?.url  || result?.videos?.[0]?.url ||
        result?.image?.url  || result?.images?.[0]?.url ||
        result?.output?.url || null;
      logFalSpending({ userId, endpoint, creditsCharged: 0 });
      return NextResponse.json(withGeneratedMediaUrls({ success: true,
        provider: "fal",
        source: "admin",
        data: { type: isImage ? "image" : "video", url: outputUrl, model, mode, seconds, raw: result },
        billing: { creditsCharged: 0, remainingCredits: 999999, wallet: "admin" },
      }, result));
    } catch (err) {
      logFalError("FAL admin generation error", err, {
        endpoint,
        model,
        mode,
        seconds,
        isImage,
        falEnv: falEnvStatus(),
      });

      if (isForbiddenOrBillingError(err)) {
        return NextResponse.json(generationUpgradePayload({ isImage, seconds, endpoint }), { status: 402 });
      }

      return NextResponse.json(
        {
          success: false,
          error: "Não foi possível gerar agora. Tente novamente.",
          debug: {
            source: "admin",
            endpoint,
            model,
            mode,
            seconds,
            falEnv: falEnvStatus(),
            falError: getFalErrorDetails(err),
          },
        },
        { status: 500 }
      );
    }
  }

  // ── Billing ───────────────────────────────────────────────────────────────
  let remainingCredits = null;
  let billingWallet = "dashboard";

  if (isApiRequest) {
    const debit = await debitApiCredits({
      userId,
      amount: isImage ? 1 : creditsRequired,
      apiKeyId: apiIdentity.apiKeyId,
      reason: isImage ? "api_image_generation" : "api_generation",
    });
    if (!debit.ok) {
      return NextResponse.json(
        apiCreditsPayload({ currentBalance: debit.currentBalance, creditsRequired: isImage ? 1 : creditsRequired, seconds }),
        { status: 402 }
      );
    }
    remainingCredits = debit.remainingBalance;
    billingWallet = "api";

  } else if (isImage) {
    const imageCheck = await checkAndDebitImageGen(userId);
    if (!imageCheck.ok) {
      return NextResponse.json(
        imageTrialPaywallPayload({
          imageGensUsed: imageCheck.imageGensUsed,
          imageMonthlyLimit: imageCheck.imageMonthlyLimit,
          reason: imageCheck.reason,
        }),
        { status: 402 }
      );
    }
    billingWallet = imageCheck.creditsCharged ? "image_over_cap" : "image_unlimited";

  } else {
    const account = await ensureUserGenerationAccount(userId);
    if (account.credits < creditsRequired) {
      return NextResponse.json(
        dashboardPaywallPayload({ currentCredits: account.credits, creditsRequired, seconds }),
        { status: 402 }
      );
    }
    const debit = await debitGenerationCredits(userId, creditsRequired);
    if (!debit.ok) {
      return NextResponse.json(
        dashboardPaywallPayload({ currentCredits: debit.currentCredits, creditsRequired, seconds }),
        { status: 402 }
      );
    }
    remainingCredits = debit.remainingCredits;
  }

  // Estorna o que foi cobrado acima. Chamado sempre que a geração falha
  // depois do débito — o usuário não pode pagar por um vídeo que não recebeu.
  async function refundCharge() {
    if (isApiRequest) {
      return refundApiCredits({
        userId,
        amount: isImage ? 1 : creditsRequired,
        apiKeyId: apiIdentity.apiKeyId,
        reason: "generation_failed",
      });
    }
    if (isImage) return refundImageGen(userId);
    return refundGenerationCredits(userId, creditsRequired);
  }

  // ── Call fal.ai ───────────────────────────────────────────────────────────
  try {
    const falInput = buildFalInput({ ...body, prompt }, seconds);

    const result = await fal.subscribe(endpoint, { input: normalizeFalInput(endpoint, falInput), logs: true });

    const outputUrl =
      result?.video?.url  || result?.videos?.[0]?.url ||
      result?.image?.url  || result?.images?.[0]?.url ||
      result?.output?.url || null;

    logFalSpending({ userId, endpoint, creditsCharged: isImage ? 0 : creditsRequired });

    return NextResponse.json(withGeneratedMediaUrls({ success: true,
      provider: "fal",
      source: isApiRequest ? "api" : "dashboard",
      data: {
        type: isImage ? "image" : "video",
        url: outputUrl,
        model,
        mode,
        seconds: isImage ? null : seconds,
        raw: result,
      },
      billing: {
        creditsPerSecond: isImage ? 0 : Math.ceil(creditsRequired / seconds),
        creditsCharged: isImage ? 0 : creditsRequired,
        remainingCredits,
        wallet: billingWallet,
        imageUnlimited: isImage && billingWallet === "image_unlimited",
      },
    }, result));
  } catch (err) {
    logFalError("FAL generation error", err, { endpoint, model, mode, seconds, isImage, falEnv: falEnvStatus() });

    const refunded = await refundCharge();

    if (isForbiddenOrBillingError(err)) {
      return NextResponse.json(
        { ...generationUpgradePayload({ isImage, seconds, endpoint }), refunded },
        { status: 402 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível gerar agora. Tente novamente.",
        refunded,
        message: refunded
          ? "Seus créditos foram devolvidos."
          : "Não conseguimos devolver os créditos automaticamente — fale com o suporte.",
        debug: {
          endpoint,
          model,
          mode,
          seconds,
          falEnv: falEnvStatus(),
          falError: getFalErrorDetails(err),
        },
      },
      { status: 500 }
    );
  }
}
