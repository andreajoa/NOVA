import assert from "node:assert/strict";

process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
process.env.CLOUDFLARE_API_TOKEN = "tok";
const { runCloudflareImage } = await import("../src/lib/cloudflareAiClient.js");

const PNG = "iVBORw0KGgoAAAANSUhEUg";
const JPEG = "/9j/4AAQSkZJRg";
const calls = [];
let failKlein = false;
globalThis.fetch = async (url, init) => {
  calls.push({ url, init });
  if (url.includes("flux-2-klein-4b")) {
    if (failKlein) return new Response(JSON.stringify({ success: false, errors: [{ message: "boom" }] }), { status: 500 });
    assert.ok(init.body instanceof FormData, "klein takes multipart form data");
    assert.equal(init.headers["Content-Type"], undefined, "fetch must set the multipart boundary");
    assert.equal(init.body.get("width"), "576");
    assert.equal(init.body.get("height"), "1024");
    return new Response(JSON.stringify({ success: true, result: { image: PNG } }));
  }
  if (url.includes("flux-1-schnell")) {
    const body = JSON.parse(init.body);
    assert.equal(body.steps, 4);
    return new Response(JSON.stringify({ success: true, result: { image: JPEG } }));
  }
  throw new Error(`unexpected ${url}`);
};

const quiet = console.error;
console.error = () => {};
try {
  const klein = await runCloudflareImage({ model: process.env.NOVA_IMAGE_FREE_ENGINE_MODEL, prompt: "a cat", width: 576, height: 1024 });
  assert.equal(process.env.NOVA_IMAGE_FREE_ENGINE_MODEL, "@cf/black-forest-labs/flux-2-klein-4b");
  assert.equal(klein.images[0].content_type, "image/png");
  assert.ok(klein.images[0].url.startsWith("data:image/png;base64,"));

  failKlein = true;
  calls.length = 0;
  const fallback = await runCloudflareImage({ model: "@cf/black-forest-labs/flux-2-klein-4b", prompt: "a cat", width: 576, height: 1024 });
  assert.deepEqual(calls.map((c) => c.url.split("/").pop()), ["flux-2-klein-4b", "flux-1-schnell"]);
  assert.equal(fallback.images[0].content_type, "image/jpeg");
} finally {
  console.error = quiet;
}
console.log("NOVA free image engine: OK");
