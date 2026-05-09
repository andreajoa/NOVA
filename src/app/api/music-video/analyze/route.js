import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createMusicVideoStoryboard } from "@/lib/musicVideoStoryboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const storyboard = createMusicVideoStoryboard({
    songTitle: body.songTitle,
    artistName: body.artistName,
    lyrics: body.lyrics,
    visualStyle: body.visualStyle,
    mood: body.mood,
    aspectRatio: body.aspectRatio,
    durationSeconds: body.durationSeconds,
    sceneSeconds: body.sceneSeconds,
  });

  return NextResponse.json({
    success: true,
    storyboard,
  });
}
