import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { auth } from "@clerk/nextjs/server";
import { debitGenerationCredits, ensureUserGenerationAccount, isAdminUser } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 300;

fal.config({ credentials: process.env.FAL_KEY });

const SCENE_ENDPOINT = "fal-ai/wan/v2.2-a14b/text-to-video";
const CREDITS_PER_SCENE = 35;

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await request.json();
    const scenes = Array.isArray(body.scenes) ? body.scenes : [];
    const sceneIndex = Number(body.sceneIndex ?? 0);

    if (!scenes.length) {
      return NextResponse.json({ success: false, error: "SCENES_REQUIRED" }, { status: 400 });
    }

    if (sceneIndex < 0 || sceneIndex >= scenes.length) {
      return NextResponse.json({ success: false, error: "INVALID_SCENE_INDEX" }, { status: 400 });
    }

    const scene = scenes[sceneIndex];
    if (!scene?.prompt) {
      return NextResponse.json({ success: false, error: "SCENE_PROMPT_REQUIRED" }, { status: 400 });
    }

    const creditsRequired = CREDITS_PER_SCENE;
    const admin = await isAdminUser(userId);

    if (!admin) {
      const account = await ensureUserGenerationAccount(userId);
      if (account.credits < creditsRequired) {
        return NextResponse.json({
          success: false,
          code: "INSUFFICIENT_CREDITS",
          error: "INSUFFICIENT_CREDITS",
          message: "Not enough credits to render this scene. Upgrade to continue.",
          currentCredits: account.credits,
          creditsRequired,
          creditsMissing: Math.max(0, creditsRequired - account.credits),
          sceneIndex,
          plans: {
            annual:  { label: "Annual",  price: "$5/mo", href: "/checkout/plan?plan=basic&billing=annual" },
            monthly: { label: "Monthly", price: "$7/mo", href: "/checkout/plan?plan=basic&billing=monthly" },
          },
        }, { status: 402 });
      }

      const debit = await debitGenerationCredits(userId, creditsRequired);
      if (!debit.ok) {
        return NextResponse.json({
          success: false,
          code: "INSUFFICIENT_CREDITS",
          error: "INSUFFICIENT_CREDITS",
          message: "Not enough credits. Upgrade to continue.",
          currentCredits: debit.currentCredits,
          creditsRequired,
          sceneIndex,
        }, { status: 402 });
      }
    }

    const result = await fal.subscribe(SCENE_ENDPOINT, {
      input: {
        prompt: scene.prompt,
        duration: scene.durationSeconds || 5,
        aspect_ratio: body.aspectRatio || "16:9",
      },
      logs: true,
    });

    let videoUrl = null;
    const content = result?.data || result;
    if (content?.video?.url) videoUrl = content.video.url;
    else if (content?.video_url) videoUrl = content.video_url;
    else if (typeof content?.output === "string") videoUrl = content.output;
    else if (Array.isArray(content?.outputs)) videoUrl = content.outputs[0]?.url || content.outputs[0];

    if (!videoUrl) {
      return NextResponse.json({
        success: false,
        error: "NO_VIDEO_URL_RETURNED",
        sceneIndex,
        raw: result,
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      sceneIndex,
      scene: { ...scene, videoUrl },
      videoUrl,
      creditsCharged: admin ? 0 : creditsRequired,
    });
  } catch (error) {
    console.error("Long video render failed:", error);
    return NextResponse.json({
      success: false,
      error: "SCENE_RENDER_FAILED",
      message: error?.message || String(error),
    }, { status: 500 });
  }
}
