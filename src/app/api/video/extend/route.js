import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json();

  return NextResponse.json({
    success: false,
    error: "VIDEO_EXTENSION_PIPELINE_NOT_CONNECTED_YET",
    message:
      "Video extension requires extracting the last frame, generating a continuation with image-to-video, then concatenating with FFmpeg/R2. The UI is ready, but the production worker must be connected before release.",
    received: {
      videoUrl: body.videoUrl || "",
      prompt: body.prompt || "",
      seconds: body.seconds || 5,
    },
  }, { status: 501 });
}
