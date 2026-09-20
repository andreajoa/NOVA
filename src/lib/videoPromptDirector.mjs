const SUPPORTED_ASPECTS = ["16:9", "9:16", "1:1"];
const SUPPORTED_FPS = [24];
const BEAT_FIELDS = new Set([
  "VISUAL",
  "ACTION",
  "CAMERA",
  "NARRATION",
  "NARRATOR",
  "CAPTION",
  "CAPTIONS",
  "AUDIO",
  "SFX",
  "MUSIC",
  "DIALOGUE",
  "DIALOG",
]);

function clean(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function stripQuotes(value) {
  const raw = clean(value);
  if (raw.length < 2) return raw;
  const first = raw[0];
  const last = raw[raw.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return raw.slice(1, -1).trim();
  }
  return raw;
}

function firstAspect(text) {
  const match = clean(text).match(/\b(16\s*:\s*9|9\s*:\s*16|1\s*:\s*1)\b/);
  if (!match) return null;
  return match[1].replace(/\s+/g, "");
}

function firstFps(text) {
  const match = clean(text).match(/\b(\d{1,3}(?:\.\d+)?)\s*fps\b/i);
  return match ? Number(match[1]) : null;
}

function labelIndex(text, label, from = 0) {
  const source = String(text || "");
  const upper = source.toUpperCase();
  const needle = String(label || "").toUpperCase() + ":";
  if (from === 0 && upper.startsWith(needle)) return 0;
  const index = upper.indexOf("\n" + needle, from);
  return index >= 0 ? index + 1 : -1;
}

function extractSection(text, label, nextLabels = []) {
  const source = clean(text);
  const start = labelIndex(source, label, 0);
  if (start < 0) return "";
  const bodyStart = start + String(label).length + 1;
  let end = source.length;
  for (const next of nextLabels) {
    const index = labelIndex(source, next, bodyStart);
    if (index >= 0 && index < end) end = index;
  }
  return clean(source.slice(bodyStart, end));
}

function firstTopLevelIndex(text) {
  const labels = ["VOICEOVER", "TIMED BEATS", "STYLE", "ENDS", "END"];
  const indexes = labels.map((label) => labelIndex(text, label, 0)).filter((value) => value >= 0);
  return indexes.length ? Math.min(...indexes) : -1;
}

function promptPrefix(text) {
  const source = clean(text);
  const index = firstTopLevelIndex(source);
  return index >= 0 ? clean(source.slice(0, index)) : source;
}

function nextTopLevelIndex(text, from) {
  const labels = ["STYLE", "ENDS", "END", "VOICEOVER", "TIMED BEATS"];
  const indexes = labels.map((label) => labelIndex(text, label, from)).filter((value) => value >= 0);
  return indexes.length ? Math.min(...indexes) : -1;
}

function parseBeatFields(body) {
  const fields = {};
  const parts = String(body || "").split(/\s*\|\s*/);
  for (const part of parts) {
    const colon = part.indexOf(":");
    if (colon <= 0) continue;
    const label = part.slice(0, colon).trim().toUpperCase();
    if (!BEAT_FIELDS.has(label)) continue;
    const value = clean(part.slice(colon + 1));
    if (value) fields[label] = value;
  }
  return fields;
}

function parseTimedBeats(text) {
  const source = clean(text);
  const re = /(?:^|\n)\s*(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)\s*s?\s*\|/g;
  const matches = [...source.matchAll(re)];
  if (!matches.length) return [];

  return matches.map((match, index) => {
    const start = Number(match[1]);
    const end = Number(match[2]);
    const bodyStart = (match.index || 0) + match[0].length;
    let bodyEnd = index + 1 < matches.length ? matches[index + 1].index : source.length;
    const topLevelEnd = nextTopLevelIndex(source, bodyStart);
    if (topLevelEnd >= 0 && topLevelEnd < bodyEnd) bodyEnd = topLevelEnd;
    const fields = parseBeatFields(source.slice(bodyStart, bodyEnd));
    return {
      start,
      end,
      visual: fields.VISUAL || fields.ACTION || "",
      camera: fields.CAMERA || "",
      narration: stripQuotes(
        fields.NARRATION || fields.NARRATOR || fields.DIALOGUE || fields.DIALOG || ""
      ),
      caption: stripQuotes(fields.CAPTION || fields.CAPTIONS || ""),
      audio: fields.AUDIO || fields.SFX || fields.MUSIC || "",
    };
  }).filter((beat) => {
    return Number.isFinite(beat.start) && Number.isFinite(beat.end) && beat.end > beat.start;
  });
}

function requestedDurationFrom(text, beats) {
  if (beats.length) {
    const value = Math.max(...beats.map((beat) => beat.end));
    if (Number.isFinite(value) && value > 0) return value;
  }
  const head = clean(text).slice(0, 900);
  const match = head.match(/\b(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\b/i);
  return match ? Number(match[1]) : null;
}

function detectAudio(text, beats, voiceover) {
  const source = clean(text);
  if (voiceover) return true;
  if (beats.some((beat) => beat.narration || beat.audio)) return true;
  return /\b(?:VOICEOVER|NARRATION|NARRATOR|DIALOGUE|DIALOG|AUDIO|SFX|MUSIC)\s*:/i.test(source) ||
    /\b(?:human voice|voice[- ]?over|off[- ]screen narration|narrator|spoken|speaks?|says?)\b/i.test(source);
}

function pickDuration(requested, selected, allowedDurations) {
  const allowed = [...new Set((allowedDurations || []).map(Number).filter((n) => Number.isFinite(n) && n > 0))]
    .sort((a, b) => a - b);
  if (requested && allowed.includes(Number(requested))) return Number(requested);
  if (allowed.includes(Number(selected))) return Number(selected);
  return allowed[0] || 5;
}

function pickAspect(requested, selected, supportedAspects) {
  const supported = Array.isArray(supportedAspects) && supportedAspects.length
    ? supportedAspects
    : SUPPORTED_ASPECTS;
  if (requested && supported.includes(requested)) return requested;
  if (supported.includes(selected)) return selected;
  return supported[0] || "16:9";
}

function pickFps(requested, supportedFps) {
  const supported = (supportedFps || SUPPORTED_FPS)
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);
  if (requested && supported.includes(Number(requested))) return Number(requested);
  return supported[0] || 24;
}

function scaleBeats(beats, requestedDuration, appliedDuration) {
  if (!beats.length) return [];
  const base = Number(requestedDuration) || Math.max(...beats.map((beat) => beat.end));
  const scale = base > 0 ? Number(appliedDuration) / base : 1;
  return beats.map((beat) => ({
    ...beat,
    start: Number((beat.start * scale).toFixed(2)),
    end: Number((beat.end * scale).toFixed(2)),
  }));
}

function numberText(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function buildVisualPrompt(data) {
  const lines = [
    "NOVA VISUAL DIRECTOR",
    "Generate genuine live-action motion, not a still image with zoom or pan.",
    "Human anatomy must remain stable: consistent face, realistic hands and fingers, natural blinking, breathing and micro-expressions.",
    "Avoid morphing, melting, duplicated fingers, warped eyes, frozen poses, slideshow motion and Ken Burns effects.",
    "Preserve the same person, wardrobe and environment across the sequence.",
  ];

  if (data.prefix) {
    lines.push("", "MASTER VISUAL DIRECTION:", data.prefix);
  }

  if (data.beats.length) {
    lines.push("", "SHOT TIMELINE:");
    for (const beat of data.beats) {
      lines.push("[" + numberText(beat.start) + "s-" + numberText(beat.end) + "s]");
      if (beat.visual) lines.push("VISUAL ACTION: " + beat.visual);
      if (beat.camera) lines.push("CAMERA: " + beat.camera);
      lines.push("The subject must physically act and react during this beat; do not hold a static pose.");
    }
  }

  if (data.style) {
    lines.push("", "VISUAL STYLE / CAMERA / LIGHTING:", data.style);
  }

  if (data.ending) {
    lines.push("", "FINAL CAMERA ACTION:", data.ending);
  }

  lines.push(
    "",
    "Do not render subtitles, captions, lower thirds or narration text inside the generated image. Those are composited after generation."
  );

  return lines.join("\n");
}

function buildDirectedPrompt(data) {
  const lines = [
    "NOVA VIDEO DIRECTOR - EXECUTION SCRIPT",
    "Create ONE continuous " + numberText(data.duration) + "-second audiovisual sequence.",
    "HARD RUNTIME SETTINGS: duration " + numberText(data.duration) + "s; aspect ratio " +
      data.aspect + "; frame rate " + numberText(data.fps) + " fps.",
    "Follow the timeline in chronological order.",
    "Preserve subject identity, wardrobe, location continuity and screen direction across every beat.",
    "Do not invent extra scenes, extra people, extra logos, extra captions or extra written text unless explicitly requested.",
  ];

  if (data.requestedDuration && Number(data.requestedDuration) !== Number(data.duration)) {
    lines.push(
      "TIMING ADAPTATION: source requested " + numberText(data.requestedDuration) +
      "s, but this runtime is " + numberText(data.duration) +
      "s. Beat timings below are already proportionally remapped."
    );
  }

  if (data.requestedFps && Number(data.requestedFps) !== Number(data.fps)) {
    lines.push(
      "FRAME-RATE ADAPTATION: source requested " + numberText(data.requestedFps) +
      " fps; preserve the same motion intent at " + numberText(data.fps) + " fps."
    );
  }

  if (data.prefix) lines.push("", "MASTER DIRECTION:", data.prefix);

  if (data.voiceover) {
    lines.push(
      "",
      "VOICE / AUDIO DIRECTION:",
      data.voiceover,
      "Treat quoted narration as exact spoken wording. Do not paraphrase it.",
      "Keep narration off-screen unless visible speech is explicitly requested."
    );
  }

  if (data.beats.length) {
    lines.push("", "TIMELINE - obey these beats as closely as possible:");
    for (const beat of data.beats) {
      lines.push("[" + numberText(beat.start) + "s-" + numberText(beat.end) + "s]");
      if (beat.visual) lines.push("VISUAL: " + beat.visual);
      if (beat.camera) lines.push("CAMERA: " + beat.camera);
      if (beat.narration) {
        lines.push('NARRATION - exact words, do not paraphrase: "' + beat.narration + '"');
      }
      if (beat.caption) {
        lines.push(
          'ON-SCREEN CAPTION - render only this requested caption, spelled exactly if possible: "' +
            beat.caption + '"'
        );
      }
      if (beat.audio) lines.push("AUDIO / MUSIC / SFX: " + beat.audio);
    }
  }

  if (data.style) lines.push("", "VISUAL STYLE / CAMERA / LIGHTING:", data.style);
  if (data.ending) lines.push("", "FINAL SHOT / ENDING:", data.ending);

  lines.push(
    "",
    "EXECUTION PRIORITY:",
    "1) temporal order and requested actions; 2) subject continuity; 3) camera and composition; " +
      "4) synchronized narration/audio; 5) requested on-screen text; 6) aesthetic style.",
    "If two instructions conflict, prefer the instruction tied to a specific timestamp."
  );

  return lines.join("\n");
}

export function inspectVideoPrompt(prompt) {
  const original = clean(prompt);
  const beats = parseTimedBeats(original);
  const prefix = promptPrefix(original);
  const voiceover = extractSection(original, "VOICEOVER", ["TIMED BEATS", "STYLE", "ENDS", "END"]);
  const requestedDuration = requestedDurationFrom(original, beats);
  const aspectRatio = firstAspect(prefix) || firstAspect(original);
  const fps = firstFps(prefix) || firstFps(original);
  const hasNarration = Boolean(voiceover || beats.some((beat) => beat.narration));
  const hasCaptions = beats.some((beat) => beat.caption);
  const audioRequired = detectAudio(original, beats, voiceover);
  const complex = beats.length > 0 ||
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

export function directVideoPrompt(options = {}) {
  const original = clean(options.prompt);
  const selectedDuration = Number(options.selectedDuration || 5);
  const selectedAspectRatio = options.selectedAspectRatio || "16:9";
  const allowedDurations = options.allowedDurations || [5, 10];
  const supportedAspects = options.supportedAspects || SUPPORTED_ASPECTS;
  const supportedFps = options.supportedFps || SUPPORTED_FPS;

  const beats = parseTimedBeats(original);
  const prefix = promptPrefix(original);
  const voiceover = extractSection(original, "VOICEOVER", ["TIMED BEATS", "STYLE", "ENDS", "END"]);
  const style = extractSection(original, "STYLE", ["ENDS", "END"]);
  const ending = extractSection(original, "ENDS", ["END"]) || extractSection(original, "END");
  const requestedDuration = requestedDurationFrom(original, beats);
  const requestedAspect = firstAspect(prefix) || firstAspect(original);
  const requestedFps = firstFps(prefix) || firstFps(original);
  const appliedDuration = pickDuration(requestedDuration, selectedDuration, allowedDurations);
  const appliedAspect = pickAspect(requestedAspect, selectedAspectRatio, supportedAspects);
  const appliedFps = pickFps(requestedFps, supportedFps);
  const scaledBeats = scaleBeats(beats, requestedDuration, appliedDuration);
  const summary = inspectVideoPrompt(original);

  const directed = summary.complex
    ? buildDirectedPrompt({
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

  const visualPrompt = summary.complex
    ? buildVisualPrompt({
        prefix,
        style,
        ending,
        beats: scaledBeats,
      })
    : original;

  return {
    prompt: directed,
    visualPrompt,
    visualStyle: style,
    endingDirection: ending,
    voiceoverDirection: voiceover,
    negativePrompt: clean(options.negativePrompt),
    originalPrompt: original,
    applied: {
      duration: appliedDuration,
      aspectRatio: appliedAspect,
      fps: appliedFps,
    },
    requested: {
      duration: requestedDuration,
      aspectRatio: requestedAspect,
      fps: requestedFps,
    },
    beats: scaledBeats,
    publicSummary: {
      ...summary,
      appliedDuration,
      appliedAspectRatio: appliedAspect,
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
