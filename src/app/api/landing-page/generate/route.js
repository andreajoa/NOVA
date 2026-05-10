import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateCompleteLandingPackage } from "@/lib/novaCompleteLanding";
import {
  LANDING_PAGE_WITH_IMAGES,
  landingPricingPublic,
} from "@/lib/novaLandingPricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

async function getDb() {
  const mod = await import("@/lib/db").catch(() => null);
  if (!mod) return null;
  return mod.prisma || mod.db || mod.default || null;
}

async function findWallet(db, clerkUserId) {
  const modelNames = [
    "user",
    "users",
    "profile",
    "account",
    "customer",
    "userAccount",
    "creditWallet",
    "wallet",
  ];

  const whereList = [
    { clerkId: clerkUserId },
    { clerkUserId },
    { userId: clerkUserId },
    { externalId: clerkUserId },
    { id: clerkUserId },
  ];

  for (const modelName of modelNames) {
    const model = db?.[modelName];
    if (!model?.findFirst) continue;

    for (const where of whereList) {
      try {
        const record = await model.findFirst({ where });
        if (record) return { modelName, model, record, where };
      } catch {}
    }
  }

  return null;
}

function pickCreditField(record = {}) {
  const fields = [
    "credits",
    "creditBalance",
    "generationCredits",
    "availableCredits",
    "imageCredits",
    "monthlyCredits",
    "balance",
  ];

  for (const field of fields) {
    if (typeof record[field] === "number") return field;
  }

  return null;
}

async function chargeInternalCredits({ clerkUserId, amount }) {
  const db = await getDb();

  if (!db) {
    return {
      ok: false,
      status: 500,
      code: "NOVA_DB_NOT_FOUND",
      message: "NOVA não conseguiu acessar o banco de créditos internos.",
    };
  }

  const wallet = await findWallet(db, clerkUserId);

  if (!wallet) {
    return {
      ok: false,
      status: 404,
      code: "NOVA_USER_WALLET_NOT_FOUND",
      message: "NOVA não encontrou sua carteira de créditos internos.",
    };
  }

  const creditField = pickCreditField(wallet.record);

  if (!creditField) {
    return {
      ok: false,
      status: 500,
      code: "NOVA_INTERNAL_CREDIT_FIELD_NOT_FOUND",
      message:
        "NOVA não conseguiu identificar o campo de saldo/créditos internos desta conta.",
      debug: {
        modelName: wallet.modelName,
        availableFields: Object.keys(wallet.record).filter((key) =>
          /credit|balance|saldo|usage|limit/i.test(key)
        ),
      },
    };
  }

  const currentBalance = Number(wallet.record[creditField] || 0);

  if (currentBalance < amount) {
    return {
      ok: false,
      status: 402,
      code: "NOVA_INTERNAL_CREDITS_REQUIRED",
      message:
        "Saldo insuficiente para gerar esta landing page. Compre créditos ou faça upgrade para continuar.",
      requiredCredits: amount,
      currentBalance,
      checkoutUrl: "/pricing",
    };
  }

  await wallet.model.updateMany({
    where: wallet.where,
    data: {
      [creditField]: {
        decrement: amount,
      },
    },
  });

  return {
    ok: true,
    identity: { userId: clerkUserId },
    charged: amount,
    remainingBalance: currentBalance - amount,
    refund: async () => {
      await wallet.model.updateMany({
        where: wallet.where,
        data: {
          [creditField]: {
            increment: amount,
          },
        },
      });
    },
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

  const charge = await chargeInternalCredits({
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
