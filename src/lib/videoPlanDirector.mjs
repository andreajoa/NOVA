// NOVA LLM video director.
//
// The regex director in videoPromptDirector.mjs only understands prompts that
// already follow NOVA's technical format (TIMED BEATS / VOICEOVER / STYLE).
// Real customers write free text, usually in Portuguese, mixing visuals with
// music, narration and on-screen text. Sent raw to a diffusion model, that
// becomes one silent shot with garbled lettering.
//
// This module turns any free-text request into a shot plan the Modal worker
// already knows how to render: English visual prompts per shot, narration in
// the customer's language sized to fit its shot, on-screen text rendered by
// ffmpeg, a music mood and the transition between shots.
//
// Any failure (no key, timeout, bad JSON, unknown model) returns null and the
// caller keeps the regex director's result, so this never blocks generation.
//
// Default provider is Cloudflare Workers AI on the account NOVA already uses for
// free images: it runs inside the 10k neurons/day free allocation. The 8B fp8
// fast model costs ~27 neurons per plan (vs ~81 for the JSON-mode 8B), which
// with the 30-video daily capacity cap stays beside the image cap. OpenAI is an
// opt-in alternative (NOVA_DIRECTOR_PROVIDER=openai) because it is metered.

const CLOUDFLARE_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8-fast";
const OPENAI_MODELS = ["gpt-4.1-mini", "gpt-4o-mini"];
const REQUEST_TIMEOUT_MS = 12000;

// Pace used to size narration: relaxed pt-BR/en voice-over speed. The worker
// never speeds narration up by more than ~1.2x, so the budget has to hold.
const WORDS_PER_SECOND = 2.5;
const NARRATION_EDGE_SECONDS = 0.4;
const MIN_SHOT_SECONDS = 1.6;
const MAX_ON_SCREEN_TEXT = 48;

export const MUSIC_MOODS = [
  "none", "calm", "upbeat", "cinematic", "emotional", "corporate",
  "lofi", "epic", "romantic", "tense", "playful",
];
export const TRANSITIONS = [
  "cut", "fade", "dissolve", "slideleft", "slideright", "wipeleft", "circleopen", "smoothleft",
];
const VOICES = ["none", "female", "male"];
export const TEXT_POSITIONS = ["bottom", "top", "center"];
const ENDINGS = ["none", "fade_to_black"];
export const CAPTION_STYLES = ["headline_bold", "headline_clean"];

function wordKey(word) {
  return String(word || "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

// Accent words must actually appear in the on-screen text; at most two.
function pickAccents(raw, caption) {
  if (!caption || !Array.isArray(raw)) return [];
  const present = new Set(caption.split(" ").map(wordKey));
  const picked = [];
  for (const word of raw) {
    const key = wordKey(word);
    if (key && present.has(key) && !picked.includes(key)) picked.push(key);
  }
  return picked.slice(0, 2);
}

const SYSTEM_PROMPT = `You are NOVA's video director. Convert a customer's request (any language, usually Brazilian Portuguese) into a production plan for a short AI-generated video.

Return ONLY a JSON object with this exact shape:
{
  "language": "BCP-47 code of the customer's language, e.g. pt-BR",
  "subject": "English. One sentence describing the main subject and setting exactly as it must look in every shot (appearance, clothing, place, lighting).",
  "style": "English. Visual style: film look, color palette, lens, mood.",
  "shots": [
    {
      "visual": "English. ONE continuous physical action for this shot, concrete and filmable.",
      "camera": "English. One camera move or framing.",
      "seconds": 2.5,
      "narration": "Customer's language. Spoken voice-over for this shot, or empty string.",
      "on_screen_text": "Exact text to show on screen during this shot, or empty string.",
      "text_position": "one of: ${TEXT_POSITIONS.join(", ")}",
      "accent_words": ["1-2 key words from on_screen_text to highlight in an accent color, or empty list"],
      "transition_to_next": "one of: ${TRANSITIONS.join(", ")}"
    }
  ],
  "on_camera_speech": "true if a person in the video speaks the narration to the camera (lip-synced); false for an off-screen voice-over",
  "subtitles": "true to burn subtitles of the spoken words (default true when anything is spoken); false only if the customer asked for no subtitles",
  "caption_style": "one of: ${CAPTION_STYLES.join(", ")}",
  "ending": "one of: ${ENDINGS.join(", ")}",
  "voice": "one of: ${VOICES.join(", ")}",
  "music_mood": "one of: ${MUSIC_MOODS.join(", ")}",
  "ambience": "English. Short description of ambient sound, or empty string."
}

Rules:
- The request may contain production notes, shell commands, file names, flags and tool names (e.g. "node scripts/...", "--ar 9:16", "out/b1.mp4", "CapCut", "<PREAMBLE>"). Ignore them; extract only the creative intent.
- If the customer wrote the exact words to be spoken, use them verbatim as narration (same language, same wording), split across shots in order.
- Faces and the main subject must always be clearly lit and visible, even in dark or dramatic moods (low-key lighting, never underexposed).
- Use at most MAX_SHOTS shots. Use 1 shot when the request describes a single moment. Seconds of all shots must add up to TOTAL_SECONDS.
- Never ask the video model to draw text, logos, subtitles or captions: any text the customer wants on screen goes ONLY in on_screen_text, copied exactly as the customer wrote it.
- Never describe music, voices or sounds inside "visual" or "camera".
- Narration only if the customer asked for narration, speech, a voice, a message spoken, or a slogan to be said. Keep the whole narration within about ${WORDS_PER_SECOND} words per second of video. Write it in the language the customer used for the spoken words.
- "voice" is "none" when there is no narration; otherwise match the voice the customer asked for (default female).
- music_mood is "none" only if the customer explicitly asked for no music.
- Prefer "fade" or "dissolve" transitions unless the customer asked for something energetic.
- text_position follows the customer's placement ("top center" -> top); default bottom.
- ending is "fade_to_black" when the customer asks for a fade/dip to black at the end.
- Keep the subject identical across shots so the video looks like one continuous production.`;

function clean(value) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .trim();
}

function oneLine(value, max) {
  const text = clean(value).replace(/\s+/g, " ");
  return max ? text.slice(0, max).trim() : text;
}

function pick(value, allowed, fallback) {
  const text = oneLine(value).toLowerCase();
  return allowed.includes(text) ? text : fallback;
}

function limitWords(text, maxWords) {
  const words = oneLine(text).split(" ").filter(Boolean);
  if (maxWords <= 0) return "";
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ").replace(/[,;:\-–]+$/, "");
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

export function maxShotsFor(duration) {
  return Number(duration) <= 5 ? 2 : 3;
}

// Clamp an LLM plan into something the worker can render inside the applied
// duration. Everything the model returned is treated as untrusted input.
export function normalizePlan(raw, { duration }) {
  const total = Math.max(2, Number(duration) || 5);
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.shots)) return null;

  const maxShots = Math.max(1, Math.min(maxShotsFor(total), Math.floor(total / MIN_SHOT_SECONDS)));
  let shots = raw.shots
    .filter((shot) => shot && typeof shot === "object" && oneLine(shot.visual))
    .slice(0, maxShots);
  if (!shots.length) return null;

  const subject = oneLine(raw.subject, 400);
  const style = oneLine(raw.style, 300);

  // Re-time shots proportionally so they tile [0, total] exactly.
  const requested = shots.map((shot) => Math.max(0.1, Number(shot.seconds) || total / shots.length));
  const sum = requested.reduce((a, b) => a + b, 0);
  let seconds = requested.map((value) => (value / sum) * total);
  if (seconds.some((value) => value < MIN_SHOT_SECONDS)) {
    seconds = shots.map(() => total / shots.length);
  }

  let cursor = 0;
  const beats = shots.map((shot, index) => {
    const start = round2(cursor);
    const end = index === shots.length - 1 ? round2(total) : round2(cursor + seconds[index]);
    cursor = end;
    const visual = oneLine(shot.visual, 400);
    return {
      start,
      end,
      visual: subject ? `${subject} ${visual}` : visual,
      camera: oneLine(shot.camera, 200),
      narration: oneLine(shot.narration, 600),
      caption: oneLine(shot.on_screen_text, MAX_ON_SCREEN_TEXT),
      captionPosition: pick(shot.text_position, TEXT_POSITIONS, "bottom"),
      accentWords: pickAccents(shot.accent_words, oneLine(shot.on_screen_text, MAX_ON_SCREEN_TEXT)),
      audio: "",
      transition: index === shots.length - 1 ? "cut" : pick(shot.transition_to_next, TRANSITIONS, "fade"),
    };
  });

  // One budget for the whole video: the worker lets a line run into the next
  // shot, so verbatim speech split unevenly across shots is not cut mid-way.
  let remaining = Math.floor(Math.max(0, total - 2 * NARRATION_EDGE_SECONDS) * WORDS_PER_SECOND);
  for (const beat of beats) {
    const words = beat.narration ? beat.narration.split(" ").length : 0;
    beat.narration = limitWords(beat.narration, remaining);
    remaining -= Math.min(words, remaining);
  }

  const hasNarration = beats.some((beat) => beat.narration);
  let voice = pick(raw.voice, VOICES, hasNarration ? "female" : "none");
  if (!hasNarration) voice = "none";
  if (hasNarration && voice === "none") voice = "female";

  const ambience = oneLine(raw.ambience, 160);
  if (ambience) beats[0].audio = ambience;

  const onCameraSpeech = hasNarration && (raw.on_camera_speech === true || /^true$/i.test(oneLine(raw.on_camera_speech)));

  return {
    subtitles: hasNarration && raw.subtitles !== false && !/^false$/i.test(oneLine(raw.subtitles)),
    captionStyle: pick(raw.caption_style, CAPTION_STYLES, "headline_bold"),
    onCameraSpeech,
    ending: pick(raw.ending, ENDINGS, "none"),
    ambience,
    language: oneLine(raw.language, 16) || "pt-BR",
    subject,
    style,
    beats,
    voice,
    musicMood: pick(raw.music_mood, MUSIC_MOODS, "cinematic"),
  };
}

// The regex director flags long prompts as complex even when it found no
// timed beats; only real multi-beat scripts should skip the LLM planner.
export function shouldPlanWithLlm(director, mode) {
  const plannable = mode === "text-to-video" || mode === "image-to-video";
  return plannable && (director?.beats?.length || 0) < 2;
}

// Engine sequence for an LLM-planned job, tried in order by the worker until
// one succeeds. "ltx" is the joint audio-video engine on free ZeroGPU; "wan"
// is the Apache-2.0 stack on NOVA's own GPUs. NOVA_VIDEO_ENGINE_ORDER limits
// which families may run (e.g. "wan" alone if LTX licensing becomes an issue).
// On-camera speech uses LTX's native voice only for languages verified to
// sound right (NOVA_LTX_SPEECH_LANGUAGES); others get LTX picture + Kokoro dub.
export function engineOrderFor(director, env = process.env) {
  if (!director?.providerHints?.llmPlanned) return [];
  const families = String(env.NOVA_VIDEO_ENGINE_ORDER || "ltx,wan")
    .split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  const speechLanguages = String(env.NOVA_LTX_SPEECH_LANGUAGES || "en")
    .split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  const language = String(director.language || "").toLowerCase();

  // Wan S2V measured ~25 A100-minutes per 10s clip, so it is not in the chain.
  let order = ["ltx", "wan"];
  if (director.onCameraSpeech) {
    const ltxSpeaks = speechLanguages.some((code) => language.startsWith(code));
    order = ltxSpeaks ? ["ltx-speech", "wan"] : ["ltx", "wan"];
  }
  return order.filter((name) => families.includes(name.split("-")[0]));
}

// When the app cannot plan (no LLM provider reachable), the Modal worker plans
// the raw prompt itself on its own GPU (Qwen3-8B). complex routes the job to
// the Modal worker, the only one that plans and post-produces.
export function markForWorkerPlanning(director) {
  return {
    ...director,
    needsWorkerPlan: true,
    publicSummary: { ...director.publicSummary, optimized: true, planner: "worker" },
    providerHints: { ...director.providerHints, complex: true, workerPlanned: true },
  };
}

// Regex-scripted complex jobs must not silently degrade to a single public
// pass; planned free-text jobs may, since that still beats an error.
export function allowsPublicFallback(hints = {}) {
  return !hints?.complex || Boolean(hints.llmPlanned || hints.workerPlanned);
}

function singlePassPrompt(plan) {
  const lines = [];
  if (plan.beats.length === 1) {
    lines.push(plan.beats[0].visual);
    if (plan.beats[0].camera) lines.push(`Camera: ${plan.beats[0].camera}.`);
  } else {
    plan.beats.forEach((beat, index) => {
      lines.push(`Shot ${index + 1}: ${beat.visual}${beat.camera ? ` Camera: ${beat.camera}.` : ""}`);
    });
  }
  if (plan.style) lines.push(`Style: ${plan.style}`);
  lines.push("No text, letters, subtitles or logos in the image.");
  return lines.join("\n");
}

function voiceDescription(plan) {
  const who = plan.voice === "male" ? "calm male voice" : "warm female voice";
  const english = /^en/i.test(plan.language);
  return english ? who : `${who}, speaking ${plan.language}`;
}

// Prompt for a joint audio-video engine (LTX-2.x). Everything the model should
// hear is written as audio direction; on-screen text and music are added in
// post-production, and off-screen narration is dubbed with NOVA's own TTS, so
// the model is only asked to speak when a person talks on camera.
export function ltxPrompt(plan, { nativeSpeech = false } = {}) {
  const parts = ["Clean frame with no subtitles, no captions and no text anywhere."];
  plan.beats.forEach((beat, index) => {
    const lead = plan.beats.length === 1 ? "" : index === 0 ? "The video opens on: " : "Then: ";
    parts.push(`${lead}${beat.visual}${beat.camera ? ` ${beat.camera}` : ""}`.trim());
  });
  if (plan.style) parts.push(plan.style);
  const speech = plan.beats.map((beat) => beat.narration).filter(Boolean).join(" ");
  if (nativeSpeech && plan.onCameraSpeech && speech) {
    parts.push(
      `The person looks into the camera and speaks with natural lip movement, saying in a ${voiceDescription(plan)}: "${speech}"`,
    );
  } else {
    parts.push("Nobody speaks.");
  }
  parts.push(plan.ambience ? `Audio: ${plan.ambience}. No music.` : "Audio: natural ambient sound only. No music.");
  parts.push("No on-screen text, subtitles, captions or logos.");
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

// Merge a normalized plan into the regex director's result so the rest of the
// route (quota, capacity, job records) keeps working unchanged.
export function applyPlanToDirector(director, plan) {
  const hasNarration = plan.beats.some((beat) => beat.narration);
  const hasCaptions = plan.beats.some((beat) => beat.caption);
  const hasMusic = plan.musicMood !== "none";
  const prompt = singlePassPrompt(plan);

  return {
    ...director,
    prompt,
    visualPrompt: prompt,
    visualStyle: plan.style,
    endingDirection: "",
    voiceoverDirection: plan.voice === "none" ? "" : `${plan.voice} voice, ${plan.language}`,
    beats: plan.beats,
    musicMood: plan.musicMood,
    language: plan.language,
    onCameraSpeech: plan.onCameraSpeech,
    ending: plan.ending,
    subtitles: plan.subtitles,
    captionStyle: plan.captionStyle,
    ltxPrompt: ltxPrompt(plan),
    ltxSpeechPrompt: ltxPrompt(plan, { nativeSpeech: true }),
    publicSummary: {
      ...director.publicSummary,
      beatCount: plan.beats.length,
      hasNarration,
      hasCaptions,
      audioRequired: hasNarration || hasMusic,
      optimized: true,
      planner: "app",
    },
    providerHints: {
      ...director.providerHints,
      // complex routes the job to the Modal worker, the only one that runs
      // the narration / music / caption post-production.
      complex: true,
      llmPlanned: true,
      audioRequired: hasNarration || hasMusic,
      hasNarration,
      hasCaptions,
      beatCount: plan.beats.length,
    },
  };
}

// Small models sometimes wrap JSON in prose or code fences.
export function extractJson(text) {
  if (text && typeof text === "object") return text;
  const raw = String(text || "");
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first < 0 || last <= first) throw new Error("director LLM returned no JSON object");
  return JSON.parse(raw.slice(first, last + 1));
}

function systemPrompt(duration) {
  return SYSTEM_PROMPT
    .replace("MAX_SHOTS", String(maxShotsFor(duration)))
    .replace("TOTAL_SECONDS", String(duration));
}

function userPrompt({ prompt, duration, aspectRatio }) {
  return `Total duration: ${duration} seconds. Aspect ratio: ${aspectRatio}.\nCustomer request:\n${prompt}`;
}

async function postJson(fetchImpl, url, headers, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {
      method: "POST",
      signal: controller.signal,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok) {
      const error = new Error(`director LLM HTTP ${response.status}: ${text.slice(0, 300)}`);
      error.status = response.status;
      error.modelMissing = response.status === 404 || /model_not_found|does not exist|no such model/i.test(text);
      throw error;
    }
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

function cloudflareCredentials(env) {
  const accountId = oneLine(env.CLOUDFLARE_ACCOUNT_ID);
  const apiToken = oneLine(env.CLOUDFLARE_AI_API_TOKEN || env.CLOUDFLARE_API_TOKEN);
  return accountId && apiToken ? { accountId, apiToken } : null;
}

async function planWithCloudflare(request, env, fetchImpl) {
  const creds = cloudflareCredentials(env);
  if (!creds) {
    console.warn("[NOVA_VIDEO] LLM director: no Cloudflare credentials; the worker will plan");
    return null;
  }
  const model = oneLine(env.NOVA_DIRECTOR_MODEL) || CLOUDFLARE_MODEL;
  const payload = await postJson(
    fetchImpl,
    `https://api.cloudflare.com/client/v4/accounts/${creds.accountId}/ai/run/${model}`,
    { Authorization: `Bearer ${creds.apiToken}` },
    {
      messages: [
        { role: "system", content: systemPrompt(request.duration) },
        { role: "user", content: userPrompt(request) },
      ],
      max_tokens: 1200,
      temperature: 0.3,
    },
  );
  return { raw: extractJson(payload?.result?.response), model };
}

async function planWithOpenAi(request, env, fetchImpl) {
  const apiKey = oneLine(env.OPENAI_API_KEY);
  if (!apiKey) return null;
  const configured = oneLine(env.NOVA_DIRECTOR_MODEL);
  for (const model of configured ? [configured] : OPENAI_MODELS) {
    try {
      const payload = await postJson(
        fetchImpl,
        "https://api.openai.com/v1/chat/completions",
        { Authorization: `Bearer ${apiKey}` },
        {
          model,
          response_format: { type: "json_object" },
          max_completion_tokens: 1200,
          messages: [
            { role: "system", content: systemPrompt(request.duration) },
            { role: "user", content: userPrompt(request) },
          ],
        },
      );
      return { raw: extractJson(payload?.choices?.[0]?.message?.content), model };
    } catch (error) {
      if (!error?.modelMissing) throw error;
      console.warn("[NOVA_VIDEO] LLM director model unavailable", { model });
    }
  }
  return null;
}

export async function planVideoWithLlm(options = {}) {
  const env = options.env || process.env;
  const fetchImpl = options.fetchImpl || fetch;
  const request = {
    prompt: clean(options.prompt).slice(0, 4000),
    duration: Number(options.duration) || 5,
    aspectRatio: options.aspectRatio || "16:9",
  };
  if (!request.prompt || String(env.NOVA_LLM_DIRECTOR || "1") === "0") return null;

  const provider = oneLine(env.NOVA_DIRECTOR_PROVIDER || "cloudflare").toLowerCase();
  try {
    const result = provider === "openai"
      ? await planWithOpenAi(request, env, fetchImpl)
      : await planWithCloudflare(request, env, fetchImpl);
    if (!result) return null;
    const plan = normalizePlan(result.raw, { duration: request.duration });
    if (!plan) {
      console.warn("[NOVA_VIDEO] LLM director returned an unusable plan", { provider, model: result.model });
      return null;
    }
    return { ...plan, provider, model: result.model };
  } catch (error) {
    console.warn("[NOVA_VIDEO] LLM director failed", {
      provider,
      message: String(error?.message || error).slice(0, 300),
    });
    return null;
  }
}
