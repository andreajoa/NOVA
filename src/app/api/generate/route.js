import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  debitGenerationCredits,
  ensureUserGenerationAccount,
} from "@/lib/db";

export const runtime = "nodejs";

const VIDEO_CREDITS_PER_SECOND = 24;
const DEFAULT_SECONDS = 5;
const MAX_SECONDS = 30;

function normalizeSeconds(value) {
  const n = Number(value || DEFAULT_SECONDS);
  if (!Number.isFinite(n)) return DEFAULT_SECONDS;
  return Math.max(1, Math.min(MAX_SECONDS, Math.ceil(n)));
}

function paywallPayload({ currentCredits, creditsRequired, seconds }) {
  return {
    success: false,
    code: "INSUFFICIENT_CREDITS",
    error: "INSUFFICIENT_CREDITS",
    message: "You need an active NOVA plan to generate this video.",
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
        href: "/pricing?plan=basic&billing=annual",
      },
      monthly: {
        label: "Monthly",
        price: "$7/mo",
        description: "Monthly billing. Cancel anytime.",
        href: "/pricing?plan=basic&billing=monthly",
      },
    },
  };
}

export async function POST(req) {
  const { userId } = await auth();

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

  const account = await ensureUserGenerationAccount(userId);

  if (account.credits < creditsRequired) {
    return NextResponse.json(
      paywallPayload({
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
      paywallPayload({
        currentCredits: debit.currentCredits,
        creditsRequired,
        seconds,
      }),
      { status: 402 }
    );
  }

  console.log("NOVA GENERATE REQUEST:", {
    userId,
    endpoint,
    prompt,
    model,
    mode,
    seconds,
    creditsRequired,
  });

  // Ainda mock por enquanto. Próximo passo: conectar fal.ai aqui.
  return NextResponse.json({
    success: true,
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
      remainingCredits: debit.remainingCredits,
    },
  });
}
