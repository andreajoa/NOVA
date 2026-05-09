import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { validateApiKeyFromRequest } from "@/lib/apiKeys";
import { debitApiCredits } from "@/lib/db";
import { falModels } from "@/lib/falModels";

export const NOVA_API_CREDIT_MINIMUM_URL = "/checkout/api-credits?pack=starter";
export const NOVA_API_CREDIT_MINIMUM_PRICE = "$10";
export const VIDEO_CREDITS_PER_SECOND = 24;

fal.config({ credentials: process.env.FAL_KEY });

export function novaApiCreditsRequiredPayload({
  currentBalance = 0,
  creditsRequired = 0,
  reason = "NOVA API credits are required to use NOVA from Claude AI.",
} = {}) {
  return {
    success: false,
    code: "NOVA_API_CREDITS_REQUIRED",
    error: "NOVA_API_CREDITS_REQUIRED",
    message:
      "NOVA API credits required. Minimum purchase is $10 to use NOVA tools from Claude AI.",
    reason,
    currentApiCredits: currentBalance,
    creditsRequired,
    creditsMissing: Math.max(0, Number(creditsRequired) - Number(currentBalance)),
    minimumPurchase: NOVA_API_CREDIT_MINIMUM_PRICE,
    checkoutUrl: NOVA_API_CREDIT_MINIMUM_URL,
    packs: {
      starter: {
        label: "Starter",
        price: "$10",
        credits: 140,
        href: NOVA_API_CREDIT_MINIMUM_URL,
      },
      growth: {
        label: "Growth",
        price: "$25",
        credits: 375,
        href: "/checkout/api-credits?pack=growth",
      },
      pro: {
        label: "Pro",
        price: "$50",
        credits: 800,
        href: "/checkout/api-credits?pack=pro",
      },
    },
  };
}

export async function requireNovaApiCredits(req, amount) {
  const identity = await validateApiKeyFromRequest(req);

  if (!identity?.userId) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          code: "NOVA_API_KEY_REQUIRED",
          error: "NOVA_API_KEY_REQUIRED",
          message:
            "Connect Claude AI using a NOVA API key. API credits are required before generation.",
          checkoutUrl: NOVA_API_CREDIT_MINIMUM_URL,
          minimumPurchase: NOVA_API_CREDIT_MINIMUM_PRICE,
        },
        { status: 401 }
      ),
    };
  }

  const debit = await debitApiCredits({
    userId: identity.userId,
    amount,
    apiKeyId: identity.apiKeyId,
    reason: "claude_connector_generation",
  });

  if (!debit.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        novaApiCreditsRequiredPayload({
          currentBalance: debit.currentBalance,
          creditsRequired: amount,
        }),
        { status: 402 }
      ),
    };
  }

  return {
    ok: true,
    identity,
    remainingBalance: debit.remainingBalance,
    charged: amount,
  };
}

export function getImageEndpoint(modelKey = "flux-schnell", modeKey = "text-to-image") {
  const model = falModels.image?.[modelKey] || falModels.image?.["flux-schnell"];
  const mode = model?.modes?.[modeKey] || model?.modes?.["text-to-image"] || Object.values(model?.modes || {})[0];

  return {
    modelKey,
    modeKey,
    model,
    mode,
    endpoint: mode?.endpoint,
  };
}

export function getVideoEndpoint(modelKey = "seedance", modeKey = "text-to-video") {
  const model = falModels.video?.[modelKey] || falModels.video?.seedance;
  const mode = model?.modes?.[modeKey] || model?.modes?.["text-to-video"] || Object.values(model?.modes || {})[0];

  return {
    modelKey,
    modeKey,
    model,
    mode,
    endpoint: mode?.endpoint,
  };
}

export function outputUrlsFromFal(result) {
  const urls = [];

  if (result?.video?.url) urls.push(result.video.url);
  if (Array.isArray(result?.videos)) {
    result.videos.forEach((item) => item?.url && urls.push(item.url));
  }

  if (result?.image?.url) urls.push(result.image.url);
  if (Array.isArray(result?.images)) {
    result.images.forEach((item) => item?.url && urls.push(item.url));
  }

  if (result?.output?.url) urls.push(result.output.url);
  if (result?.url) urls.push(result.url);

  return [...new Set(urls)].filter(Boolean);
}

export async function runFal(endpoint, input) {
  if (!endpoint) {
    throw new Error("NOVA model endpoint not found.");
  }

  return fal.subscribe(endpoint, {
    input,
    logs: true,
  });
}
