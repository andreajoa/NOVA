import assert from "node:assert/strict";
import {
  directVideoPrompt,
  inspectVideoPrompt,
} from "../src/lib/videoPromptDirector.mjs";

const complexPrompt = [
  "Netflix-style documentary reconstruction, 10 seconds, 16:9, 24fps, handheld camera, natural film grain.",
  "VOICEOVER: a REAL human Brazilian female voice, natural documentary narrator, warm and emotional, off-screen narration, no lip sync.",
  "TIMED BEATS:",
  '0-3s | VISUAL: extreme close-up of trembling hands holding a smartphone | NARRATION: "Até hoje, a Mariana sente o tremor nas mãos quando lembra daquele dia." | CAPTION: "ATÉ HOJE, A MARIANA SENTE O TREMOR NAS MÃOS"',
  '3-7s | VISUAL: close-up of tear-filled eyes lit by the phone | NARRATION: "O dia em que o nome dela apareceu na lista." | CAPTION: "O DIA EM QUE O NOME DELA APARECEU NA LISTA"',
  "7-10s | VISUAL: slow pull-back, she laughs crying | AUDIO: single piano note",
  "STYLE: Fujifilm X-T5, soft overcast window light, Kodak Portra 400 film look, realistic skin texture.",
  "ENDS: fast whip pan to the right with motion blur.",
].join("\n");

const insight = inspectVideoPrompt(complexPrompt);
assert.equal(insight.complex, true);
assert.equal(insight.beatCount, 3);
assert.equal(insight.requestedDuration, 10);
assert.equal(insight.aspectRatio, "16:9");
assert.equal(insight.fps, 24);
assert.equal(insight.hasNarration, true);
assert.equal(insight.hasCaptions, true);
assert.equal(insight.audioRequired, true);

const directed = directVideoPrompt({
  prompt: complexPrompt,
  selectedDuration: 5,
  selectedAspectRatio: "9:16",
  allowedDurations: [5, 10],
  supportedAspects: ["16:9", "9:16", "1:1"],
  supportedFps: [24],
});

assert.equal(directed.applied.duration, 10);
assert.equal(directed.applied.aspectRatio, "16:9");
assert.equal(directed.applied.fps, 24);
assert.equal(directed.beats.length, 3);
assert.equal(directed.beats[0].start, 0);
assert.equal(directed.beats[0].end, 3);
assert.equal(directed.beats[2].end, 10);
assert.equal(directed.providerHints.audioRequired, true);
assert.match(directed.prompt, /NOVA VIDEO DIRECTOR - EXECUTION SCRIPT/);
assert.match(directed.prompt, /\[0s-3s\]/);
assert.match(directed.prompt, /\[3s-7s\]/);
assert.match(directed.prompt, /\[7s-10s\]/);
assert.match(
  directed.prompt,
  /Até hoje, a Mariana sente o tremor nas mãos quando lembra daquele dia\./
);
assert.match(
  directed.prompt,
  /ATÉ HOJE, A MARIANA SENTE O TREMOR NAS MÃOS/
);
assert.match(directed.prompt, /fast whip pan to the right with motion blur/);
assert.match(directed.visualPrompt, /genuine live-action motion/i);
assert.match(directed.visualPrompt, /Do not render subtitles, captions, lower thirds/i);
assert.doesNotMatch(directed.visualPrompt, /ATÉ HOJE, A MARIANA SENTE O TREMOR NAS MÃOS/);
assert.equal(directed.visualStyle.includes("Fujifilm X-T5"), true);
assert.equal(directed.endingDirection.includes("whip pan"), true);
assert.equal(directed.beats[0].narration.startsWith("Até hoje"), true);


const constrained = directVideoPrompt({
  prompt: complexPrompt,
  selectedDuration: 5,
  selectedAspectRatio: "16:9",
  allowedDurations: [5],
  supportedFps: [24],
});
assert.equal(constrained.applied.duration, 5);
assert.equal(constrained.beats[0].end, 1.5);
assert.equal(constrained.beats[1].start, 1.5);
assert.equal(constrained.beats[1].end, 3.5);
assert.equal(constrained.beats[2].end, 5);
assert.match(constrained.prompt, /TIMING ADAPTATION/);

const simplePrompt = "A dog runs through a sunny park while the camera tracks alongside.";
const simple = directVideoPrompt({
  prompt: simplePrompt,
  selectedDuration: 5,
  selectedAspectRatio: "16:9",
  allowedDurations: [5, 10],
});
assert.equal(simple.publicSummary.optimized, false);
assert.equal(simple.prompt, simplePrompt);

console.log("NOVA complex video prompt director: OK");
