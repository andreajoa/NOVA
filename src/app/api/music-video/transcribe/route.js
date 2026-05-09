import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const audioUrl = body.audioUrl;

  if (!audioUrl) {
    return NextResponse.json({ success: false, error: "Missing audio URL" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      success: false,
      code: "OPENAI_KEY_MISSING",
      error: "OPENAI_API_KEY não está configurada. Cole a letra manualmente ou configure a chave para transcrever áudio.",
    }, { status: 400 });
  }

  try {
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) throw new Error("Could not download audio from R2");

    const audioBlob = await audioRes.blob();
    const file = new File([audioBlob], "song.mp3", {
      type: audioBlob.type || "audio/mpeg",
    });

    const form = new FormData();
    form.append("file", file);
    form.append("model", "whisper-1");
    form.append("response_format", "json");

    const transcriptionRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: form,
    });

    const data = await transcriptionRes.json().catch(() => ({}));

    if (!transcriptionRes.ok) {
      throw new Error(data?.error?.message || "Transcription failed");
    }

    return NextResponse.json({
      success: true,
      text: data?.text || "",
      raw: data,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err?.message || "Transcription failed",
    }, { status: 500 });
  }
}
