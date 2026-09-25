import assert from "node:assert/strict";
import { normalizeMaxVideoSeconds, videoDurationsFor } from "../src/lib/videoDurationPolicy.js";
import { maxShotsFor } from "../src/lib/videoPlanDirector.mjs";

// Paid plans: 5, 10 and 15 seconds.
assert.deepEqual(videoDurationsFor(normalizeMaxVideoSeconds(true, 15, 15)), [5, 10, 15]);
// Free accounts never exceed 10s, even if an env var asks for more.
assert.deepEqual(videoDurationsFor(normalizeMaxVideoSeconds(false, 15, 10)), [5, 10]);
assert.deepEqual(videoDurationsFor(normalizeMaxVideoSeconds(false, 5, 10)), [5]);
// Paid env overrides are clamped too.
assert.deepEqual(videoDurationsFor(normalizeMaxVideoSeconds(true, 60, 15)), [5, 10, 15]);
// Longer videos may use more shots.
assert.equal(maxShotsFor(5), 2);
assert.equal(maxShotsFor(10), 3);
assert.equal(maxShotsFor(15), 4);
console.log("NOVA video duration policy: OK");
