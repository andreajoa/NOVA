import assert from "node:assert/strict";
import { falModels } from "../src/lib/falModels.js";
import { endpointDefaults, normalizeDurationForEndpoint } from "../src/lib/falEndpointInputs.js";

// Labels must match what is actually called.
const video = falModels.video;
assert.match(video.kling.modes["text-to-video"].endpoint, /kling-video\/v3\//, "Kling 3.0 must call Kling v3");
assert.match(video.kling.modes["image-to-video"].endpoint, /kling-video\/v3\//);
assert.match(video.pixverse.modes["image-to-video"].endpoint, /pixverse\/v6\//, "PixVerse V6 must call v6");
assert.match(video.pixverse.modes["text-to-video"].endpoint, /pixverse\/v6\//);
assert.doesNotMatch(video.lucy.label, /Lucy|Decart/, "minimax endpoint must not be sold as Lucy");
assert.equal(video["seedance-25"].label, "Seedance 2.5");
for (const mode of Object.values(video["seedance-25"].modes)) assert.match(mode.endpoint, /seedance-2\.5\//);

// Endpoint quirks.
assert.equal(normalizeDurationForEndpoint("fal-ai/kling-video/v3/turbo/pro/text-to-video", 10), "10");
assert.equal(normalizeDurationForEndpoint("fal-ai/kling-video/v3/turbo/pro/text-to-video", 1), "3");
assert.equal(normalizeDurationForEndpoint("fal-ai/kling-video/v3/turbo/pro/text-to-video", 60), "15");
assert.equal(normalizeDurationForEndpoint("bytedance/seedance-2.5/text-to-video", 8), "8");
assert.equal(normalizeDurationForEndpoint("fal-ai/pixverse/v6/text-to-video", 5), 5, "pixverse takes an integer");
assert.deepEqual(endpointDefaults("bytedance/seedance-2.5/image-to-video"), { generate_audio: true });
assert.deepEqual(endpointDefaults("fal-ai/veo3.1"), {});

console.log("NOVA paid catalog: OK");
