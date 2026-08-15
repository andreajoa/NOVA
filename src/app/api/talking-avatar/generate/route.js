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

async function generateAudioFromScript({ script, voice }) {
  const audioModel = getMediaModel("chatterboxhd-tts");
  const result = await fal.subscribe(audioModel.endpoint, {
    input: { text: script, voice: voice || undefined },
    logs: true,
  });
  return extractFirstUrl(result, "audio");
}

export async function POST(request) {
  // Declarados fora do try para o catch conseguir estornar. Se ficarem dentro,
  // o catch referencia variável fora de escopo e o estorno nunca acontece.
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
    const imageUrl = String(body.imageUrl || "").trim();
    const script = String(body.script || "").trim();
    let audioUrl = String(body.audioUrl || "").trim();
    const modelId = body.modelId || "wan-2-2-speech";
    const model = getMediaModel(modelId);

    if (!model || model.type !== "talking-avatar") {
      return NextResponse.json({ success: false, error: "INVALID_TALKING_AVATAR_MODEL" }, { status: 400 });
    }
    if (!imageUrl && model.requiresImage) {
      return NextResponse.json({ success: false, error: "IMAGE_URL_REQUIRED" }, { status: 400 });
    }
    if (!audioUrl && !script) {
      return NextResponse.json({ success: false, error: "SCRIPT_OR_AUDIO_REQUIRED" }, { status: 400 });
    }

    creditsRequired =
      estimateCredits(modelId, { seconds: body.seconds || 5 }) +
      (script ? estimateCredits("chatterboxhd-tts") : 0);

    const admin = await isAdminUser(userId);
    if (!admin) {
      // Debitar ANTES de qualquer geração para eliminar race condition.
      // Se áudio ou vídeo falhar, o catch faz refund.
      const debit = await debitGenerationCredits(userId, creditsRequired);
      if (!debit.ok) {
        return NextResponse.json({
          success: false,
          code: "INSUFFICIENT_CREDITS",
          error: "INSUFFICIENT_CREDITS",
          message: "Not enough credits to generate. Upgrade to continue.",
          currentCredits: debit.currentCredits,
          creditsRequired,
          creditsMissing: Math.max(0, creditsRequired - debit.currentCredits),
          plans: {
            annual:  { label: "Annual",  price: "$5/mo", href: "/checkout/plan?plan=basic&billing=annual" },
            monthly: { label: "Monthly", price: "$7/mo", href: "/checkout/plan?plan=basic&billing=monthly" },
          },
        }, { status: 402 });
      }
      charged = true;
    }

    if (!audioUrl && script) {
      audioUrl = await generateAudioFromScript({ script, voice: body.voice });
    }
    if (!audioUrl) {
      const refunded = charged ? await refundGenerationCredits(userId, creditsRequired) : false;
      return NextResponse.json({ success: false, error: "AUDIO_GENERATION_FAILED", refunded }, { status: 502 });
    }

    const input = {
      image_url: imageUrl,
      audio_url: audioUrl,
      prompt: body.prompt || "Natural talking head video, realistic facial expressions, professional lighting.",
      duration: body.seconds || 5,
    };

    const result = await fal.subscribe(model.endpoint, { input, logs: true });
    const videoUrl = extractFirstUrl(result, "video");

    if (videoUrl) {
      logFalSpending({ userId, endpoint: model.endpoint, creditsCharged: creditsRequired });
    }

    if (!videoUrl) {
      const refunded = charged ? await refundGenerationCredits(userId, creditsRequired) : false;
      return NextResponse.json({
        success: false,
        error: "NO_VIDEO_URL_RETURNED",
        audioUrl,
        refunded,
        raw: result,
      }, { status: 502 });
    }

    // Havia aqui um window.dispatchEvent — API de browser dentro de um route
    // handler. `window?.` NÃO protege identificador não declarado: isso lançava
    // ReferenceError DEPOIS de cobrar e gerar, devolvendo 500 com o vídeo pronto
    // e o crédito já debitado. O refresh de saldo é responsabilidade do client,
    // que dispara o evento ao receber esta resposta.
    return NextResponse.json({
      success: true,
      modelId,
      endpoint: model.endpoint,
      creditsCharged: admin ? 0 : creditsRequired,
      audioUrl,
      videoUrl,
      result,
    });
  } catch (error) {
    console.error("Talking avatar failed:", error);

    const refunded = charged ? await refundGenerationCredits(userId, creditsRequired) : false;

    return NextResponse.json({
      success: false,
      error: "TALKING_AVATAR_FAILED",
      message: safeErrorMessage(error),
      refunded,
    }, { status: 500 });
  }
}
