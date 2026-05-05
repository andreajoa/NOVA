import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { validateApiKeyFromRequest } from "@/lib/apiKeys";
import {
  debitApiCredits,
  debitGenerationCredits,
  ensureUserGenerationAccount,
} from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VIDEO_CREDITS_PER_SECOND = 24;
const DEFAULT_SECONDS = 5;
const MAX_SECONDS = 30;

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
      annual: {
        label: "Annual",
        price: "$5/mo",
        description: "Billed annually. Best value.",
        href: "/api/checkout?plan=basic&billing=annual",
      },
      monthly: {
        label: "Monthly",
        price: "$7/mo",
        description: "Monthly billing. Cancel anytime.",
        href: "/api/checkout?plan=basic&billing=monthly",
      },
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
      starter: { label: "Starter", price: "$10", credits: 140, href: "/api/checkout/api-credits?pack=starter" },
      growth: { label: "Growth", price: "$25", credits: 375, href: "/api/checkout/api-credits?pack=growth" },
      pro: { label: "Pro", price: "$50", credits: 800, href: "/api/checkout/api-credits?pack=pro" },
      scale: { label: "Scale", price: "$100", credits: 1750, href: "/api/checkout/api-credits?pack=scale" },
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
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { endpoint = "", prompt = "", model = "", mode = "" } = body;

  const seconds = normalizeSeconds(body.seconds || body.duration);
  const creditsRequired = seconds * VIDEO_CREDITS_PER_SECOND;

  let remainingCredits = null;

  if (isApiRequest) {
    const debit = await debitApiCredits({
      userId,
      amount: creditsRequired,
      apiKeyId: apiIdentity.apiKeyId,
      reason: "api_generation_mock",
    });

    if (!debit.ok) {
      return NextResponse.json(
        apiCreditsPayload({
          currentBalance: debit.currentBalance,
          creditsRequired,
          seconds,
        }),
        { status: 402 }
      );
    }

    remainingCredits = debit.remainingBalance;
  } else {
    const account = await ensureUserGenerationAccount(userId);

    if (account.credits < creditsRequired) {
      return NextResponse.json(
        dashboardPaywallPayload({
          currentCredits: account.credits,
          creditsRequired,
          seconds,
        }),
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

  console.log("NOVA GENERATE MOCK:", {
    source: isApiRequest ? "api" : "dashboard",
    userId,
    apiKeyId: apiIdentity?.apiKeyId || null,
    endpoint,
    prompt,
    model,
    mode,
    seconds,
    creditsRequired,
  });

  return NextResponse.json({
    success: true,
    provider: "mock",
    source: isApiRequest ? "api" : "dashboard",
    data: {
      type: String(endpoint).includes("video") ? "video" : "image",
      url: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
      model,
      mode,
      seconds,
    },
    billing: {
      creditsPerSecond: VIDEO_CREDITS_PER_SECOND,
      creditsCharged: creditsRequired,
      remainingCredits,
      wallet: isApiRequest ? "api" : "dashboard",
    },
  });
}
