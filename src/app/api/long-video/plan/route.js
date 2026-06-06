import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

function createScenes({ topic, minutes, sceneSeconds }) {
  const totalSeconds = Math.max(30, Math.min(15 * 60, Number(minutes || 1) * 60));
  const count = Math.ceil(totalSeconds / sceneSeconds);

  return Array.from({ length: count }).map((_, index) => ({
    scene: index + 1,
    durationSeconds: sceneSeconds,
    prompt: `${topic}. Scene ${index + 1}. Cinematic, clear subject, smooth camera movement, professional lighting, coherent continuation from the previous scene.`,
    narration: `Scene ${index + 1}: ${topic}.`,
  }));
}

export async function POST(request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json();
  const topic = String(body.topic || "").trim();

  if (!topic) {
    return NextResponse.json({ success: false, error: "TOPIC_REQUIRED" }, { status: 400 });
  }

  const minutes = Math.max(1, Math.min(15, Number(body.minutes || 1)));
  const sceneSeconds = Math.max(5, Math.min(10, Number(body.sceneSeconds || 5)));
  const scenes = createScenes({ topic, minutes, sceneSeconds });

  const estimatedCredits = scenes.length * 80 + Math.ceil(minutes * 30);

  return NextResponse.json({
    success: true,
    status: "PLAN_ONLY",
    message:
      "This creates a professional long-video production plan. Rendering must run as an async job with R2 + FFmpeg before public release.",
    topic,
    minutes,
    sceneSeconds,
    sceneCount: scenes.length,
    estimatedCredits,
    scenes,
  });
}
