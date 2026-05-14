import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function safeFilename(name, fallback = "nova-result") {
  const clean = String(name || fallback)
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return clean || fallback;
}

function extensionFromContentType(contentType = "") {
  if (contentType.includes("video/mp4")) return "mp4";
  if (contentType.includes("video/webm")) return "webm";
  if (contentType.includes("image/png")) return "png";
  if (contentType.includes("image/jpeg")) return "jpg";
  if (contentType.includes("image/webp")) return "webp";
  return "bin";
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");
  const requestedName = searchParams.get("filename") || "nova-result";

  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let target;

  try {
    target = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (target.protocol !== "https:") {
    return NextResponse.json({ error: "Only https URLs are allowed" }, { status: 400 });
  }

  const response = await fetch(target.toString(), {
    cache: "no-store",
  });

  if (!response.ok || !response.body) {
    return NextResponse.json(
      { error: "Could not fetch file", status: response.status },
      { status: 502 }
    );
  }

  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const ext = extensionFromContentType(contentType);

  let filename = safeFilename(requestedName, "nova-result");

  if (!filename.includes(".")) {
    filename = `${filename}.${ext}`;
  }

  return new Response(response.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
