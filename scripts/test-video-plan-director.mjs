import assert from "node:assert/strict";
import { directVideoPrompt } from "../src/lib/videoPromptDirector.mjs";
import {
  applyPlanToDirector,
  maxShotsFor,
  normalizePlan,
  planVideoWithLlm,
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
for (const beat of plan.beats) {
  const words = beat.narration ? beat.narration.split(" ").length : 0;
  assert.ok(words <= Math.floor((beat.end - beat.start) * 2.3), `narration too long for its shot: ${beat.narration}`);
}

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

// planVideoWithLlm: request shape, model fallback and failure handling.
const calls = [];
const okFetch = async (url, init) => {
  const body = JSON.parse(init.body);
  calls.push(body.model);
  if (body.model === "gpt-4.1-mini") {
    return new Response(JSON.stringify({ error: { code: "model_not_found" } }), { status: 404 });
  }
  assert.equal(url, "https://api.openai.com/v1/chat/completions");
  assert.equal(body.response_format.type, "json_object");
  assert.match(body.messages[0].content, /at most 2 shots/);
  return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(llmPlan) } }] }));
};
const planned = await planVideoWithLlm({
  prompt: customerPrompt,
  duration: 5,
  aspectRatio: "9:16",
  env: { OPENAI_API_KEY: "test" },
  fetchImpl: okFetch,
});
assert.deepEqual(calls, ["gpt-4.1-mini", "gpt-4o-mini"]);
assert.equal(planned.model, "gpt-4o-mini");
assert.equal(planned.beats.length, 2);

const quiet = console.warn;
console.warn = () => {};
try {
  assert.equal(await planVideoWithLlm({ prompt: customerPrompt, env: {} }), null, "no key -> keep regex director");
  assert.equal(
    await planVideoWithLlm({ prompt: customerPrompt, env: { OPENAI_API_KEY: "k", NOVA_LLM_DIRECTOR: "0" } }),
    null,
  );
  const serverError = async () => new Response("boom", { status: 500 });
  assert.equal(
    await planVideoWithLlm({ prompt: customerPrompt, env: { OPENAI_API_KEY: "k" }, fetchImpl: serverError }),
    null,
  );
  const badJson = async () => new Response(JSON.stringify({ choices: [{ message: { content: "not json" } }] }));
  assert.equal(
    await planVideoWithLlm({ prompt: customerPrompt, env: { OPENAI_API_KEY: "k" }, fetchImpl: badJson }),
    null,
  );
} finally {
  console.warn = quiet;
}

console.log("NOVA LLM video plan director: OK");
