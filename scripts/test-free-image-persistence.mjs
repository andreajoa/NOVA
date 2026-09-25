import assert from "node:assert/strict";
import { decodeDataUrl, persistImageOutput } from "../src/lib/freeImagePersistence.js";

const png = Buffer.from("89504e470d0a1a0a0000", "hex");
const output = { images: [{ url: `data:image/png;base64,${png.toString("base64")}`, content_type: "image/png" }] };

assert.equal(decodeDataUrl(output.images[0].url).mime, "image/png");
assert.equal(decodeDataUrl("https://x/y.png"), null);

const uploads = [];
const fakeUpload = async (key, bytes, mime) => {
  uploads.push({ key, bytes, mime });
  return `https://cdn.example/${key}`;
};
const saved = await persistImageOutput(output, "user_123", fakeUpload);
assert.equal(uploads.length, 1);
assert.match(uploads[0].key, /^users\/user_123\/nova-image\/\d+-[0-9a-f-]+\.png$/);
assert.deepEqual(uploads[0].bytes, png);
assert.match(saved.images[0].url, /^https:\/\/cdn\.example\/users\/user_123\/nova-image\//, "UI and download get a durable https URL");

// Already-hosted images pass through untouched.
const hosted = { images: [{ url: "https://cdn.example/a.png" }] };
assert.deepEqual(await persistImageOutput(hosted, "u", fakeUpload), hosted);

// A failed upload must surface, never hand the UI a broken image.
await assert.rejects(persistImageOutput(output, "u", async () => ""), /not persisted/);
console.log("NOVA free image persistence: OK");
