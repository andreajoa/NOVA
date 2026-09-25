import assert from "node:assert/strict";
import { directVideoPrompt } from "../src/lib/videoPromptDirector.mjs";
import {
  allowsPublicFallback,
  applyPlanToDirector,
  engineOrderFor,
  extractJson,
  ltxPrompt,
  markForWorkerPlanning,
  maxShotsFor,
  normalizePlan,
  planVideoWithLlm,
  shouldPlanWithLlm,
} from "../src/lib/videoPlanDirector.mjs";

const customerPrompt =
  "Crie um vídeo de uma cafeteria aconchegante de manhã: a barista sorri e serve um cappuccino, " +
  "depois o croissant sai do forno. Música lo-fi, narração feminina dizendo 'Seu dia começa aqui' " +
  "e o texto 'Café da Vila' no final.";

const llmPlan = {
  language: "pt-BR",
  subject: "A young barista with curly hair and a green apron in a cozy wooden café at morning light.",
  style: "Warm cinematic film look, shallow depth of field, soft golden tones.",
  shots: [
    {
      visual: "She smiles and slides a cappuccino with latte art across the counter.",
      camera: "Slow push-in at eye level.",
      seconds: 3,
      narration: "Seu dia começa aqui, com carinho em cada xícara e em cada detalhe da casa.",
      on_screen_text: "",
      transition_to_next: "dissolve",
    },
    {
      visual: "A tray of golden croissants comes out of the oven, steam rising.",
      camera: "Close-up, gentle tilt down.",
      seconds: 3,
      narration: "Café da Vila.",
      on_screen_text: "Café da Vila",
      transition_to_next: "explode",
    },
    {
      visual: "An extra shot the free tier cannot afford.",
      camera: "Drone.",
      seconds: 2,
      narration: "",
      on_screen_text: "",
      transition_to_next: "fade",
    },
  ],
  voice: "female",
  music_mood: "lofi",
  ambience: "Soft café chatter and an espresso machine hiss.",
};

// Shot cap per duration protects GPU cost: each shot is a separate render.
assert.equal(maxShotsFor(5), 2);
assert.equal(maxShotsFor(10), 3);

// Normalization: caps shots, tiles the timeline exactly, budgets narration,
// sanitizes enums and keeps the subject in every shot.
const plan = normalizePlan(llmPlan, { duration: 5 });
assert.equal(plan.beats.length, 2);
assert.equal(plan.beats[0].start, 0);
assert.equal(plan.beats.at(-1).end, 5);
assert.equal(plan.beats[0].end, plan.beats[1].start);
assert.ok(plan.beats.every((beat) => beat.visual.startsWith("A young barista")));
assert.equal(plan.beats[0].transition, "dissolve");
assert.equal(plan.beats[1].transition, "cut");
assert.equal(plan.beats[1].caption, "Café da Vila");
assert.equal(plan.musicMood, "lofi");
assert.equal(plan.voice, "female");
const totalWords = plan.beats.reduce((sum, beat) => sum + (beat.narration ? beat.narration.split(" ").length : 0), 0);
assert.ok(totalWords <= Math.floor((5 - 0.8) * 2.5), `narration too long for the video: ${totalWords} words`);

// Verbatim speech that fits the video survives even when split unevenly.
const speech = "The first year after betrayal has a map. Nobody hands it to you. So here it is. Month by month.";
const verbatim = normalizePlan({
  shots: [
    { visual: "He faces the camera.", seconds: 3, narration: speech.split(". ").slice(0, 3).join(". ") + "." },
    { visual: "He keeps talking.", seconds: 7, narration: "Month by month." },
  ],
}, { duration: 10 });
assert.equal(verbatim.beats.map((beat) => beat.narration).join(" "), speech);

// Gating: long scripts with no timed beats (the real prompt that produced a
// silent single shot) must go through the LLM planner.
const scriptPrompt = `BLOCK 1 (0s–10s) — ON-CAMERA + HEADLINE OVERLAY
🎙️ SPEECH: "${speech}" node scripts/kie.mjs still "<PREAMBLE> <CHARLOCK> Medium close-up, he faces the camera with calm grave honesty, soft dark interior background. Kodak Portra 400 film stock." out/b1-head.png --ar 9:16 --ref master_portrait.png
node scripts/kie.mjs shot "Subtle handheld breathing sway; the man speaks directly into the camera with calm grave honesty, accurate subtle lip movement, steady eye contact; light shifts softly." out/b1-head.png out/b1.mp4 --dur 10
12
📝 WRITING (CapCut overlay, 0–3s, top center): THE FIRST YEAR AFTER BETRAYAL. (Bebas Neue, white, amber underline stroke)
Out: dip to black 0.3s.`;
const scripted = directVideoPrompt({ prompt: scriptPrompt, selectedDuration: 10, selectedAspectRatio: "9:16" });
assert.equal(scripted.providerHints.complex, true, "regex flags it complex by length");
assert.equal(scripted.beats.length, 0);
assert.equal(shouldPlanWithLlm(scripted, "text-to-video"), true);
assert.equal(shouldPlanWithLlm(scripted, "continue-video"), false);
assert.equal(shouldPlanWithLlm({ beats: [{}, {}] }, "text-to-video"), false, "real timed beats keep the regex director");

// Untrusted output is rejected or repaired, never passed through.
assert.equal(normalizePlan(null, { duration: 5 }), null);
assert.equal(normalizePlan({ shots: [] }, { duration: 5 }), null);
assert.equal(normalizePlan({ shots: [{ visual: "" }] }, { duration: 5 }), null);
const repaired = normalizePlan(
  { shots: [{ visual: "a", seconds: 0.1 }, { visual: "b", seconds: 99 }], voice: "robot", music_mood: "dubstep" },
  { duration: 5 },
);
assert.equal(repaired.beats[0].end, 2.5);
assert.equal(repaired.voice, "none");
assert.equal(repaired.musicMood, "cinematic");

// Applied to the regex director, the plan routes to the director worker and
// removes lettering from the diffusion prompt.
const base = directVideoPrompt({ prompt: customerPrompt, selectedDuration: 5, selectedAspectRatio: "9:16" });
assert.equal(base.providerHints.complex, false, "regex director should not understand free text");
const directed = applyPlanToDirector(base, plan);
assert.equal(directed.providerHints.complex, true);
assert.equal(directed.providerHints.llmPlanned, true);
assert.equal(directed.providerHints.audioRequired, true);
assert.equal(directed.musicMood, "lofi");
assert.match(directed.prompt, /No text, letters, subtitles or logos/);
assert.doesNotMatch(directed.prompt, /Música|narração/i);

// Default provider: Cloudflare Workers AI (free allocation), tolerant of small
// models wrapping the JSON in prose or code fences.
const cfEnv = { CLOUDFLARE_ACCOUNT_ID: "acct", CLOUDFLARE_AI_API_TOKEN: "tok" };
const cfCalls = [];
const cfFetch = async (url, init) => {
  cfCalls.push(url);
  const body = JSON.parse(init.body);
  assert.equal(init.headers.Authorization, "Bearer tok");
  assert.match(body.messages[0].content, /at most 2 shots/);
  const wrapped = "Here is the plan:\n```json\n" + JSON.stringify(llmPlan) + "\n```";
  return new Response(JSON.stringify({ success: true, result: { response: wrapped } }));
};
const planned = await planVideoWithLlm({
  prompt: customerPrompt,
  duration: 5,
  aspectRatio: "9:16",
  env: cfEnv,
  fetchImpl: cfFetch,
});
assert.deepEqual(cfCalls, [
  "https://api.cloudflare.com/client/v4/accounts/acct/ai/run/@cf/meta/llama-3.1-8b-instruct-fp8-fast",
]);
assert.equal(planned.provider, "cloudflare");
assert.equal(planned.beats.length, 2);

// JSON mode responses may already be objects.
assert.deepEqual(extractJson({ a: 1 }), { a: 1 });
assert.deepEqual(extractJson('noise {"shots": []} trailing'), { shots: [] });

// OpenAI is opt-in only (metered) and falls back across missing models.
const oaCalls = [];
const oaFetch = async (url, init) => {
  const body = JSON.parse(init.body);
  oaCalls.push(body.model);
  if (body.model === "gpt-4.1-mini") {
    return new Response(JSON.stringify({ error: { code: "model_not_found" } }), { status: 404 });
  }
  assert.equal(url, "https://api.openai.com/v1/chat/completions");
  assert.equal(body.response_format.type, "json_object");
  return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(llmPlan) } }] }));
};
const quiet = console.warn;
console.warn = () => {};
try {
  const viaOpenAi = await planVideoWithLlm({
    prompt: customerPrompt,
    duration: 5,
    env: { OPENAI_API_KEY: "k", NOVA_DIRECTOR_PROVIDER: "openai" },
    fetchImpl: oaFetch,
  });
  assert.deepEqual(oaCalls, ["gpt-4.1-mini", "gpt-4o-mini"]);
  assert.equal(viaOpenAi.model, "gpt-4o-mini");

  // An OpenAI key alone never triggers metered calls.
  let called = false;
  const spy = async () => { called = true; return new Response("{}"); };
  assert.equal(await planVideoWithLlm({ prompt: customerPrompt, env: { OPENAI_API_KEY: "k" }, fetchImpl: spy }), null);
  assert.equal(called, false);

  assert.equal(await planVideoWithLlm({ prompt: customerPrompt, env: {} }), null, "no credentials -> keep regex director");
  assert.equal(await planVideoWithLlm({ prompt: customerPrompt, env: { ...cfEnv, NOVA_LLM_DIRECTOR: "0" } }), null);
  const serverError = async () => new Response("boom", { status: 500 });
  assert.equal(await planVideoWithLlm({ prompt: customerPrompt, env: cfEnv, fetchImpl: serverError }), null);
  const noJson = async () => new Response(JSON.stringify({ result: { response: "I cannot help with that." } }));
  assert.equal(await planVideoWithLlm({ prompt: customerPrompt, env: cfEnv, fetchImpl: noJson }), null);
} finally {
  console.warn = quiet;
}

// Script-style request: on-camera speech, headline on top, dip to black.
const talkingPlan = normalizePlan({
  language: "en",
  subject: "A man in his forties with short dark hair in a dark shirt, face softly lit.",
  style: "Kodak Portra 400 film look, low-key but clearly exposed.",
  shots: [{
    visual: "He faces the camera with calm, grave honesty.",
    camera: "Subtle handheld breathing sway.",
    seconds: 10,
    narration: speech,
    on_screen_text: "THE FIRST YEAR AFTER BETRAYAL",
    text_position: "top",
    transition_to_next: "cut",
  }],
  on_camera_speech: true,
  ending: "fade_to_black",
  voice: "male",
  music_mood: "none",
}, { duration: 10 });
assert.equal(talkingPlan.onCameraSpeech, true);
assert.equal(talkingPlan.ending, "fade_to_black");
assert.equal(talkingPlan.beats[0].captionPosition, "top");
assert.equal(talkingPlan.musicMood, "none");
assert.equal(talkingPlan.subtitles, true, "spoken videos get subtitles by default");
assert.equal(talkingPlan.captionStyle, "headline_bold");
assert.match(ltxPrompt(talkingPlan), /^Clean frame with no subtitles/);

// Accent words must exist in the on-screen text.
const accented = normalizePlan({ shots: [{ visual: "x", on_screen_text: "The first year after BETRAYAL",
  accent_words: ["Betrayal", "lie", "betrayal"] }], subtitles: false, narration: "" }, { duration: 5 });
assert.deepEqual(accented.beats[0].accentWords, ["betrayal"]);
assert.equal(accented.subtitles, false);

// Native speech prompt quotes the exact words; the dubbed variant stays silent.
const spoken = ltxPrompt(talkingPlan, { nativeSpeech: true });
assert.ok(spoken.includes(`"${speech}"`));
assert.match(spoken, /calm male voice/);
assert.match(spoken, /No music/);
assert.match(spoken, /No on-screen text/);
assert.doesNotMatch(spoken, /THE FIRST YEAR AFTER BETRAYAL/, "overlay text is post-production, never drawn by the model");
assert.match(ltxPrompt(talkingPlan), /Nobody speaks/);
assert.equal(normalizePlan({ shots: [{ visual: "x" }], on_camera_speech: true }, { duration: 5 }).onCameraSpeech, false,
  "no narration -> no on-camera speech");

// Engine order per request and per deployment switch.
const talking = applyPlanToDirector(scripted, talkingPlan);
assert.deepEqual(engineOrderFor(talking, {}), ["ltx-speech", "wan"]);
const talkingPt = applyPlanToDirector(scripted, { ...talkingPlan, language: "pt-BR" });
assert.deepEqual(engineOrderFor(talkingPt, {}), ["ltx", "wan"], "pt speech: LTX picture + Kokoro dub");
assert.deepEqual(engineOrderFor(talkingPt, { NOVA_LTX_SPEECH_LANGUAGES: "en,pt" }), ["ltx-speech", "wan"]);
assert.deepEqual(engineOrderFor(directed, {}), ["ltx", "wan"], "voice-over videos: LTX picture, Wan fallback");
assert.deepEqual(engineOrderFor(directed, { NOVA_VIDEO_ENGINE_ORDER: "wan" }), ["wan"]);
assert.deepEqual(engineOrderFor(talking, { NOVA_VIDEO_ENGINE_ORDER: "wan" }), ["wan"]);
assert.deepEqual(engineOrderFor(base, {}), [], "regex-director jobs keep the legacy Wan route");
assert.equal(talking.ltxSpeechPrompt, spoken);

// No LLM reachable from the app: the job is marked for worker-side planning.
const unplanned = markForWorkerPlanning(scripted);
assert.equal(unplanned.needsWorkerPlan, true);
assert.equal(unplanned.providerHints.complex, true);
assert.equal(unplanned.providerHints.workerPlanned, true);
assert.deepEqual(engineOrderFor(unplanned, {}), [], "the worker picks engines after planning");
assert.equal(allowsPublicFallback(unplanned.providerHints), true);
assert.equal(allowsPublicFallback(talking.providerHints), true);
assert.equal(allowsPublicFallback({ complex: true }), false, "regex scripts never degrade silently");
assert.equal(allowsPublicFallback({ complex: false }), true);

// Parity fixture for the Python port in the Modal worker.
if (process.env.NOVA_PLAN_PARITY_OUT) {
  const { writeFileSync } = await import("node:fs");
  const fixture = { ...llmPlan, on_camera_speech: true, ending: "fade_to_black",
    caption_style: "headline_clean",
    shots: llmPlan.shots.map((shot, i) => ({ ...shot, text_position: i ? "top" : "bottom", accent_words: ["Vila", "nope"] })) };
  const js = normalizePlan(fixture, { duration: 10 });
  writeFileSync(process.env.NOVA_PLAN_PARITY_OUT, JSON.stringify({
    raw: fixture, duration: 10, plan: js,
    ltx: ltxPrompt(js), ltxSpeech: ltxPrompt(js, { nativeSpeech: true }),
    order: engineOrderFor(applyPlanToDirector(base, js), {}),
  }, null, 1));
}

console.log("NOVA LLM video plan director: OK");
