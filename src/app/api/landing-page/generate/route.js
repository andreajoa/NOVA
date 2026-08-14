import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isNovaAdminFromAuth, novaAdminBypassResult } from "@/lib/novaAdminAccess";
import { generateCompleteLandingPackage } from "@/lib/novaCompleteLanding";
import {
  LANDING_PAGE_WITH_IMAGES,
  landingPricingPublic,
} from "@/lib/novaLandingPricing";
import {
  ensureUserGenerationAccount,
  debitGenerationCredits,
  refundGenerationCredits,
} from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Cobrança de créditos internos da NOVA.
 *
 * A versão anterior procurava um client Prisma em @/lib/db (mod.prisma ||
 * mod.db || mod.default) — nenhum deles existe: o projeto fala com o D1 por
 * REST. getDb() devolvia null sempre, então esta rota retornava
 * NOVA_DB_NOT_FOUND 500 para todo usuário não-admin. A landing page nunca
 * funcionou para cliente pagante.
 */
async function chargeInternalCredits({ clerkUserId, amount }) {
  const account = await ensureUserGenerationAccount(clerkUserId);

  if (account.credits < amount) {
    return {
      ok: false,
      status: 402,
      code: "NOVA_INTERNAL_CREDITS_REQUIRED",
      message: "Not enough credits to generate this landing page. Upgrade to continue.",
      requiredCredits: amount,
      currentBalance: account.credits,
      checkoutUrl: "/pricing",
    };
  }

  const debit = await debitGenerationCredits(clerkUserId, amount);

  if (!debit.ok) {
    return {
      ok: false,
      status: 402,
      code: "NOVA_INTERNAL_CREDITS_REQUIRED",
      message: "Not enough credits to generate this landing page. Upgrade to continue.",
      requiredCredits: amount,
      currentBalance: debit.currentCredits,
      checkoutUrl: "/pricing",
    };
  }

  return {
    ok: true,
    identity: { userId: clerkUserId },
    charged: amount,
    remainingBalance: debit.remainingCredits,
    refund: async () => refundGenerationCredits(clerkUserId, amount),
  };
}

export async function GET() {
  return json({
    success: true,
    endpoint: "/api/landing-page/generate",
    description:
      "Rota interna da NOVA para gerar landing page completa com layout, copy, 4 imagens IA e ZIP.",
    auth: "Usuário logado na NOVA. Não precisa API Key.",
    credits: {
      wallet: "internal_nova_credits",
      required: LANDING_PAGE_WITH_IMAGES.novaCreditsRequired,
    },
    pricing: landingPricingPublic(),
  });
}

export async function POST(req) {
  const session = await auth();

  if (!session?.userId) {
    return json(
      {
        success: false,
        code: "AUTH_REQUIRED",
        error: "AUTH_REQUIRED",
        message: "Faça login na NOVA para gerar landing pages.",
      },
      401
    );
  }

  const body = await req.json().catch(() => ({}));

  const charge = (await isNovaAdminFromAuth(session.userId, session.sessionClaims))
    ? novaAdminBypassResult({
        identity: { userId: session.userId, novaAdminBypass: true },
      })
    : await chargeInternalCredits({
        clerkUserId: session.userId,
        amount: LANDING_PAGE_WITH_IMAGES.novaCreditsRequired,
      });

  if (!charge.ok) {
    return json(
      {
        success: false,
        code: charge.code,
        error: charge.code,
        message: charge.message,
        requiredCredits: charge.requiredCredits,
        currentBalance: charge.currentBalance,
        checkoutUrl: charge.checkoutUrl || "/pricing",
        debug: charge.debug,
      },
      charge.status || 402
    );
  }

  try {
    const result = await generateCompleteLandingPackage({
      body,
      gate: {
        identity: { userId: session.userId },
      },
    });

    return json({
      success: true,
      ...result,
      billing: {
        wallet: "internal_nova_credits",
        creditsCharged: LANDING_PAGE_WITH_IMAGES.novaCreditsRequired,
        remainingCredits: charge.remainingBalance,
      },
    });
  } catch (err) {
    await charge.refund?.();

    return json(
      {
        success: false,
        error: "LANDING_PAGE_GENERATION_FAILED",
        message:
          err?.message ||
          "Não foi possível gerar a landing page completa agora. Seus créditos foram devolvidos.",
      },
      500
    );
  }
}
