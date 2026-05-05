import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fal } from "@fal-ai/client";
import { validateApiKeyFromRequest } from "@/lib/apiKeys";
import {
  debitApiCredits,
  debitGenerationCredits,
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

function dashboardPaywallPayload({ currentCredits, creditsRequired, seconds }) {
  return {
    success: false,
    code: "INSUFFICIENT_CREDITS",
    error: "INSUFFICIENT_CREDITS",
    message: "You need more credits to generate this video.",
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
      growth:  { label: "Growth",  price: "$25", credits: 375, href: "/checkout/api-credits?pack=growth"  },
      pro:     { label: "Pro",     price: "$50", credits: 800, href: "/checkout/api-credits?pack=pro"     },
      scale:   { label: "Scale",   price: "$100",credits: 1750,href: "/checkout/api-credits?pack=scale"   },
    },
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
  const { endpoint = "", prompt = "", model = "", mode = "" } = body;
  const seconds = normalizeSeconds(body.seconds || body.duration);
  const creditsRequired = seconds * VIDEO_CREDITS_PER_SECOND;

  // ── Admin bypass ──────────────────────────────────────────────
  const adminCheck = !isApiRequest && await isAdminUser(userId);
  if (adminCheck) {
    try {
      fal.config({ credentials: process.env.FAL_KEY });
      const falInput = {
        prompt,
        ...(body.image_url && { image_url: body.image_url }),
        ...(body.duration && { duration: seconds }),
        ...(body.aspect_ratio && { aspect_ratio: body.aspect_ratio }),
        ...(body.resolution && { resolution: body.resolution }),
      };
      const result = await fal.subscribe(endpoint, { input: falInput, logs: true });
      const outputUrl =
        result?.video?.url || result?.videos?.[0]?.url ||
        result?.image?.url || result?.images?.[0]?.url ||
        result?.output?.url || null;
      const isVideo = String(endpoint).includes("video") || String(endpoint).includes("seedance") || String(endpoint).includes("kling") || String(endpoint).includes("wan");
      return NextResponse.json({
        success: true,
        provider: "fal",
        source: "admin",
        data: { type: isVideo ? "video" : "image", url: outputUrl, model, mode, seconds, raw: result },
        billing: { creditsPerSecond: 0, creditsCharged: 0, remainingCredits: 999999, wallet: "admin" },
      });
    } catch (err) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }
  // ── End admin bypass ────────────────────────────────────────

  let remainingCredits = null;

  if (isApiRequest) {
    const debit = await debitApiCredits({
      userId,
      amount: creditsRequired,
      apiKeyId: apiIdentity.apiKeyId,
      reason: "api_generation",
    });
    if (!debit.ok) {
      return NextResponse.json(apiCreditsPayload({ currentBalance: debit.currentBalance, creditsRequired, seconds }), { status: 402 });
    }
    remainingCredits = debit.remainingBalance;
  } else {
    const account = await ensureUserGenerationAccount(userId);
    if (account.credits < creditsRequired) {
      return NextResponse.json(dashboardPaywallPayload({ currentCredits: account.credits, creditsRequired, seconds }), { status: 402 });
    }
    const debit = await debitGenerationCredits(userId, creditsRequired);
    if (!debit.ok) {
      return NextResponse.json(dashboardPaywallPayload({ currentCredits: debit.currentCredits, creditsRequired, seconds }), { status: 402 });
    }
    remainingCredits = debit.remainingCredits;
  }

  try {
    // Build fal.ai input
    const falInput = {
      prompt,
      ...(body.image_url && { image_url: body.image_url }),
      ...(body.duration && { duration: seconds }),
      ...(body.aspect_ratio && { aspect_ratio: body.aspect_ratio }),
      ...(body.resolution && { resolution: body.resolution }),
    };

    const result = await fal.subscribe(endpoint, {
      input: falInput,
      logs: true,
    });

    const outputUrl =
      result?.video?.url ||
      result?.videos?.[0]?.url ||
      result?.image?.url ||
      result?.images?.[0]?.url ||
      result?.output?.url ||
      null;

    const isVideo = String(endpoint).includes("video") || String(endpoint).includes("seedance") || String(endpoint).includes("kling") || String(endpoint).includes("wan");

    return NextResponse.json({
      success: true,
      provider: "fal",
      source: isApiRequest ? "api" : "dashboard",
      data: {
        type: isVideo ? "video" : "image",
        url: outputUrl,
        model,
        mode,
        seconds,
        raw: result,
      },
      billing: {
        creditsPerSecond: VIDEO_CREDITS_PER_SECOND,
        creditsCharged: creditsRequired,
        remainingCredits,
        wallet: isApiRequest ? "api" : "dashboard",
      },
    });
  } catch (err) {
    console.error("FAL generation error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
