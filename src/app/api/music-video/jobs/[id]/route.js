import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fal } from "@fal-ai/client";
import { falModels } from "@/lib/falModels";
import {
  debitGenerationCredits,
  ensureUserGenerationAccount,
  isAdminUser,
} from "@/lib/db";
import {
  getMusicVideoJob,
  updateMusicVideoJob,
} from "@/lib/musicVideoJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const VIDEO_CREDITS_PER_SECOND = 24;

fal.config({ credentials: process.env.FAL_KEY });

async function getId(ctx) {
  const params = await ctx.params;
  return params.id;
}

function paywallPayload({ currentCredits = 0, creditsRequired = 0, seconds = 0 }) {
  return {
    success: false,
    code: "INSUFFICIENT_CREDITS",
    error: "INSUFFICIENT_CREDITS",
    message: "Saldo insuficiente para gerar este clipe. Faça upgrade para continuar.",
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

function outputUrlFrom(result) {
  return (
    result?.video?.url ||
    result?.videos?.[0]?.url ||
    result?.output?.url ||
    result?.url ||
    null
  );
}

function endpointFor(job) {
  const model = falModels.video?.[job.modelKey] || falModels.video?.seedance;
  const mode = model?.modes?.[job.modeKey] || model?.modes?.["text-to-video"] || Object.values(model?.modes || {})[0];

  return {
    model,
    mode,
    endpoint: mode?.endpoint,
  };
}

export async function GET(req, ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const id = await getId(ctx);
  const job = await getMusicVideoJob(id, userId);

  if (!job) return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });

  return NextResponse.json({
    success: true,
    job,
  });
}

export async function PATCH(req, ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const id = await getId(ctx);
  const body = await req.json().catch(() => ({}));
  const existing = await getMusicVideoJob(id, userId);

  if (!existing) return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });

  const job = await updateMusicVideoJob(id, userId, {
    ...existing,
    scenes: Array.isArray(body.scenes) ? body.scenes : existing.scenes,
    title: body.title || existing.title,
    artistName: body.artistName || existing.artistName,
    status: body.status || existing.status,
  });

  return NextResponse.json({
    success: true,
    job,
  });
}

export async function POST(req, ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const id = await getId(ctx);
  const body = await req.json().catch(() => ({}));
  const action = body.action || "generate_scene";
  const job = await getMusicVideoJob(id, userId);

  if (!job) return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });

  if (action === "reset_scene") {
    const sceneIndex = Number(body.sceneIndex);
    const scenes = job.scenes.map((scene, index) =>
      index === sceneIndex
        ? { ...scene, status: "pending", videoUrl: "", error: "" }
        : scene
    );

    const updated = await updateMusicVideoJob(id, userId, {
      ...job,
      status: "storyboard",
      scenes,
      error: "",
    });

    return NextResponse.json({ success: true, job: updated });
  }

  if (action !== "generate_scene") {
    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  }

  const sceneIndex = Number(body.sceneIndex);
  const scene = job.scenes[sceneIndex];

  if (!scene) return NextResponse.json({ success: false, error: "Scene not found" }, { status: 404 });

  const duration = Number(scene.duration || job.sceneSeconds || 10);
  const creditsRequired = duration * VIDEO_CREDITS_PER_SECOND;
  const admin = await isAdminUser(userId);

  if (!admin) {
    const account = await ensureUserGenerationAccount(userId);
    if (Number(account.credits || 0) < creditsRequired) {
      return NextResponse.json(
        paywallPayload({ currentCredits: Number(account.credits || 0), creditsRequired, seconds: duration }),
        { status: 402 }
      );
    }

    const debit = await debitGenerationCredits(userId, creditsRequired);
    if (!debit.ok) {
      return NextResponse.json(
        paywallPayload({ currentCredits: debit.currentCredits, creditsRequired, seconds: duration }),
        { status: 402 }
      );
    }
  }

  const scenesGenerating = job.scenes.map((item, index) =>
    index === sceneIndex
      ? { ...item, status: "generating", error: "" }
      : item
  );

  await updateMusicVideoJob(id, userId, {
    ...job,
    status: "generating",
    scenes: scenesGenerating,
    error: "",
  });

  const { endpoint } = endpointFor(job);

  if (!endpoint) {
    const failedScenes = scenesGenerating.map((item, index) =>
      index === sceneIndex
        ? { ...item, status: "failed", error: "Endpoint do modelo não encontrado." }
        : item
    );

    const updated = await updateMusicVideoJob(id, userId, {
      ...job,
      status: "failed",
      scenes: failedScenes,
      error: "Endpoint do modelo não encontrado.",
    });

    return NextResponse.json({ success: false, job: updated, error: "Endpoint do modelo não encontrado." }, { status: 500 });
  }

  try {
    const falInput = {
      prompt: scene.prompt,
      duration,
      aspect_ratio: job.aspectRatio,
      resolution: body.resolution || "1080p",
    };

    const result = await fal.subscribe(endpoint, {
      input: falInput,
      logs: true,
    });

    const videoUrl = outputUrlFrom(result);

    if (!videoUrl) {
      throw new Error("A geração terminou, mas não retornou URL de vídeo.");
    }

    const nextScenes = scenesGenerating.map((item, index) =>
      index === sceneIndex
        ? { ...item, status: "done", videoUrl, error: "", raw: result }
        : item
    );

    const allDone = nextScenes.every((item) => item.status === "done");

    const updated = await updateMusicVideoJob(id, userId, {
      ...job,
      status: allDone ? "clips_done" : "generating",
      scenes: nextScenes,
      error: "",
    });

    return NextResponse.json({
      success: true,
      job: updated,
      scene: nextScenes[sceneIndex],
      billing: {
        creditsCharged: admin ? 0 : creditsRequired,
        creditsPerSecond: VIDEO_CREDITS_PER_SECOND,
      },
    });
  } catch (err) {
    const nextScenes = scenesGenerating.map((item, index) =>
      index === sceneIndex
        ? { ...item, status: "failed", error: err?.message || "Falha ao gerar cena." }
        : item
    );

    const updated = await updateMusicVideoJob(id, userId, {
      ...job,
      status: "failed",
      scenes: nextScenes,
      error: err?.message || "Falha ao gerar cena.",
    });

    return NextResponse.json({
      success: false,
      job: updated,
      error: err?.message || "Falha ao gerar cena.",
    }, { status: 500 });
  }
}
