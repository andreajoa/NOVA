const STYLE_PRESETS = {
  cinematic: {
    label: "Cinematic",
    mood: "cinematic, dramatic, premium, high contrast, film look",
    camera: "slow dolly movement, smooth camera, shallow depth of field",
  },
  luxury: {
    label: "Luxury",
    mood: "luxury, elegant, black and neon green, premium commercial aesthetic",
    camera: "slow macro camera, refined movement, glossy reflections",
  },
  cyberpunk: {
    label: "Cyberpunk",
    mood: "cyberpunk, neon city, futuristic atmosphere, glowing reflections",
    camera: "dynamic tracking shot, neon reflections, energetic movement",
  },
  romantic: {
    label: "Romantic",
    mood: "romantic, soft cinematic light, emotional atmosphere, poetic visuals",
    camera: "slow handheld cinematic movement, intimate close-ups",
  },
  gospel: {
    label: "Gospel",
    mood: "spiritual, hopeful, uplifting, warm light, emotional cinematic story",
    camera: "slow inspirational movement, wide light beams, graceful transitions",
  },
  dark: {
    label: "Dark",
    mood: "dark, mysterious, intense, shadowy atmosphere, dramatic lighting",
    camera: "slow ominous movement, strong contrast, smoke and silhouettes",
  },
  performance: {
    label: "Performance",
    mood: "music video performance, stage lights, artist energy, live cinematic feel",
    camera: "concert camera movement, close-ups, wide stage shots, rhythmic cuts",
  },
  anime: {
    label: "Anime",
    mood: "anime music video, expressive, colorful, emotional, stylized motion",
    camera: "anime camera movement, parallax, dramatic angles",
  },
};

export function clampNumber(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function secondsToTime(totalSeconds) {
  const total = Math.max(0, Math.round(totalSeconds));
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function cleanLines(text = "") {
  return String(text)
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^\[.*\]$/.test(line));
}

function pickLyricChunk(lines, index, totalScenes) {
  if (!lines.length) return "";

  const perScene = Math.max(1, Math.ceil(lines.length / totalScenes));
  const start = index * perScene;
  const slice = lines.slice(start, start + perScene);

  if (slice.length) return slice.join(" / ");

  return lines[index % lines.length] || "";
}

function energyFor(index, total) {
  const position = index / Math.max(1, total - 1);

  if (position < 0.16) return "intro, mysterious build-up";
  if (position < 0.36) return "verse, storytelling, emotional progression";
  if (position < 0.54) return "pre-chorus, rising energy, anticipation";
  if (position < 0.76) return "chorus, powerful visual peak, maximum emotion";
  if (position < 0.9) return "bridge, transformation, surreal visual change";

  return "final chorus, epic ending, memorable closing shot";
}

function transitionFor(index) {
  const transitions = [
    "match cut",
    "light flash transition",
    "whip pan",
    "slow dissolve",
    "neon glow wipe",
    "camera push-through",
    "smoke reveal",
    "lens flare cut",
  ];

  return transitions[index % transitions.length];
}

export function createMusicVideoStoryboard(input = {}) {
  const durationSeconds = clampNumber(input.durationSeconds, 180, 30, 180);
  const sceneSeconds = clampNumber(input.sceneSeconds, 10, 5, 15);
  const totalScenes = Math.ceil(durationSeconds / sceneSeconds);
  const styleKey = input.visualStyle || "cinematic";
  const style = STYLE_PRESETS[styleKey] || STYLE_PRESETS.cinematic;
  const lines = cleanLines(input.lyrics || "");
  const songTitle = input.songTitle || "Untitled Music Video";
  const artistName = input.artistName || "NOVA Artist";
  const mood = input.mood || "";
  const aspectRatio = input.aspectRatio || "16:9";

  const scenes = Array.from({ length: totalScenes }).map((_, index) => {
    const start = index * sceneSeconds;
    const end = Math.min(durationSeconds, start + sceneSeconds);
    const lyricChunk = pickLyricChunk(lines, index, totalScenes);
    const energy = energyFor(index, totalScenes);
    const transition = transitionFor(index);

    const visualConcept = lyricChunk
      ? `visual metaphor inspired by this lyric: "${lyricChunk}"`
      : `visual sequence based on ${energy}`;

    const prompt = [
      `Professional AI music video shot for "${songTitle}" by ${artistName}.`,
      `${style.mood}.`,
      mood ? `Song mood: ${mood}.` : "",
      `Scene energy: ${energy}.`,
      visualConcept + ".",
      `${style.camera}.`,
      `Aspect ratio ${aspectRatio}.`,
      `The shot must feel like part of one coherent full music video.`,
      `No subtitles, no captions, no random text, no watermark, no logo, no UI, no distorted faces.`,
      `High-end color grade, clean composition, cinematic lighting, premium production value.`,
    ].filter(Boolean).join(" ");

    return {
      id: `scene-${String(index + 1).padStart(2, "0")}`,
      index,
      number: index + 1,
      start,
      end,
      startLabel: secondsToTime(start),
      endLabel: secondsToTime(end),
      duration: end - start,
      lyric: lyricChunk,
      energy,
      transition,
      visualStyle: styleKey,
      prompt,
      status: "pending",
      videoUrl: "",
      error: "",
    };
  });

  return {
    title: songTitle,
    artistName,
    durationSeconds,
    sceneSeconds,
    totalScenes,
    visualStyle: styleKey,
    aspectRatio,
    scenes,
  };
}
