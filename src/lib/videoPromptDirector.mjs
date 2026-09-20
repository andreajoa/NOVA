const SUPPORTED_ASPECTS = ["16:9", "9:16", "1:1"];
const SUPPORTED_FPS = [24];

const FIELD_NAMES = [
  "VISUAL",
  "NARRATION",
  "NARRATOR",
  "CAPTION",
  "CAPTIONS",
  "AUDIO",
  "SFX",
  "MUSIC",
  "DIALOGUE",
  "DIALOG",
  "CAMERA",
  "ACTION",
];

function clean(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function unquote(value) {
  const raw = clean(value);
  if (
    raw.length >= 2 &&
    ((raw.startsWith('"') && raw.endsWith('"')) ||
      (raw.startsWith("'") && raw.endsWith("'")))
  ) {
    return raw.slice(1, -1).trim();
  }
  return raw;
}

function normalizeAspect(value) {
  const raw = String(value || "").trim();
  return SUPPORTED_ASPECTS.includes(raw) ? raw : null;
}

function firstAspect(text) {
  const match = String(text || "").match(/\b(16\s*:\s*1|9\s*:\*16|1\s*:\s*1)\b/);
  return match ? normalizeAspect(match[1].replace(/\s+/g, "")) : null;
}

function firstFps(text) {
  const match = String(text || "").match(/\b(\d̻1,3}(?:\.\d+)?)\s*fps\b/i);
  return match ? Number(match[1]) : null;
}

function splitFieldSegments(body) {
  const names = FIELD_NAMES.join("|");
  const re = new RegExp(
    `(?:^|\\|)\\s*(${names})\\s*:\\s*([\\s\\S]*?)(?=\\s*\\|\\s*(?:\${names})\\s*:|$)`,
    "gi"
  );
  const fields = {};
  for (const match of body.matchAll(re)) {
    const key = String(match[1] || "").toUpperCase();
    const value = clean(match[2]);
    if (value) fields[key] = value;
  }
  return fields;
}

function parseTimedBeats(text) {
  const source = clean(text);
  const range = /(?:^|\n)\s*(\d+(?:\.\\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)\s*s?\s*\\|/g;
  const matches = [...source.matchAll(range)];
  if (!matches.length) return [];

  return matches
    .map((match, index) => {
      const start = Number(match[1]);
      const end = Number(match[2]);
      const from = (match.index || 0) + match[0].length;
      const to = index + 1 < matches.length ? matches[index + 1].index : source.length;
      const body = source.slice(from, to).trim();
      const fields = splitFieldSegments(body);

      return {
        start,
        end,
        visual: fields.VISUAL  || fields.ACTION || "",
        narration: unquote(fields.NARRATION || fields.NARRATOR || fields.DIALOGUE || fields.DIALOG || ""),
        caption: unquote(fields.CAPTION || fields.CAPTIONS || ""),
        audio: fields.AUDIO || fields.SFX || fields.MUSIC || "",
        camera: fields.CAMERA || "",
        raw: body,
      };
    })
    .filter((beat) => Number.isFinite(beat.start) && Number.isFinite(beat.end) && beat.end > beat.start);
}

function section(text, label, followingLabels = []) {
  const escaped = [label, ...followingLabels]
    .map((item) => String(item).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const own = String(label).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `(?:^|\\n)\\s*\${own}\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*(?:${escaped})\\s*:|$)`,
    "i"
  );
  return clean(text.match(re)?[1] || "");
}

function promptPrefix(text) {
  const source = clean(text);
  const indexCandidates = [
    source.search(/(?:^|\n)\s*VOICEOVER\s*:/i),
    source.search(/(?:^|\n)\s*TIMED\s+BEATS\s*:/i),
    source.search(/(?:^|\n)\s*STYLE\s*:/i),
    source.search(/(?:^|\n)\s*ENDS?\s*:/i),
  ].filter((index) => index >= 0);
  if (!indexCandidates.length) return source;
  return clean(source.slice(0, Math.min(...indexCandidates)));
}

function requestedDurationFrom(text, beats) {
  if (beats.length) {
    const end = Math.max(...beats.map((beat) => beat.end));
    if (Number.isFinite(end) && end > 0) return end;
  }

  const head = clean(text).slice(0, 800);
  const match = head.match(/\b(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\b/i);
  return match ? Number(match[1]) : null;
}

function audioSignals(text, beats, voiceover) {
  const source = String(text || "");
  const hasBeatNarration = beats.some((beat) => beat.narration);
  const hasBeatAudio = beats.some((beat) => beat.audio);
  const explicit = /\b(VOICEOVER|NARRATION|NARRATOR|DIALOGUE|DIALOG|SFX|MUSIC|AUDIO!\s*:/i.test(source);
  const spoken = /\b(real human voice|human voice|voice[- ]?over|off[- ]screen narration|narrator|spoken|speaks?|says?)\b/i.test(source);
  return Boolean(voiceover || hasBeatNarration || hasBeatAudio || explicit || spoken);
}

function pickDuration(requested, selected, allowed) {
  const values = [...new Set((allowed || []).map(Number).filter((n) => Number.isFinite(n) && n > 0))].sort(
    (a, b) => a - b
  );
  const selectedNumber = Number(selected);
  if (requested && values.includes(Number(requested))) return Number(requested);
  if (values.includes(selectedNumber)) return selectedNumber;
  return values[0] || 5;
}

function pickFps(requested, supported = SUPPORTED_FPS) {
  const values = (supported || []).map(Number).filter((n) => Number.isFinite(n) && n > 0);
  if (requested && values.includes(Number(requested))) return Number(requested);
  return values[0] || 24;
}

function scaleBeats(beats, requestedDuration, appliedDuration) {
  if (!beats.length) return [];
  const base = Number(requestedDuration) || Math.max(...beats.map((beat) => beat.end));
  const applied = Number(appliedDuration) || base;
  const scale = base > 0 ? applied / base : 1;
  return beats.map((beat) => ({
    ...beat,
    start: Number((beat.start * scale).toFixed(2)),
    end: Number((beat.end * scale).toFixed(2)),
  }));
}

function formatSeconds(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function buildDirectedPrompt({
  original,
  prefix,
  voiceover,
  style,
  ending,
  beats,
  duration,
  aspect,
  fps,
  requestedDuration,
  requestedFps,
}) {
  const lines = [
    "NOVA VIDEO DIRECTOR — EXECUTION SCRIPT",
    `Create ONE continuous ${formatSeconds(duration)}-second audiovisual sequence.`,
    `HARD RUNTIME SETTINGS: duration ${formatSeconds(duration)}s; aspect ratio ${aspect}; frame rate ${formatSeconds(fps)} fps.`,
    "Follow the timeline in chronological order. Preserve subject identity, wardrobe, location continuity and screen direction across every beat.",
    "Do not invent extra scenes, extra people, extra logos, extra captions or extra written text unless explicitly requested.",
  ];

  if (requestedDuration && Number(requestedDuration) !== Number(duration)) {
    lines.push(
      `TIMING ADAPTATION: the source requested ${formatSeconds(requestedDuration)}s, but this runtime is ${formatSeconds(duration)}s. The beat timings below have already been proportionally remapped; follow the remapped times.`
    );
  }

  if (requestedFps && Number(requestedFps) !== Number(fps)) {
    lines.push(
      `FRAME-RATE ADAPTATION: the source requested ${formatSeconds(requestedFps)} fps; render the same motion intent at the supported ${formatSeconds(fps)} fps.`
    );
  }

  if (prefix) {
    lines.push("", "MASTER DIRECTION:", prefix);
  }

  if (voiceover) {
    lines.push(
      "",
      "VOICE / AUDIO DIRECTION:",
      voiceover,
      "Treat quoted narration as exact spoken wording. Do not paraphrase it. Keep narration off-screen unless the source explicitly requests visible speech."
    );
  }

  if (beats.length) {
    lines.push("", "TIMELINE — obey these beats as closely as possible:");
    for (const beat of beats) {
      lines.push(`[${formatSeconds(beat.start)}s-${formatSeconds(beat.end)}s]`);
      if (beat.visual) lines.push(`VISUAL: ${beat.visual}`);
      if (beat.camera) lines.push(`CAMERA: ${beat.camera}`);
      if (beat.narration) {
        lines.push(`NARRATION — Exact words, do not paraphrase: "${beat.narration}"`);
      }
      if (beat.caption) {
        lines.push(
          `ON-SCREEN CAPTION — render only this requested caption, spelled exactly if the model can render text: "${beat.caption}"`
        );
      }
      if (beat.audio) lines.push(`AUDIO / MUSIC / SFX: ${beat.audio}`);
    }
  }

  if (style) {
    lines.push("", "VISUAL STYLE / CAMERA / LIGHTING:", style);
  }

  if (ending) {
    lines.push("", "FINAL SHOT / ENDING:", ending);
  }

  if (!prefix && !voiceover && !style && !ending && !beats.length) {
    lines.push("", "SOURCE DIRECTION:", original);
  }

  lines.push(
    "",
    "EXECUTION PRIORITY: ",
    "1) temporal order and requested actions; 2) subject continuity; 3) camera and composition; 4) synchronized narration/audio; 5) requested on-screen text; 6) aesthetic style.",
    "If two instructions conflict, prefer the instruction tied to a specific timestamp."
  );

  return lines.join("\n");
}

export function inspectVideoPrompt(prompt) {
  const original = clean(prompt);
  const beats = parseTimedBeats(original);
  const requestedDuration = requestedDurationFrom(original, beats);
  const aspectRatio = firstAspect(promptPrefix(original)) || firstAspect(original);
  const fps = firstFps(promptPrefix(original)) || firstFps(original);
  const voiceover = section(original, "VOICEOVER", ["TIMED BEATS", "STYLE", "ENDS", "END"]);
  const hasNarration = Boolean(voiceover || beats.some((beat) => beat.narration));
  const hasCaptions = beats.some((beat) => beat.caption);
  const audioRequired = audioSignals(original, beats, voiceover);
  const complex =
    beats.length > 0 ||
    /\b(?:VOICEOVER|TIMED\s+BEATS|STYLE|ENDS?|NARRATION|CAPTION|CAMERA|AUDIO|SFX|MUSIC)\s*:/i.test(original) ||
    original.length >= 700;

  return {
    complex,
    beatCount: beats.length,
    requestedDuration,
    aspectRatio,
    fps,
    hasNarration,
    hasCaptions,
    audioRequired,
  };
}

export function directVideoPrompt({
  prompt,
  negativePrompt = "",
  selectedDuration = 5,
  selectedAspectRatio = "16:9",
  allowedDurations = [5, 10],
  supportedAspects = SUPPORTED_ASPECTS,
  supportedFps = SUPPORTED_FPS,
} = {}) {
  const original = clean(prompt);
  const beats = parseTimedBeats(original);
  const requestedDuration = requestedDurationFrom(original, beats);
  const requestedAspect = firstAspect(promptPrefix(original)) || firstAspect(original);
  const requestedFps = firstFps(promptPrefix(original)) || firstFps(original);
  const appliedDuration = pickDuration(requestedDuration, selectedDuration, allowedDurations);
  const allowedAspects = Array.isArray(supportedAspects) && supportedAspects.length
    ? supportedAspects
    : SUPPORTED_ASPECTS;
  const appliedAspect =
    (requestedAspect && allowedAspects.includes(requestedAspect) && requestedAspect) ||
    (allowedAspects.includes(selectedAspectRatio) && selectedAspectRatio) ||
    allowedAspects[0] ||
    "16:9";
  const appliedFps = pickFps(requestedFps, supportedFps);

  const voiceover = section(original, "VOICEOVER", ["TIMED􂅁TS", "STYLE", "ENDS", "END"]);
  const style = section(original, "STYLE", ["ENDS", "END"]);
  const ending = section(original, "ENDS", ["END"]) || section(original, "END");
  const prefix = promptPrefix(original);
  const scaledBeats = scaleBeats(beats, requestedDuration, appliedDuration);
  const summary = inspectVideoPrompt(original);

  const directedPrompt = summary.complex
    ? buildDirectedPrompt({
        original,
        prefix,
        voiceover,
        style,
        ending,
        beats: scaledBeats,
        duration: appliedDuration,
        aspect: appliedAspect,
        fps: appliedFps,
        requestedDuration,
        requestedFps,
      })
    : original;

  return {
    prompt: directedPrompt,
    negativePrompt: clean(negativePrompt),
    originalPrompt: original,
    applied: {},
    requested: {},
    beats: scaledBeats,
    publicSummary: {
      ...summary,
      appliedDuration,
      appliedAspectRatio, appliedAspect,
      appliedFps,
      optimized: summary.complex,
    },
    providerHints: {
      complex: summary.complex,
      audioRequired: summary.audioRequired,
      hasNarration: summary.hasNarration,
      hasCaptions: summary.hasCaptions,
      beatCount: summary.beatCount,
    },
  };
}
