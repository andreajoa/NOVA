import { randomUUID } from "node:crypto";

// Free images come back as data URLs (Workers AI) or were fetched from a
// temporary public-runtime file. Neither can be displayed or downloaded later,
// so every free image is stored in NOVA's own R2 bucket before responding.

const EXTENSIONS = { "image/png": "png", "image/webp": "webp", "image/jpeg": "jpg" };

export function decodeDataUrl(url) {
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(String(url || ""));
  if (!match) return null;
  return { mime: match[1].toLowerCase(), bytes: Buffer.from(match[2], "base64") };
}

export async function persistImageOutput(output, userId, upload) {
  const put = upload || (await import("@/lib/r2")).uploadToR2;
  const images = Array.isArray(output?.images) ? output.images : [];
  const persisted = [];
  for (const image of images) {
    const decoded = decodeDataUrl(image?.url);
    if (!decoded || !decoded.bytes.length) {
      persisted.push(image);
      continue;
    }
    const ext = EXTENSIONS[decoded.mime] || "jpg";
    const owner = String(userId || "anonymous").replace(/[^a-zA-Z0-9_-]/g, "");
    const key = `users/${owner}/nova-image/${Date.now()}-${randomUUID()}.${ext}`;
    const url = await put(key, decoded.bytes, decoded.mime);
    if (!/^https:\/\//.test(String(url || ""))) throw new Error("NOVA image was not persisted");
    persisted.push({ ...image, url, content_type: decoded.mime });
  }
  return { ...output, images: persisted };
}
