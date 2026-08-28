import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fal } from "@fal-ai/client";
import { validateApiKeyFromRequest } from "@/lib/apiKeys";
import { extractGeneratedMediaUrl } from "@/lib/generatedMediaUrl";
import { resolveGenerationSelection } from "@/lib/generationCatalog";
import {
  checkAndDebitFreeGeneration,
  refundFreeGeneration,
} from "@/lib/freeGenerationQuota";
import { freeImageDimensions } from "@/lib/openModelWorkflows";
import { runOnRunPod, shouldUseRunPod } from "@/lib/runpodClient";
import {
  debitApiCredits,
  debitGenerationCredits,
  checkAndDebitImageGen,
  ensureUserGenerationAccount,
  isAdminUser,
} from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VIDEO_CREDITS_PER_SECOND = 24;
const DEFAULT_SECONDS = 5;
const MAX_SECONDS = 30;

fal.config({ credentials: process.env.FAL_KEY });

function normalizeSeconds(value) {
  const n = Number(value || DEFAULT_SECONDS);
  if (!Number.isFinite(n)) return DEFAULT_SECONDS;
  return Math.max(1, Math.min(MAX_SECONDS, Math.ceil(n)));
}

function getFalErrorDetails(err) {
  return {
    name: err?.name || null,
    message: err?.message || String(err),
    status: err?.status || err?.statusCode || err?.response?.status || null,
    body: err?.body || err?.response?.body || err?.response?.data || null,
    cause: err?.cause?.message || null,
  };
}

function falEnvStatus() {
  const key = process.env.FAL_KEY || "";
  return {
    exists: Boolean(key),
    length: key.length,
    hasColon: key.includes(":"),
    prefix: key ? `${key.slice(0, 8)}...` : null,
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
      annual: { label: "Annual", price: "$5/mo", href: "/checkout/plan?plan=basic&billing=annual" },
      monthly: { label: "Monthly", price: "$7/mo", href: "/checkout/plan?plan=basic&billing=monthly" },
    },
  };
}

function imageTrialPaywallPayload({ imageGensUsed, imageMonthlyLimit }) {
  return {
    success: false,
    code: "IMAGE_TRIAL_LIMIT_REACHED",
    error: "IMAGE_TRIAL_LIMIT_REACHED",
    message: `Not enough credits. You have used ${imageMonthlyLimit} included image generations. Upgrade to continue.`,
    imageGensUsed,
    imageMonthlyLimit,
    plans: {
      annual: { label: "Annual", price: "$5/mo", href: "/checkout/plan?plan=basic&billing=annual" },
      monthly: { label: "Monthly", price: "$7/mo", href: "/checkout/plan?plan=basic&billing=monthly" },
    },
  };
}

function freeLimitPayload({ kind, used, limit }) {
  const noun = kind === "video" ? "video" : "image";
  return {
    success: false,
    code: "FREE_MODEL_LIMIT_REACHED",
    error: "FREE_MODEL_LIMIT_REACHED",
    message: `You used your ${limit} free ${noun}${limit === 1 ? "" : "s"} for this month. Upgrade for more generations and premium models.`,
    kind,
    freeUsed: used,
    freeLimit: limit,
    freeRemaining: Math.max(0, limit - used),
    plans: {
      annual: { label: "Annual", price: "$5/mo", href: "/checkout/plan?plan=basic&billing=annual" },
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
      starter: { label: "Starter", price: "$10", credits: 140, href: "/checkout/api-credits?pack=starter" },
      growth: { label: "Growth", price: "$25", credits: 375, href: "/checkout/api-credits?pack=growth" },
      pro: { label: "Pro", price: "$50", credits: 800, href: "/checkout/api-credits?pack=pro" },
      scale: { label: "Scale", price: "$100", credits: 1750, href: "/checkout/api-credits?pack=scale" },
    },
  };
}

function normalizeGptImageInput(endpoint, input = {}) {
  if (!String(endpoint || "").includes("openai/gpt-image-2/edit")) return input;

  const referenceUrls = [];
  if (Array.isArray(input.image_urls)) referenceUrls.push(...input.image_urls.filter(Boolean));
  if (input.image_url) referenceUrls.push(input.image_url);

  const normalized = {
    ...input,
    prompt: [
      "Use the uploaded image as the primary reference.",
      "Preserve the same subject, composition, pose, camera angle, lighting, colors, background and overall visual identity unless the user explicitly asks for a change.",
      "Do not redesign or replace the main subject.",
      input.prompt || "",
    ].filter(Boolean).join(" "),
    image_urls: [...new Set(referenceUrls)],
    image_size: "auto",
  };

  delete normalized.image_url;
  delete normalized.aspect_ratio;
  if (!normalized.image_urls.length) delete normalized.image_urls;
  return normalized;
}

function normalizeResolutionForEndpoint(endpoint, value) {
  const raw = String(value || "").toLowerCase();
  const ep = String(endpoint || "");
  if (!raw) return undefined;

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
  return value;
}

function normalizeWan21Aspect(value, imageToVideo = false) {
  const raw = String(value || "");
  if (imageToVideo && raw === "1:1") return "1:1";
  if (raw === "9:16") return "9:16";
  return "16:9";
}

function buildFreeInput(selection, body, prompt) {
  if (selection.type === "image") {
    const dimensions = freeImageDimensions(body.aspect_ratio || "1:1");
    const input = {
      prompt,
      image_size: dimensions,
      num_images: 1,
      seed: Number.isFinite(Number(body.seed)) ? Number(body.seed) : undefined,
      enable_safety_checker: true,
      output_format: "png",
      aspect_ratio: body.aspect_ratio || "1:1",
    };

    if (selection.modelKey === "flux-schnell") input.num_inference_steps = 4;
    if (selection.modelKey === "z-image-turbo") input.num_inference_steps = 8;
    if (body.image_url) input.image_url = body.image_url;
    if (body.strength != null) input.strength = Number(body.strength);
    return input;
  }

  if (selection.modelKey === "wan21-free") {
    const imageToVideo = selection.modeKey === "image-to-video";
    return {
      prompt,
      ...(body.negative_prompt && { negative_prompt: body.negative_prompt }),
      ...(imageToVideo && body.image_url && { image_url: body.image_url }),
      num_frames: 81,
      frames_per_second: 16,
      resolution: "480p",
      aspect_ratio: normalizeWan21Aspect(body.aspect_ratio, imageToVideo),
      num_inference_steps: 30,
      enable_safety_checker: true,
      enable_prompt_expansion: false,
      ...(selection.modeKey === "text-to-video" && { turbo_mode: true }),
      ...(selection.modeKey === "image-to-video" && { acceleration: "regular" }),
      duration: 5,
    };
  }

  return { prompt };
}

function buildStandardInput(selection, body, prompt, seconds) {
  return {
    prompt,
    ...(body.negative_prompt && { negative_prompt: body.negative_prompt }),
    ...(body.image_url && { image_url: body.image_url }),
    ...(body.image_urls && { image_urls: body.image_urls }),
    ...(body.duration && { duration: seconds }),
    ...(body.aspect_ratio && { aspect_ratio: body.aspect_ratio }),
    ...(body.resolution && {
      resolution: normalizeResolutionForEndpoint(selection.endpoint, body.resolution),
    }),
    ...(body.num_images && { num_images: body.num_images }),
    ...(body.image_size && { image_size: body.image_size }),
  };
}

function normalizeFalInput(selection, input) {
  const endpoint = selection.endpoint;
  let safe = { ...input };

  if (selection.modelKey === "wan21-free") {
    delete safe.duration;
    if (selection.modeKey === "image-to-video") delete safe.turbo_mode;
  }

  if (selection.modelKey === "z-image-turbo" || selection.modelKey === "flux-schnell") {
    delete safe.aspect_ratio;
    delete safe.negative_prompt;
  }

  safe = normalizeGptImageInput(endpoint, safe);
  return Object.fromEntries(Object.entries(safe).filter(([, value]) => value !== undefined));
}

function mediaExists(value, seen = new Set()) {
  if (!value) return false;
  if (typeof value === "string") {
    return /^(https?:\/\/|data:(image|video)\/)/i.test(value);
  }
  if (typeof value !== "object" || seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.some((item) => mediaExists(item, seen));
  return Object.values(value).some((item) => mediaExists(item, seen));
}

async function executeGeneration(selection, input) {
  const target = selection.runpodTarget || selection.endpoint;

  if (selection.model?.providerPreference === "runpod" && shouldUseRunPod(target)) {
    try {
      const output = await runOnRunPod(target, input);
      if (!mediaExists(output)) throw new Error("RunPod completed without a media output");
      return { provider: "runpod", output, raw: output };
    } catch (error) {
      console.warn("[NOVA_OPEN_MODEL] RunPod failed; falling back to fal.ai", {
        model: selection.modelKey,
        mode: selection.modeKey,
        error: error?.message || String(error),
      });
    }
  }

  if (!process.env.FAL_KEY) {
    throw new Error("No generation provider is currently available for this model.");
  }

  const falResult = await fal.subscribe(selection.endpoint, {
    input: normalizeFalInput(selection, input),
    logs: true,
  });
  const output = falResult?.data ?? falResult;
  if (!mediaExists(output)) throw new Error("fal.ai completed without a media output");
  return { provider: "fal", output, raw: falResult };
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
  const prompt = String(body.prompt || "").trim();
  if (!prompt) {
    return NextResponse.json({ success: false, error: "Prompt is required." }, { status: 400 });
  }

  const selection = resolveGenerationSelection({
    model: body.model,
    mode: body.mode,
    body,
  });

  if (!selection) {
    return NextResponse.json(
      { success: false, error: "Unknown or unsupported NOVA model/mode." },
      { status: 400 }
    );
  }

  if (selection.mode?.needsImage && !body.image_url && !body.image_urls?.length) {
    return NextResponse.json(
      { success: false, error: "This generation mode requires a reference image." },
      { status: 400 }
    );
  }

  const requestedSeconds = normalizeSeconds(body.seconds || body.duration);
  const seconds = selection.isFree && selection.type === "video" ? 5 : requestedSeconds;
  const creditsRequired = seconds * VIDEO_CREDITS_PER_SECOND;
  const isImage = selection.type === "image";
  const adminCheck = !isApiRequest && (await isAdminUser(userId));

  let remainingCredits = null;
  let billingWallet = "dashboard";
  let freeQuotaDebit = null;

  if (!adminCheck) {
    if (isApiRequest) {
      const apiDebitAmount = isImage ? 1 : creditsRequired;
      const debit = await debitApiCredits({
        userId,
        amount: apiDebitAmount,
        apiKeyId: apiIdentity.apiKeyId,
        reason: isImage ? "api_image_generation" : "api_generation",
      });
      if (!debit.ok) {
        return NextResponse.json(
          apiCreditsPayload({
            currentBalance: debit.currentBalance,
            creditsRequired: apiDebitAmount,
            seconds,
          }),
          { status: 402 }
        );
      }
      remainingCredits = debit.remainingBalance;
      billingWallet = "api";
    } else if (selection.isFree) {
      freeQuotaDebit = await checkAndDebitFreeGeneration(userId, selection.freeQuotaKind);
      if (!freeQuotaDebit.ok) {
        return NextResponse.json(
          freeLimitPayload({
            kind: selection.freeQuotaKind,
            used: freeQuotaDebit.used,
            limit: freeQuotaDebit.limit,
          }),
          { status: 402 }
        );
      }
      billingWallet = "free_open";
    } else if (isImage) {
      const imageCheck = await checkAndDebitImageGen(userId);
      if (!imageCheck.ok) {
        return NextResponse.json(
          imageTrialPaywallPayload({
            imageGensUsed: imageCheck.imageGensUsed,
            imageMonthlyLimit: imageCheck.imageMonthlyLimit,
          }),
          { status: 402 }
        );
      }
      billingWallet = "image_plan";
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
          dashboardPaywallPayload({
            currentCredits: debit.currentCredits,
            creditsRequired,
            seconds,
          }),
          { status: 402 }
        );
      }
      remainingCredits = debit.remainingCredits;
    }
  } else {
    billingWallet = "admin";
    remainingCredits = 999999;
  }

  const generationInput = selection.isFree
    ? buildFreeInput(selection, body, prompt)
    : buildStandardInput(selection, body, prompt, seconds);

  try {
    const execution = await executeGeneration(selection, generationInput);
    const outputUrl = extractGeneratedMediaUrl(execution.output) || null;

    return NextResponse.json(
      withGeneratedMediaUrls(
        {
          success: true,
          provider: execution.provider,
          source: adminCheck ? "admin" : isApiRequest ? "api" : "dashboard",
          data: {
            type: selection.type,
            url: outputUrl,
            model: selection.modelKey,
            mode: selection.modeKey,
            seconds: isImage ? null : seconds,
            raw: execution.output,
          },
          billing: {
            creditsPerSecond: isImage ? 0 : VIDEO_CREDITS_PER_SECOND,
            creditsCharged:
              adminCheck || (!isApiRequest && selection.isFree)
                ? 0
                : isApiRequest
                  ? (isImage ? 1 : creditsRequired)
                  : isImage
                    ? 0
                    : creditsRequired,
            remainingCredits,
            wallet: billingWallet,
            freeModel: selection.isFree,
            ...(freeQuotaDebit && {
              freeUsed: freeQuotaDebit.used,
              freeLimit: freeQuotaDebit.limit,
              freeRemaining: freeQuotaDebit.remaining,
            }),
          },
        },
        execution.raw
      )
    );
  } catch (err) {
    if (freeQuotaDebit?.ok && !isApiRequest && !adminCheck) {
      await refundFreeGeneration(userId, selection.freeQuotaKind).catch((refundError) => {
        console.error("[NOVA_OPEN_MODEL] failed to refund free quota", refundError);
      });
    }

    console.error("NOVA generation error", {
      model: selection.modelKey,
      mode: selection.modeKey,
      endpoint: selection.endpoint,
      type: selection.type,
      freeModel: selection.isFree,
      falEnv: falEnvStatus(),
      error: getFalErrorDetails(err),
    });

    return NextResponse.json(
      {
        success: false,
        code: "GENERATION_PROVIDER_UNAVAILABLE",
        error: "Generation is temporarily unavailable. Please try again.",
        message: "Generation is temporarily unavailable. Please try again.",
      },
      { status: 503 }
    );
  }
}
