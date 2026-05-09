import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createMusicVideoStoryboard } from "@/lib/musicVideoStoryboard";
import { createMusicVideoJob, listMusicVideoJobs } from "@/lib/musicVideoJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const jobs = await listMusicVideoJobs(userId);

  return NextResponse.json({
    success: true,
    jobs,
  });
}

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const storyboard = body.storyboard || createMusicVideoStoryboard({
    songTitle: body.title,
    artistName: body.artistName,
    lyrics: body.lyrics,
    visualStyle: body.visualStyle,
    mood: body.mood,
    aspectRatio: body.aspectRatio,
    durationSeconds: body.durationSeconds,
    sceneSeconds: body.sceneSeconds,
  });

  const job = await createMusicVideoJob({
    userId,
    title: body.title || storyboard.title || "NOVA Music Video",
    artistName: body.artistName || storyboard.artistName || "",
    audioUrl: body.audioUrl || "",
    lyrics: body.lyrics || "",
    style: body.visualStyle || storyboard.visualStyle || "cinematic",
    aspectRatio: body.aspectRatio || storyboard.aspectRatio || "16:9",
    durationSeconds: storyboard.durationSeconds || body.durationSeconds || 180,
    sceneSeconds: storyboard.sceneSeconds || body.sceneSeconds || 10,
    modelKey: body.modelKey || "seedance",
    modeKey: body.modeKey || "text-to-video",
    scenes: storyboard.scenes || [],
  });

  return NextResponse.json({
    success: true,
    job,
  });
}
