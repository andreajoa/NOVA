import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// Cinematography templates — cada cena recebe uma combinação única de câmera,
// iluminação e movimento para criar variedade visual sem repetir "cinematic".
const CAMERA_MOVES = [
  "slow dolly forward", "smooth tracking shot left to right", "static wide shot",
  "slow push-in close-up", "drone aerial establishing shot", "handheld follow shot",
  "slow pan 180 degrees", "crane shot rising up", "Steadicam orbit around subject",
  "rack focus pull from foreground to background", "low angle looking up",
  "over-the-shoulder perspective", "bird's eye top-down view",
  "slow zoom out revealing the scene", "sliding lateral dolly",
];

const LIGHTING = [
  "golden hour warm side lighting", "dramatic chiaroscuro with deep shadows",
  "soft diffused overcast light", "neon accent lighting with dark background",
  "bright high-key studio lighting", "backlit silhouette with rim light",
  "natural window light with soft shadows", "blue hour twilight ambiance",
  "warm practical lighting from lamps", "harsh direct sunlight with strong contrast",
  "volumetric fog with light rays", "cool moonlit atmosphere",
];

const SCENE_BEATS = [
  "introduction — establish the setting and tone",
  "exploration — reveal details and build curiosity",
  "tension — introduce conflict or challenge",
  "escalation — raise the stakes or energy",
  "turning point — shift perspective or reveal something new",
  "climax — peak intensity or emotional high point",
  "resolution — bring closure or reflect on the journey",
  "montage — rapid sequence of key moments",
  "transition — bridge between major segments",
  "detail shot — extreme close-up on a critical element",
  "wide context — pull back to show the bigger picture",
  "emotional beat — pause for impact and reflection",
];

function createScenes({ topic, minutes, sceneSeconds }) {
  const totalSeconds = Math.max(30, Math.min(15 * 60, Number(minutes || 1) * 60));
  const count = Math.ceil(totalSeconds / sceneSeconds);

  return Array.from({ length: count }).map((_, index) => {
    const cam = CAMERA_MOVES[index % CAMERA_MOVES.length];
    const light = LIGHTING[index % LIGHTING.length];
    const beat = SCENE_BEATS[index % SCENE_BEATS.length];
    const isFirst = index === 0;
    const isLast = index === count - 1;

    const continuity = isFirst
      ? "Opening scene — set the visual identity."
      : isLast
        ? "Final scene — bring visual closure, slower pace."
        : "Seamless visual continuation from previous scene.";

    return {
      scene: index + 1,
      durationSeconds: sceneSeconds,
      prompt: [
        `${topic}.`,
        `Scene ${index + 1} of ${count}: ${beat}.`,
        `Camera: ${cam}. Lighting: ${light}.`,
        `High production value, sharp focus, professional color grading.`,
        continuity,
      ].join(" "),
      narration: `Scene ${index + 1}: ${beat} — ${topic}.`,
    };
  });
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
