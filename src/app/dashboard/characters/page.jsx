"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "nova.characterStudio.characters.v1";

const IMAGE_TEXT_ENDPOINT = "openai/gpt-image-2";
const IMAGE_EDIT_ENDPOINT = "openai/gpt-image-2/edit";
const VIDEO_ENDPOINT = "bytedance/seedance-2.0/image-to-video";

const visualStyles = [
  "Photorealistic cinematic",
  "Premium 3D character",
  "Anime storytelling",
  "Children book illustration",
  "Pixar-like stylized 3D",
  "Dark fantasy cinematic",
  "Fashion editorial",
];

const ageRanges = ["Child", "Teen", "Young adult", "Adult", "Older adult"];
const ratios = ["9:16", "1:1", "16:9"];
const videoDurations = [5, 6, 7, 8, 9, 10, 12, 15];
const videoResolutions = ["480p", "720p"];

const referenceShotTemplates = [
  {
    key: "hero",
    label: "Hero Portrait",
    prompt:
      "front-facing hero portrait, neutral expression, clear face, clean background, high identity clarity",
  },
  {
    key: "full-body",
    label: "Full Body",
    prompt:
      "full body character reference, standing pose, same outfit, clear proportions, clean background",
  },
  {
    key: "three-quarter",
    label: "3/4 View",
    prompt:
      "three-quarter view character reference, same face and outfit, cinematic studio light",
  },
  {
    key: "expression",
    label: "Expression",
    prompt:
      "close-up expressive portrait, same face, same hairstyle, same outfit, subtle emotion",
  },
];

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function extractFirstUrl(payload) {
  const urls = [];
  const seen = new Set();

  function add(value) {
    if (!value || typeof value !== "string") return;
    const matches = value.match(/https?:\/\/[^\s"'<>\\]+/g) || [];

    for (const raw of matches.length ? matches : [value]) {
      const clean = String(raw)
        .replace(/\\u0026/g, "&")
        .replace(/&amp;/g, "&")
        .replace(/[),.;\]]+$/g, "");

      if (/^https?:\/\//i.test(clean)) urls.push(clean);
    }
  }

  function walk(value) {
    if (value == null) return;
    if (typeof value === "string") return add(value);
    if (typeof value !== "object") return;
    if (seen.has(value)) return;
    seen.add(value);

    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }

    const priority = [
      "mediaUrl",
      "videoUrl",
      "outputUrl",
      "url",
      "image",
      "images",
      "video",
      "videos",
      "data",
      "output",
      "result",
      "raw",
      "rawOutput",
      "file",
      "files",
    ];

    for (const key of priority) {
      if (key in value) walk(value[key]);
    }

    for (const key of Object.keys(value)) {
      if (!priority.includes(key)) walk(value[key]);
    }
  }

  walk(payload);

  const unique = [...new Set(urls)];

  return (
    unique.find((url) => /\.(mp4|webm|mov|png|jpg|jpeg|webp)(\?|#|$)/i.test(url)) ||
    unique.find((url) => /fal|r2|storage|image|video/i.test(url)) ||
    unique[0] ||
    ""
  );
}

function extractUrls(payload) {
  const all = [];
  const seen = new Set();

  function add(value) {
    if (!value || typeof value !== "string") return;
    const matches = value.match(/https?:\/\/[^\s"'<>\\]+/g) || [];
    for (const raw of matches.length ? matches : [value]) {
      const clean = String(raw)
        .replace(/\\u0026/g, "&")
        .replace(/&amp;/g, "&")
        .replace(/[),.;\]]+$/g, "");
      if (/^https?:\/\//i.test(clean)) all.push(clean);
    }
  }

  function walk(value) {
    if (value == null) return;
    if (typeof value === "string") return add(value);
    if (typeof value !== "object") return;
    if (seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) return value.forEach(walk);
    Object.values(value).forEach(walk);
  }

  walk(payload);
  return [...new Set(all)];
}

function isVideo(url) {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(String(url || "")) || /video/i.test(String(url || ""));
}

function downloadHref(url, filename) {
  return `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
}

function buildIdentityBible(form) {
  return `
Character name: ${form.name || "Unnamed character"}
Visual style: ${form.visualStyle}
Age range: ${form.ageRange}
Identity: ${form.identity || "Not specified"}
Face: ${form.face || "consistent recognizable face"}
Hair: ${form.hair || "consistent hairstyle"}
Outfit: ${form.outfit || "consistent outfit"}
Body/proportions: ${form.body || "consistent body proportions"}
Accessories: ${form.accessories || "same accessories"}
Personality: ${form.personality || "clear expressive personality"}
Locked details that must never change: ${form.lockedDetails || "face, hairstyle, outfit, body proportions, colors, and visual style"}
`.trim();
}

function buildReferencePrompt(form, shotPrompt) {
  return `
Create a professional character reference image.

${buildIdentityBible(form)}

Reference shot:
${shotPrompt}

Rules:
- Keep the character identity consistent and recognizable.
- Keep the same face, hairstyle, body proportions, outfit, colors, and accessories.
- Clean composition.
- No extra characters.
- No text, no watermark, no logo.
- High-quality production-ready character reference.
`.trim();
}

function buildScenePrompt(character, scene) {
  return `
Create one story scene using the saved character as the main subject.

Character Bible:
${character.identityBible}

Scene:
${scene.description}

Scene controls:
Emotion: ${scene.emotion}
Pose/action: ${scene.pose}
Camera: ${scene.camera}
Environment: ${scene.environment}
Lighting: ${scene.lighting}
Visual style: ${character.visualStyle}

Strict continuity rules:
- This must be the exact same character identity from the reference.
- Preserve face, hairstyle, outfit, body proportions, color palette, and accessories.
- Only change pose, expression, camera angle, and environment according to the scene.
- Do not replace the character.
- No text, no watermark.
`.trim();
}

function buildVideoPrompt(character, scene) {
  return `
Animate this story scene into a cinematic video clip.

Character continuity:
Use the image as the main character reference. Keep the exact same face, hairstyle, outfit, proportions, colors and identity.

Story beat:
${scene.description}

Motion:
${scene.videoMotion || "subtle cinematic movement, natural expression, smooth camera push-in, believable motion"}

Camera:
${scene.camera || "cinematic medium shot"}

Rules:
- Keep character identity consistent.
- Do not morph the face.
- Do not change outfit.
- Do not add random characters.
- No text overlays, no watermark.
`.trim();
}

function Button({ active, children, onClick, disabled, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-[0.13em] transition",
        active
          ? "border-[#D7FF00] bg-[#D7FF00] text-black shadow-[0_0_35px_rgba(215,255,0,.18)]"
          : "border-white/10 bg-white/[0.035] text-white/65 hover:border-[#D7FF00]/45 hover:text-[#D7FF00]",
        disabled ? "cursor-not-allowed opacity-40" : "",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Field({ label, value, onChange, placeholder, textarea = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-white/40">
        {label}
      </span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full resize-none rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-[#D7FF00]/55"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-12 w-full rounded-2xl border border-white/10 bg-black/45 px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#D7FF00]/55"
        />
      )}
    </label>
  );
}

export default function CharacterStudioPage() {
  const [characters, setCharacters] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    visualStyle: visualStyles[0],
    ageRange: "Young adult",
    identity: "",
    face: "",
    hair: "",
    outfit: "",
    body: "",
    accessories: "",
    personality: "",
    lockedDetails: "",
    referenceUrl: "",
  });

  const [scene, setScene] = useState({
    description: "",
    emotion: "calm and focused",
    pose: "natural expressive pose",
    camera: "cinematic medium shot",
    environment: "story-relevant environment",
    lighting: "soft cinematic lighting",
    ratio: "9:16",
    videoDuration: 5,
    videoResolution: "480p",
    videoMotion: "subtle cinematic motion and natural expression",
  });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) {
        setCharacters(saved);
        if (saved[0]?.id) setSelectedId(saved[0].id);
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
  }, [characters]);

  const selectedCharacter = useMemo(
    () => characters.find((item) => item.id === selectedId) || null,
    [characters, selectedId]
  );

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateScene(key, value) {
    setScene((current) => ({ ...current, [key]: value }));
  }

  async function uploadReference(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || "Could not upload reference image.");
    }

    const url = extractFirstUrl(data);

    if (!url) {
      throw new Error("Upload worked, but no file URL was returned.");
    }

    return url;
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy("Uploading reference image...");
    setError("");

    try {
      const url = await uploadReference(file);
      updateForm("referenceUrl", url);
    } catch (err) {
      setError(err?.message || "Upload failed.");
    } finally {
      setBusy("");
    }
  }

  async function callGenerate(body) {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data?.success) {
      throw new Error(data?.message || data?.error || "Generation failed.");
    }

    return data;
  }

  async function createCharacter() {
    if (!form.name.trim()) {
      setError("Give your character a name first.");
      return;
    }

    setBusy("Creating consistent character reference pack...");
    setError("");

    try {
      const identityBible = buildIdentityBible(form);
      const references = [];

      for (const shot of referenceShotTemplates) {
        setBusy(`Generating ${shot.label}...`);

        const endpoint = form.referenceUrl ? IMAGE_EDIT_ENDPOINT : IMAGE_TEXT_ENDPOINT;

        const data = await callGenerate({
          endpoint,
          model: "gpt-image",
          mode: form.referenceUrl ? "image-editing" : "text-to-image",
          type: "image",
          prompt: buildReferencePrompt(form, shot.prompt),
          ...(form.referenceUrl ? { image_url: form.referenceUrl } : {}),
          image_size: "auto",
          num_images: 1,
        });

        const url = extractFirstUrl(data);

        if (url) {
          references.push({
            id: uid(),
            label: shot.label,
            url,
          });
        }
      }

      const character = {
        id: uid(),
        name: form.name.trim(),
        visualStyle: form.visualStyle,
        ageRange: form.ageRange,
        identityBible,
        references,
        scenes: [],
        videos: [],
        createdAt: new Date().toISOString(),
      };

      setCharacters((current) => [character, ...current]);
      setSelectedId(character.id);
      setBusy("");
    } catch (err) {
      setError(err?.message || "Could not create character.");
      setBusy("");
    }
  }

  async function generateSceneImage() {
    if (!selectedCharacter) {
      setError("Choose a character first.");
      return;
    }

    if (!scene.description.trim()) {
      setError("Describe the story scene first.");
      return;
    }

    const referenceUrl = selectedCharacter.references?.[0]?.url;

    if (!referenceUrl) {
      setError("This character does not have a reference image yet.");
      return;
    }

    setBusy("Generating consistent story scene...");
    setError("");

    try {
      const data = await callGenerate({
        endpoint: IMAGE_EDIT_ENDPOINT,
        model: "gpt-image",
        mode: "image-editing",
        type: "image",
        image_url: referenceUrl,
        prompt: buildScenePrompt(selectedCharacter, scene),
        image_size: "auto",
        num_images: 1,
      });

      const url = extractFirstUrl(data);

      if (!url) throw new Error("Scene generated, but no image URL was returned.");

      const newScene = {
        id: uid(),
        description: scene.description,
        emotion: scene.emotion,
        pose: scene.pose,
        camera: scene.camera,
        environment: scene.environment,
        lighting: scene.lighting,
        ratio: scene.ratio,
        imageUrl: url,
        createdAt: new Date().toISOString(),
      };

      setCharacters((current) =>
        current.map((character) =>
          character.id === selectedCharacter.id
            ? { ...character, scenes: [newScene, ...(character.scenes || [])] }
            : character
        )
      );
    } catch (err) {
      setError(err?.message || "Could not generate scene.");
    } finally {
      setBusy("");
    }
  }

  async function generateStoryboardFromLines() {
    const lines = scene.description
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      setError("Write one or more story beats, one per line.");
      return;
    }

    for (const line of lines) {
      setScene((current) => ({ ...current, description: line }));
      await new Promise((resolve) => setTimeout(resolve, 50));
      await generateSceneImage();
    }
  }

  async function generateVideoFromScene(sceneItem) {
    if (!selectedCharacter || !sceneItem?.imageUrl) return;

    setBusy("Generating video clip from scene...");
    setError("");

    try {
      const data = await callGenerate({
        endpoint: VIDEO_ENDPOINT,
        model: "seedance",
        mode: "image-to-video",
        type: "video",
        image_url: sceneItem.imageUrl,
        prompt: buildVideoPrompt(selectedCharacter, {
          ...scene,
          description: sceneItem.description,
        }),
        aspect_ratio: scene.ratio,
        resolution: scene.videoResolution,
        duration: String(scene.videoDuration),
        seconds: scene.videoDuration,
      });

      const videoUrl = extractFirstUrl(data);

      if (!videoUrl) throw new Error("Video generated, but no video URL was returned.");

      const video = {
        id: uid(),
        sceneId: sceneItem.id,
        description: sceneItem.description,
        videoUrl,
        duration: scene.videoDuration,
        resolution: scene.videoResolution,
        ratio: scene.ratio,
        createdAt: new Date().toISOString(),
      };

      setCharacters((current) =>
        current.map((character) =>
          character.id === selectedCharacter.id
            ? { ...character, videos: [video, ...(character.videos || [])] }
            : character
        )
      );
    } catch (err) {
      setError(err?.message || "Could not generate video.");
    } finally {
      setBusy("");
    }
  }

  function deleteCharacter(id) {
    setCharacters((current) => current.filter((item) => item.id !== id));
    if (selectedId === id) {
      const next = characters.find((item) => item.id !== id);
      setSelectedId(next?.id || "");
    }
  }

  function exportProject() {
    const blob = new Blob([JSON.stringify(characters, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nova-character-story-project.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <section className="mx-auto max-w-[1600px]">
        <div className="rounded-[2rem] border border-[#D7FF00]/20 bg-[radial-gradient(circle_at_18%_18%,rgba(215,255,0,.16),transparent_32%),linear-gradient(135deg,#050505,#0d0d0d)] p-5 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-[#D7FF00]">
            NOVA Character & Story Studio
          </p>
          <h1 className="mt-4 max-w-5xl text-5xl font-black uppercase leading-[0.88] tracking-[-0.08em] md:text-7xl">
            Create consistent characters for images, scenes and videos.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/55 md:text-base">
            Build a character once, save a reference pack, generate story scenes with the same identity,
            then animate those scenes into video clips.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard/generate" className="rounded-2xl border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/55 no-underline hover:text-[#D7FF00]">
              Advanced generator →
            </Link>
            <button
              type="button"
              onClick={exportProject}
              className="rounded-2xl border border-[#D7FF00]/35 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#D7FF00]"
            >
              Export project JSON
            </button>
          </div>

          {busy && (
            <div className="mt-6 rounded-2xl border border-[#D7FF00]/30 bg-[#D7FF00]/10 p-4 text-sm font-bold text-[#D7FF00]">
              {busy}
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[430px_1fr]">
          <aside className="space-y-6">
            <section className="rounded-[1.7rem] border border-white/10 bg-[#080808] p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">
                Step 1
              </p>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.05em]">
                Create character
              </h2>

              <div className="mt-5 space-y-4">
                <Field label="Character name" value={form.name} onChange={(value) => updateForm("name", value)} placeholder="Luna, Max, Captain Arion..." />

                <label className="block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-white/40">
                    Visual style
                  </span>
                  <select
                    value={form.visualStyle}
                    onChange={(event) => updateForm("visualStyle", event.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/45 px-4 text-sm text-white outline-none focus:border-[#D7FF00]/55"
                  >
                    {visualStyles.map((style) => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-white/40">
                    Age range
                  </span>
                  <select
                    value={form.ageRange}
                    onChange={(event) => updateForm("ageRange", event.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/45 px-4 text-sm text-white outline-none focus:border-[#D7FF00]/55"
                  >
                    {ageRanges.map((age) => (
                      <option key={age} value={age}>{age}</option>
                    ))}
                  </select>
                </label>

                <Field label="Identity" value={form.identity} onChange={(value) => updateForm("identity", value)} placeholder="Brazilian creator, brave child explorer, futuristic detective..." textarea />
                <Field label="Face" value={form.face} onChange={(value) => updateForm("face", value)} placeholder="Face shape, eyes, skin, unique traits..." />
                <Field label="Hair" value={form.hair} onChange={(value) => updateForm("hair", value)} placeholder="Hair color, length, texture, style..." />
                <Field label="Outfit" value={form.outfit} onChange={(value) => updateForm("outfit", value)} placeholder="Main clothes that should stay consistent..." />
                <Field label="Accessories" value={form.accessories} onChange={(value) => updateForm("accessories", value)} placeholder="Glasses, necklace, hat, backpack..." />
                <Field label="Locked details" value={form.lockedDetails} onChange={(value) => updateForm("lockedDetails", value)} placeholder="Things that must never change..." textarea />

                <label className="block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-white/40">
                    Optional reference image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="block w-full rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-xs text-white/60 file:mr-4 file:rounded-xl file:border-0 file:bg-[#D7FF00] file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:text-black"
                  />
                </label>

                {form.referenceUrl && (
                  <img src={form.referenceUrl} alt="Reference" className="h-40 w-full rounded-2xl border border-white/10 object-contain bg-black" />
                )}

                <button
                  type="button"
                  onClick={createCharacter}
                  disabled={Boolean(busy)}
                  className="h-14 w-full rounded-2xl bg-[#D7FF00] text-xs font-black uppercase tracking-[0.16em] text-black disabled:opacity-40"
                >
                  Create consistent character
                </button>
              </div>
            </section>

            <section className="rounded-[1.7rem] border border-white/10 bg-[#080808] p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">
                Character Library
              </p>

              <div className="mt-4 space-y-3">
                {characters.length === 0 && (
                  <p className="text-sm leading-6 text-white/40">
                    No characters yet. Create one to start generating consistent stories.
                  </p>
                )}

                {characters.map((character) => (
                  <div
                    key={character.id}
                    className={[
                      "rounded-2xl border p-3 transition",
                      selectedId === character.id ? "border-[#D7FF00]/50 bg-[#D7FF00]/10" : "border-white/10 bg-black/35",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(character.id)}
                      className="flex w-full items-center gap-3 text-left"
                    >
                      {character.references?.[0]?.url && (
                        <img src={character.references[0].url} alt={character.name} className="h-14 w-14 rounded-xl object-cover" />
                      )}
                      <div>
                        <p className="font-black">{character.name}</p>
                        <p className="text-xs text-white/40">{character.visualStyle}</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteCharacter(character.id)}
                      className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-red-300/70"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <section className="space-y-6">
            {selectedCharacter ? (
              <>
                <section className="rounded-[1.7rem] border border-white/10 bg-[#080808] p-5 md:p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">
                        Active character
                      </p>
                      <h2 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em]">
                        {selectedCharacter.name}
                      </h2>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {selectedCharacter.references?.map((ref) => (
                      <div key={ref.id} className="rounded-2xl border border-white/10 bg-black p-2">
                        <img src={ref.url} alt={ref.label} className="aspect-square w-full rounded-xl object-cover" />
                        <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-white/45">{ref.label}</p>
                        <div className="mt-2 flex gap-2">
                          <a href={ref.url} target="_blank" rel="noreferrer" className="flex-1 rounded-xl border border-white/10 px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] text-white/50 no-underline">Open</a>
                          <a href={downloadHref(ref.url, `${selectedCharacter.name}-${ref.label}.png`)} className="flex-1 rounded-xl bg-[#D7FF00] px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] text-black no-underline">Download</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[1.7rem] border border-white/10 bg-[#080808] p-5 md:p-6">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">
                    Step 2
                  </p>
                  <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em]">
                    Generate consistent story scenes
                  </h2>

                  <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    <Field
                      label="Scene / story beat"
                      value={scene.description}
                      onChange={(value) => updateScene("description", value)}
                      placeholder={"One scene, or write multiple lines for storyboard mode.\nExample: Luna enters a neon market holding the magic compass."}
                      textarea
                    />
                    <div className="grid gap-4">
                      <Field label="Emotion" value={scene.emotion} onChange={(value) => updateScene("emotion", value)} placeholder="curious, scared, confident..." />
                      <Field label="Pose / action" value={scene.pose} onChange={(value) => updateScene("pose", value)} placeholder="walking, looking up, holding product..." />
                    </div>
                    <Field label="Camera" value={scene.camera} onChange={(value) => updateScene("camera", value)} placeholder="close-up, wide shot, over the shoulder..." />
                    <Field label="Environment" value={scene.environment} onChange={(value) => updateScene("environment", value)} placeholder="forest, bedroom, city street..." />
                  </div>

                  <div className="mt-5">
                    <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/40">
                      Format
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ratios.map((item) => (
                        <Button key={item} active={scene.ratio === item} onClick={() => updateScene("ratio", item)}>
                          {item}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={generateSceneImage}
                      disabled={Boolean(busy)}
                      className="h-14 flex-1 rounded-2xl bg-[#D7FF00] text-xs font-black uppercase tracking-[0.16em] text-black disabled:opacity-40"
                    >
                      Generate scene image
                    </button>
                    <button
                      type="button"
                      onClick={generateStoryboardFromLines}
                      disabled={Boolean(busy)}
                      className="h-14 flex-1 rounded-2xl border border-[#D7FF00]/40 text-xs font-black uppercase tracking-[0.16em] text-[#D7FF00] disabled:opacity-40"
                    >
                      Generate storyboard from lines
                    </button>
                  </div>
                </section>

                <section className="rounded-[1.7rem] border border-white/10 bg-[#080808] p-5 md:p-6">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">
                    Step 3
                  </p>
                  <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em]">
                    Turn scenes into video clips
                  </h2>

                  <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    <div>
                      <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/40">
                        Video duration
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {videoDurations.map((item) => (
                          <Button key={item} active={scene.videoDuration === item} onClick={() => updateScene("videoDuration", item)}>
                            {item}s
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/40">
                        Video resolution
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {videoResolutions.map((item) => (
                          <Button key={item} active={scene.videoResolution === item} onClick={() => updateScene("videoResolution", item)}>
                            {item}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Field
                    label="Video motion"
                    value={scene.videoMotion}
                    onChange={(value) => updateScene("videoMotion", value)}
                    placeholder="slow camera push-in, hair moving in wind, natural walk cycle..."
                    textarea
                  />

                  <p className="mt-4 text-xs leading-6 text-white/35">
                    Model: Seedance 2.0 image-to-video. It is designed to animate still images into cinematic video with motion prompts. :contentReference[oaicite:2]{index=2}
                  </p>
                </section>

                <section className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-[1.7rem] border border-white/10 bg-[#080808] p-5 md:p-6">
                    <h3 className="text-2xl font-black uppercase tracking-[-0.04em]">
                      Scene images
                    </h3>

                    <div className="mt-5 grid gap-4">
                      {selectedCharacter.scenes?.length === 0 && (
                        <p className="text-sm text-white/40">Generated scene images will appear here.</p>
                      )}

                      {selectedCharacter.scenes?.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-white/10 bg-black p-3">
                          <img src={item.imageUrl} alt={item.description} className="max-h-[520px] w-full rounded-xl object-contain bg-black" />
                          <p className="mt-3 text-sm leading-6 text-white/55">{item.description}</p>

                          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <a href={item.imageUrl} target="_blank" rel="noreferrer" className="flex-1 rounded-xl border border-white/10 px-3 py-3 text-center text-[10px] font-black uppercase tracking-[0.14em] text-white/50 no-underline">Open image</a>
                            <a href={downloadHref(item.imageUrl, `${selectedCharacter.name}-scene.png`)} className="flex-1 rounded-xl border border-white/10 px-3 py-3 text-center text-[10px] font-black uppercase tracking-[0.14em] text-white/50 no-underline">Download</a>
                            <button
                              type="button"
                              onClick={() => generateVideoFromScene(item)}
                              disabled={Boolean(busy)}
                              className="flex-1 rounded-xl bg-[#D7FF00] px-3 py-3 text-center text-[10px] font-black uppercase tracking-[0.14em] text-black disabled:opacity-40"
                            >
                              Generate video
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.7rem] border border-white/10 bg-[#080808] p-5 md:p-6">
                    <h3 className="text-2xl font-black uppercase tracking-[-0.04em]">
                      Video clips
                    </h3>

                    <div className="mt-5 grid gap-4">
                      {selectedCharacter.videos?.length === 0 && (
                        <p className="text-sm text-white/40">Generated video clips will appear here.</p>
                      )}

                      {selectedCharacter.videos?.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-white/10 bg-black p-3">
                          <video src={item.videoUrl} controls playsInline preload="metadata" className="aspect-video max-h-[520px] w-full rounded-xl object-contain bg-black" />
                          <p className="mt-3 text-sm leading-6 text-white/55">{item.description}</p>

                          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <a href={item.videoUrl} target="_blank" rel="noreferrer" className="flex-1 rounded-xl border border-white/10 px-3 py-3 text-center text-[10px] font-black uppercase tracking-[0.14em] text-white/50 no-underline">Open video</a>
                            <a href={downloadHref(item.videoUrl, `${selectedCharacter.name}-clip.mp4`)} className="flex-1 rounded-xl bg-[#D7FF00] px-3 py-3 text-center text-[10px] font-black uppercase tracking-[0.14em] text-black no-underline">Download</a>
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedCharacter.videos?.length > 1 && (
                      <div className="mt-5 rounded-2xl border border-[#D7FF00]/25 bg-[#D7FF00]/10 p-4 text-sm leading-6 text-white/65">
                        <span className="font-black text-[#D7FF00]">Long story workflow:</span>{" "}
                        generate the clips in order and download them. The next production step is adding an async merge job to combine all clips into one MP4.
                      </div>
                    )}
                  </div>
                </section>
              </>
            ) : (
              <section className="rounded-[1.7rem] border border-white/10 bg-[#080808] p-8 text-center">
                <h2 className="text-3xl font-black uppercase tracking-[-0.05em]">
                  Create your first character
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/45">
                  Once your character is created, NOVA will show the reference pack, scene generator and video generator here.
                </p>
              </section>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
