import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { auth } from "@clerk/nextjs/server";
import { getMediaModel, estimateCredits } from "@/lib/mediaCapabilities";
import { extractFirstUrl, safeErrorMessage } from "@/lib/falResultUtils";
import { logFalSpending } from "@/lib/falSpending";
import {
  debitGenerationCredits,
  ensureUserGenerationAccount,
  isAdminUser,
  refundGenerationCredits,
} from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 300;

fal.config({ credentials: process.env.FAL_KEY });

function paywallPayload({ currentCredits, creditsRequired }) {
  return {
    success: false,
    code: "INSUFFICIENT_CREDITS",
    error: "INSUFFICIENT_CREDITS",
    message: "Not enough credits to generate audio. Upgrade to continue.",
    currentCredits,
    creditsRequired,
    creditsMissing: Math.max(0, creditsRequired - currentCredits),
    plans: {
      annual: { label: "Annual", price: "$5/mo", href: "/checkout/plan?plan=basic&billing=annual" },
      monthly: { label: "Monthly", price: "$7/mo", href: "/checkout/plan?plan=basic&billing=monthly" },
    },
  };
}

export async function POST(request) {
  let userId = null;
  let creditsRequired = 0;
  let charged = false;

  try {
    const session = await auth();
    userId = session.userId;

    if (!userId) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await request.json();
    const text = String(body.text || "").trim();
    const modelId = body.modelId || "chatterboxhd-tts";
    const model = getMediaModel(modelId);

    if (!model || model.type !== "audio") {
      return NextResponse.json({ success: false, error: "INVALID_AUDIO_MODEL" }, { status: 400 });
    }

    if (!text || text.length < 3) {
      return NextResponse.json({ success: false, error: "TEXT_REQUIRED" }, { status: 400 });
    }

    if (text.length > (model.maxCharacters || 2500)) {
      return NextResponse.json({
        success: false,
        error: "TEXT_TOO_LONG",
        message: `Maximum ${model.maxCharacters || 2500} characters allowed.`,
      }, { status: 400 });
    }

    creditsRequired = estimateCredits(modelId);

    // Esta rota rodava sem cobrar nada (havia um TODO no lugar do débito),
    // então toda narração gerada saía do bolso da NOVA. Agora debita antes
    // de chamar o provedor e estorna se a geração falhar.
    const admin = await isAdminUser(userId);

    if (!admin) {
      const account = await ensureUserGenerationAccount(userId);

      if (account.credits < creditsRequired) {
        return NextResponse.json(
          paywallPayload({ currentCredits: account.credits, creditsRequired }),
          { status: 402 }
        );
      }

      const debit = await debitGenerationCredits(userId, creditsRequired);

      if (!debit.ok) {
        return NextResponse.json(
          paywallPayload({ currentCredits: debit.currentCredits, creditsRequired }),
          { status: 402 }
        );
      }

      charged = true;
    }

    const result = await fal.subscribe(model.endpoint, {
      input: {
        text,
        voice: body.voice || body.voiceId || undefined,
      },
      logs: true,
    });

    const audioUrl = extractFirstUrl(result, "audio");

    if (audioUrl) {
      logFalSpending({ userId, endpoint: model.endpoint, creditsCharged: charged ? creditsRequired : 0 });
    }

    if (!audioUrl) {
      const refunded = charged ? await refundGenerationCredits(userId, creditsRequired) : false;
      return NextResponse.json({
        success: false,
        error: "NO_AUDIO_URL_RETURNED",
        refunded,
        raw: result,
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      modelId,
      endpoint: model.endpoint,
      creditsCharged: charged ? creditsRequired : 0,
      creditsRequired,
      audioUrl,
      result,
    });
  } catch (error) {
    console.error("Audio generation failed:", error);

    const refunded = charged ? await refundGenerationCredits(userId, creditsRequired) : false;

    return NextResponse.json({
      success: false,
      error: "AUDIO_GENERATION_FAILED",
      message: safeErrorMessage(error),
      refunded,
    }, { status: 500 });
  }
}
