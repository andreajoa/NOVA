"""NOVA VIDEO private GPU worker for Modal.

Normal video uses Wan2.2-TI2V-5B (Apache-2.0) on an L4.
Speech video uses Wan2.2-S2V-14B (Apache-2.0) on an A100-80GB.

The HTTP endpoint only accepts work. GPU functions render in background, upload
MP4 files directly to NOVA R2, and call NOVA's authenticated callback.
"""

import hmac
import os
import subprocess
import tempfile
import time
from pathlib import Path

import modal

APP_NAME = "nova-video-engine"
WAN_CODE = Path("/opt/Wan2.2")
MODEL_ROOT = Path("/models")
TI2V_REPO = "Wan-AI/Wan2.2-TI2V-5B"
S2V_REPO = "Wan-AI/Wan2.2-S2V-14B"
TI2V_DIR = MODEL_ROOT / "Wan2.2-TI2V-5B"
S2V_DIR = MODEL_ROOT / "Wan2.2-S2V-14B"
TTS_PROMPT_TEXT = "希望你以后能够做的比我还好呦。"

NORMAL_PACKAGES = [
    "accelerate>=1.6,<2",
    "dashscope",
    "decord",
    "diffusers>=0.31,<1",
    "easydict",
    "einops>=0.8,<1",
    "fastapi[standard]",
    "ftfy",
    "huggingface-hub>=0.36,<1",
    "imageio[ffmpeg]>=2.37,<3",
    "imageio-ffmpeg>=0.5,<1",
    "kokoro>=0.9.2,<1",
    "numpy<2",
    "opencv-python-headless>=4.9",
    "pillow",
    "requests>=2.32,<3",
    "safetensors",
    "sentencepiece>=0.2,<1",
    "soundfile>=0.12,<1",
    "tokenizers",
    "torch>=2.7,<3",
    "torchaudio",
    "torchvision",
    "tqdm",
    "transformers>=4.49,<=4.51.3",
]

# Mirrors Wan2.2/requirements_s2v.txt so built-in CosyVoice TTS can self-install
# its repository/model the first time speech generation runs.
SPEECH_PACKAGES = [
    "GitPython",
    "HyperPyYAML",
    "conformer",
    "gdown",
    "hydra-core",
    "inflect",
    "librosa",
    "lightning",
    "matplotlib",
    "modelscope",
    "omegaconf",
    "onnxruntime",
    "openai-whisper",
    "pyarrow",
    "pyworld",
    "rich",
    "wetext",
    "wget",
]

base_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "git", "libgl1", "libglib2.0-0", "libsndfile1", "espeak-ng", "fonts-dejavu-core")
    .uv_pip_install(*NORMAL_PACKAGES)
    .run_commands("git clone --depth 1 https://github.com/Wan-Video/Wan2.2.git /opt/Wan2.2")
    .env(
        {
            "HF_HOME": str(MODEL_ROOT),
            "HF_XET_HIGH_PERFORMANCE": "1",
            "PYTHONPATH": str(WAN_CODE),
            "TOKENIZERS_PARALLELISM": "false",
        }
    )
    # Headline font for top/center on-screen text (Bebas Neue, SIL Open Font License).
    .run_commands(
        "mkdir -p /opt/fonts && python -c \"import urllib.request; urllib.request.urlretrieve("
        "'https://github.com/google/fonts/raw/main/ofl/bebasneue/BebasNeue-Regular.ttf', "
        "'/opt/fonts/BebasNeue-Regular.ttf')\""
    )
)

speech_image = base_image.uv_pip_install(*SPEECH_PACKAGES)

app = modal.App(APP_NAME)
model_volume = modal.Volume.from_name("nova-wan-model-cache", create_if_missing=True)
engine_secret = modal.Secret.from_name("nova-video-engine")


def _authorized(request_secret: str | None) -> bool:
    expected = os.environ.get("NOVA_VIDEO_WORKER_SECRET", "")
    return bool(expected) and hmac.compare_digest(str(request_secret or ""), expected)


def _speech_enabled() -> bool:
    return str(os.environ.get("NOVA_ENABLE_SPEECH", "0")).lower() in {"1", "true", "yes"}


def _frames(seconds: float) -> int:
    # Wan TI2V requires 4n+1 frames. Keep segment timing close to the requested
    # beat while allowing 2-10 second director segments.
    seconds = max(2.0, min(10.0, float(seconds)))
    frames = max(49, int(round(seconds * 24)))
    return (frames // 4) * 4 + 1


def _size(aspect: str) -> str:
    return "704*1280" if str(aspect) == "9:16" else "1280*704"


def _phase_timing(phase: str, start: float) -> None:
    elapsed = time.time() - start
    print(f"[NOVA_VIDEO PHASE] {phase} took {elapsed:.2f}s", flush=True)


def _ensure_model(repo_id: str, local_dir: Path) -> None:
    marker = local_dir / ".nova-ready"
    if marker.exists():
        return
    from huggingface_hub import snapshot_download

    local_dir.mkdir(parents=True, exist_ok=True)
    t0 = time.time()
    snapshot_download(repo_id=repo_id, local_dir=str(local_dir), local_dir_use_symlinks=False)
    _phase_timing("model_download", t0)
    marker.write_text(repo_id, encoding="utf-8")
    model_volume.commit()


def _download(url: str, destination: Path, max_bytes: int = 150_000_000) -> None:
    import requests

    if not str(url).startswith("https://"):
        raise ValueError("Only HTTPS media URLs are accepted")
    total = 0
    with requests.get(url, stream=True, timeout=60) as response:
        response.raise_for_status()
        with destination.open("wb") as handle:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if not chunk:
                    continue
                total += len(chunk)
                if total > max_bytes:
                    raise ValueError("Input media is too large")
                handle.write(chunk)


def _extract_last_frame(video_path: Path, frame_path: Path) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-sseof", "-0.12", "-i", str(video_path), "-frames:v", "1", str(frame_path)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def _crop_square(source: Path, destination: Path) -> None:
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(source),
            "-vf", "crop='min(iw,ih)':'min(iw,ih)'",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", str(destination),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def _concat(first: Path, second: Path, output: Path) -> None:
    manifest = output.with_suffix(".txt")
    manifest.write_text(f"file '{first.as_posix()}'\nfile '{second.as_posix()}'\n", encoding="utf-8")
    subprocess.run(
        [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(manifest),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", str(output),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )



def _concat_many(clips: list[Path], output: Path) -> None:
    if not clips:
        raise ValueError("No video clips to concatenate")
    if len(clips) == 1:
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(clips[0]), "-c", "copy", str(output)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return
    manifest = output.with_suffix(".txt")
    manifest.write_text(
        "".join(f"file '{clip.as_posix()}'\n" for clip in clips),
        encoding="utf-8",
    )
    subprocess.run(
        [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(manifest),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
            "-pix_fmt", "yuv420p", "-an", str(output),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


# ffmpeg xfade transitions the director may ask for. "cut" keeps a hard cut.
XFADE_TRANSITIONS = {
    "fade", "dissolve", "slideleft", "slideright", "wipeleft", "circleopen", "smoothleft",
}
XFADE_SECONDS = 0.45


def _caption_position(value) -> str:
    name = str(value or "").strip().lower()
    return name if name in {"top", "center", "bottom"} else "bottom"


def _transition_name(value) -> str:
    name = str(value or "").strip().lower()
    return name if name in XFADE_TRANSITIONS else "cut"


def _video_seconds(path: Path) -> float:
    probe = subprocess.run(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(probe.stdout.strip() or 0.0)


def _xfade_many(clips: list[Path], transitions: list[str], output: Path) -> None:
    """Join clips with the director's transitions.

    Every clip except the last must carry XFADE_SECONDS of extra footage when
    its transition is not a cut; the overlap is consumed by the transition so
    the joined video keeps the timeline's exact length.
    """
    if len(clips) < 2 or all(name == "cut" for name in transitions[:-1]):
        _concat_many(clips, output)
        return

    inputs = []
    for clip in clips:
        inputs.extend(["-i", str(clip)])
    filters = []
    previous = "[0:v]"
    elapsed = _video_seconds(clips[0])
    for index in range(1, len(clips)):
        name = transitions[index - 1]
        label = f"[v{index}]"
        # A cut is an xfade too short to see; this keeps one filter graph.
        duration = XFADE_SECONDS if name != "cut" else 0.04
        kind = name if name != "cut" else "fade"
        offset = max(0.0, elapsed - duration)
        filters.append(
            f"{previous}[{index}:v]xfade=transition={kind}:duration={duration:.3f}:offset={offset:.3f}{label}"
        )
        previous = label
        elapsed = offset + _video_seconds(clips[index])
    subprocess.run(
        [
            "ffmpeg", "-y", *inputs,
            "-filter_complex", ";".join(filters),
            "-map", previous, "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
            "-pix_fmt", "yuv420p", "-an", str(output),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def _trim_video(source: Path, output: Path, seconds: float) -> None:
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(source), "-t", f"{float(seconds):.3f}",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
            "-pix_fmt", "yuv420p", "-an", str(output),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def _motion_quality_metrics(video_path: Path) -> dict:
    """Measure whether a clip contains non-rigid scene motion, not just camera drift."""
    import cv2
    import numpy as np

    capture = cv2.VideoCapture(str(video_path))
    frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    if frame_count < 3:
        capture.release()
        return {"raw": 0.0, "residual": 0.0, "pairs": 0}

    sample_count = min(9, frame_count)
    indexes = sorted(set(
        int(round(i * (frame_count - 1) / max(1, sample_count - 1)))
        for i in range(sample_count)
    ))
    frames = []
    for index in indexes:
        capture.set(cv2.CAP_PROP_POS_FRAMES, index)
        ok, frame = capture.read()
        if not ok or frame is None:
            continue
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        height, width = gray.shape[:2]
        scale = min(1.0, 384.0 / max(width, 1))
        if scale < 1.0:
            gray = cv2.resize(
                gray,
                (max(32, int(width * scale)), max(32, int(height * scale))),
                interpolation=cv2.INTER_AREA,
            )
        frames.append(gray)
    capture.release()

    raw_scores = []
    residual_scores = []
    for previous, current in zip(frames, frames[1:]):
        if previous.shape != current.shape:
            continue

        raw = float(np.mean(cv2.absdiff(previous, current)))
        raw_scores.append(raw)

        points = cv2.goodFeaturesToTrack(
            previous,
            maxCorners=180,
            qualityLevel=0.01,
            minDistance=6,
            blockSize=5,
        )
        if points is None or len(points) < 8:
            residual_scores.append(raw)
            continue

        tracked, status, _ = cv2.calcOpticalFlowPyrLK(
            previous,
            current,
            points,
            None,
            winSize=(21, 21),
            maxLevel=3,
        )
        if tracked is None or status is None:
            residual_scores.append(raw)
            continue

        valid = status.reshape(-1) == 1
        source = points.reshape(-1, 2)[valid]
        destination = tracked.reshape(-1, 2)[valid]
        if len(source) < 8:
            residual_scores.append(raw)
            continue

        matrix, _ = cv2.estimateAffinePartial2D(
            source,
            destination,
            method=cv2.RANSAC,
            ransacReprojThreshold=2.5,
        )
        if matrix is None:
            residual_scores.append(raw)
            continue

        aligned = cv2.warpAffine(
            previous,
            matrix,
            (current.shape[1], current.shape[0]),
            flags=cv2.INTER_LINEAR,
            borderMode=cv2.BORDER_REFLECT,
        )
        residual_scores.append(float(np.mean(cv2.absdiff(aligned, current))))

    if not raw_scores:
        return {"raw": 0.0, "residual": 0.0, "pairs": 0}

    raw_median = float(np.median(np.asarray(raw_scores, dtype=np.float32)))
    residual_median = float(np.median(np.asarray(residual_scores or raw_scores, dtype=np.float32)))
    return {
        "raw": round(raw_median, 4),
        "residual": round(residual_median, 4),
        "pairs": len(raw_scores),
    }


def _motion_quality_ok(video_path: Path) -> tuple[bool, dict]:
    metrics = _motion_quality_metrics(video_path)
    raw = float(metrics.get("raw") or 0.0)
    residual = float(metrics.get("residual") or 0.0)

    # Be intentionally conservative: only reject clips that look like a still
    # frame / Ken Burns camera move. Natural subtle acting should clear this.
    nearly_frozen = raw < 1.15 and residual < 0.55
    camera_only = raw < 6.0 and residual < 0.48 and residual < (raw * 0.12)
    return (not (nearly_frozen or camera_only)), metrics


def _director_timeline(payload: dict) -> list[dict]:
    raw = payload.get("director_timeline")
    if not isinstance(raw, list):
        return []
    timeline = []
    for item in raw[:6]:
        if not isinstance(item, dict):
            continue
        try:
            start = float(item.get("start"))
            end = float(item.get("end"))
        except (TypeError, ValueError):
            continue
        if end <= start:
            continue
        timeline.append(
            {
                "start": max(0.0, start),
                "end": max(0.0, end),
                "visual": str(item.get("visual") or "").strip(),
                "camera": str(item.get("camera") or "").strip(),
                "narration": str(item.get("narration") or "").strip(),
                "caption": str(item.get("caption") or "").strip(),
                "audio": str(item.get("audio") or "").strip(),
                "transition": _transition_name(item.get("transition")),
                "caption_position": _caption_position(item.get("captionPosition") or item.get("caption_position")),
            }
        )
    return timeline


def _segment_prompt(payload: dict, beat: dict, index: int, total: int) -> str:
    style = str(payload.get("director_visual_style") or "").strip()
    ending = str(payload.get("director_ending") or "").strip()
    visual = str(beat.get("visual") or "").strip()
    camera = str(beat.get("camera") or "").strip()

    lines = [
        f"Shot {index + 1} of {total}.",
        "Live-action cinematic footage with genuine physical movement.",
        "Keep the same person's identity, face, hair, wardrobe and environment stable.",
        "Natural realistic anatomy, hands and fingers. No morphing, no melting, no duplicated features.",
        "Do not make a still photograph with digital zoom. The subject must move, blink, breathe and react naturally.",
    ]
    if visual:
        lines.append("ACTION: " + visual)
    if camera:
        lines.append("CAMERA: " + camera)
    if style:
        lines.append("STYLE: " + style)
    if index == total - 1 and ending:
        lines.append("ENDING CAMERA ACTION: " + ending)
    lines.append("No subtitles, captions or lower-third text overlays.")
    return "\n".join(lines)


def _render_director_sequence(
    payload: dict,
    tmp: Path,
    aspect: str,
    steps: int,
    seed: int,
    initial_reference: Path | None = None,
) -> Path | None:
    timeline = _director_timeline(payload)
    if len(timeline) < 2:
        return None

    clips: list[Path] = []
    reference = initial_reference
    for index, beat in enumerate(timeline):
        exact_seconds = max(0.35, float(beat["end"]) - float(beat["start"]))
        # Shots followed by a transition keep extra footage for the overlap.
        if index < len(timeline) - 1 and beat.get("transition", "cut") != "cut":
            exact_seconds += XFADE_SECONDS
        render_seconds = max(2.0, min(10.0, exact_seconds))
        prompt = _segment_prompt(payload, beat, index, len(timeline))

        accepted: Path | None = None
        last_metrics = {}
        for attempt in range(2):
            raw_clip = tmp / f"director-{index:02d}-raw-{attempt}.mp4"
            exact_clip = tmp / f"director-{index:02d}-exact-{attempt}.mp4"
            attempt_prompt = prompt
            if attempt:
                attempt_prompt += (
                    "\nQUALITY RETRY: show unmistakable non-rigid human movement inside the frame. "
                    "Hands, eyes, facial muscles and posture must visibly change over time. "
                    "Do not solve motion with only a camera zoom, pan or parallax."
                )

            _run_normal_segment(
                prompt=attempt_prompt,
                aspect=aspect,
                frames=_frames(render_seconds),
                steps=steps,
                seed=seed + index + (attempt * 1009),
                output=raw_clip,
                reference=reference,
            )

            # Wan uses 4n+1 frame counts, so normalize every rendered shot back
            # to the exact TIMED BEAT duration before concatenation.
            _trim_video(raw_clip, exact_clip, exact_seconds)
            motion_ok, last_metrics = _motion_quality_ok(exact_clip)
            print(
                f"[NOVA_VIDEO QUALITY] beat={index} attempt={attempt + 1} "
                f"raw={last_metrics.get('raw')} residual={last_metrics.get('residual')} "
                f"accepted={motion_ok}",
                flush=True,
            )
            if motion_ok:
                accepted = exact_clip
                break

        if accepted is None:
            raise RuntimeError(
                "NOVA_LOW_MOTION_QUALITY: "
                f"beat={index} raw={last_metrics.get('raw')} residual={last_metrics.get('residual')}"
            )

        clips.append(accepted)
        if index < len(timeline) - 1:
            reference = tmp / f"director-{index:02d}-last.png"
            _extract_last_frame(accepted, reference)

    combined = tmp / "director-combined.mp4"
    _xfade_many(clips, [beat.get("transition", "cut") for beat in timeline], combined)
    total_seconds = max(float(item["end"]) for item in timeline)
    trimmed = tmp / "director-trimmed.mp4"
    _trim_video(combined, trimmed, total_seconds)
    return trimmed


def _looks_portuguese(text: str) -> bool:
    value = f" {str(text or '').lower()} "
    clues = [
        " até ", " não ", " mãos ", " quando ", " dela ", " dele ",
        " apareceu ", " lista ", " dia ", " nome ", " brasileira", " brasileiro",
        " portugu", "pt-br",
    ]
    return any(clue in value for clue in clues)


# Kokoro voices for languages the LLM director can report besides pt/en.
KOKORO_LANGUAGES = {
    "es": ("e", "ef_dora", "em_alex"),
    "fr": ("f", "ff_siwis", "ff_siwis"),
    "it": ("i", "if_sara", "im_nicola"),
}


def _tts_config(payload: dict, narration_text: str) -> tuple[str, str, float]:
    direction = str(payload.get("director_voiceover") or "")
    combined = f"{direction} {narration_text}".lower()
    language = str(payload.get("director_language") or "").lower()
    portuguese = language.startswith("pt") or (not language and _looks_portuguese(combined))
    female = "female" in combined or "femin" in combined or "woman" in combined or "mulher" in combined
    male = "male" in combined or "mascul" in combined or "man " in combined or "homem" in combined

    other = KOKORO_LANGUAGES.get(language[:2])
    if other and not portuguese:
        lang, female_voice, male_voice = other
        return lang, (male_voice if male and not female else female_voice), 1.0

    if portuguese:
        voice = "pm_alex" if male and not female else "pf_dora"
        lang = "p"
    else:
        voice = "am_adam" if male and not female else "af_heart"
        lang = "a"

    speed = 0.96 if any(word in combined for word in ["warm", "emotional", "documentary", "calm", "natural"]) else 1.0
    return lang, voice, speed


def _synthesize_kokoro(text: str, output: Path, lang: str, voice: str, speed: float) -> None:
    import numpy as np
    import soundfile as sf
    from kokoro import KPipeline

    pipeline = KPipeline(lang_code=lang)
    chunks = []
    for _, _, audio in pipeline(text, voice=voice, speed=speed):
        chunks.append(np.asarray(audio, dtype=np.float32))
    if not chunks:
        raise RuntimeError("Kokoro returned no audio")
    data = np.concatenate(chunks)
    sf.write(str(output), data, 24000)

    marker = MODEL_ROOT / ".nova-kokoro-ready"
    if not marker.exists():
        marker.write_text("hexgrad/Kokoro-82M", encoding="utf-8")
        try:
            model_volume.commit()
        except Exception:
            pass


# Narration may be sped up this much at most; beyond it voices sound unnatural.
MAX_NARRATION_SPEEDUP = 1.2


def _audio_seconds(path: Path) -> float:
    import soundfile as sf

    return float(sf.info(str(path)).duration or 0.0)


def _place_narration(durations: list[float], starts: list[float], total: float) -> tuple[list[float], float]:
    """Return (start times, tempo) that keep every line intact and in order.

    Lines start at their shot when possible, otherwise right after the previous
    line. When the lines cannot fit inside the video even back-to-back, one
    global tempo up to MAX_NARRATION_SPEEDUP is applied instead of squeezing
    each line into its own window (which produced chipmunk voices).
    """
    gap = 0.15
    usable = max(0.5, total - 0.2)
    spoken = sum(durations) + gap * max(0, len(durations) - 1)
    tempo = min(MAX_NARRATION_SPEEDUP, max(1.0, spoken / usable))
    scaled = [value / tempo for value in durations]

    placed = []
    cursor = 0.0
    for start, length in zip(starts, scaled):
        begin = max(start, cursor)
        placed.append(begin)
        cursor = begin + length + gap
    overflow = (placed[-1] + scaled[-1]) - usable if placed else 0.0
    if overflow > 0:
        # Pull everything earlier, never before 0.
        placed = [max(0.0, value - overflow) for value in placed]
        for index in range(1, len(placed)):
            placed[index] = max(placed[index], placed[index - 1] + scaled[index - 1] + gap * 0.5)
    return placed, tempo


def _music_track(payload: dict, tmp: Path, total_seconds: float) -> Path | None:
    """Pick a licensed track for the director's mood from NOVA's music library.

    NOVA_MUSIC_LIBRARY_URL points to a JSON manifest {"moods": {"calm": [url, ...]}}.
    Without a library the video simply has no music bed.
    """
    import json

    import requests

    mood = str(payload.get("director_music") or "").strip().lower()
    if not mood:
        audio_hints = " ".join(str(item.get("audio") or "") for item in _director_timeline(payload)).lower()
        mood = "calm" if "piano" in audio_hints else ""
    library_url = str(os.environ.get("NOVA_MUSIC_LIBRARY_URL") or "")
    if not mood or mood == "none" or not library_url.startswith("https://"):
        return None
    try:
        manifest = requests.get(library_url, timeout=20).json()
        moods = manifest.get("moods") or {}
        tracks = [url for url in (moods.get(mood) or moods.get("cinematic") or []) if str(url).startswith("https://")]
        if not tracks:
            return None
        seed = int(payload.get("seed") or 0) or int(time.time())
        source = tmp / "music-source"
        _download(tracks[seed % len(tracks)], source, 25_000_000)
        bed = tmp / "music-bed.wav"
        fade_out = max(0.0, float(total_seconds) - 0.9)
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", str(source),
                "-af", f"atrim=duration={float(total_seconds):.3f},afade=t=in:d=0.6,afade=t=out:st={fade_out:.3f}:d=0.9",
                "-ar", "48000", "-ac", "2", str(bed),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return bed
    except Exception as error:
        print(f"[NOVA_VIDEO] music library unavailable: {str(error)[:200]}", flush=True)
        return None


def _build_director_audio(
    payload: dict,
    tmp: Path,
    total_seconds: float,
    base_audio: Path | None = None,
    include_narration: bool = True,
) -> Path | None:
    """Mix narration, music and an optional base track (the engine's own audio).

    Returns None when there is nothing to add to what the video already has.
    """
    timeline = _director_timeline(payload)
    narration_items = [item for item in timeline if item.get("narration")] if include_narration else []
    music = _music_track(payload, tmp, total_seconds)
    if not narration_items and music is None:
        return None

    total = float(total_seconds)
    inputs = []
    filters = []
    voice_label = None

    if narration_items:
        narration_text = " ".join(str(item.get("narration") or "") for item in narration_items)
        lang, voice, speed = _tts_config(payload, narration_text)
        raws = []
        for index, item in enumerate(narration_items):
            raw = tmp / f"voice-{index:02d}-raw.wav"
            _synthesize_kokoro(str(item["narration"]), raw, lang, voice, speed)
            raws.append(raw)
        durations = [_audio_seconds(raw) for raw in raws]
        starts, tempo = _place_narration(durations, [float(item["start"]) for item in narration_items], total)
        labels = []
        for index, (raw, begin) in enumerate(zip(raws, starts)):
            inputs.extend(["-i", str(raw)])
            delay_ms = max(0, int(round(begin * 1000)))
            chain = f"[{index}:a]aresample=48000,aformat=channel_layouts=stereo"
            if tempo > 1.001:
                chain += f",atempo={tempo:.4f}"
            filters.append(f"{chain},adelay={delay_ms}|{delay_ms}[n{index}]")
            labels.append(f"[n{index}]")
        filters.append(
            "".join(labels) +
            f"amix=inputs={len(labels)}:normalize=0:duration=longest,apad,atrim=duration={total:.3f}[voice]"
        )
        voice_label = "[voice]"

    # The engine's own audio (e.g. on-camera speech or ambience) is treated as
    # the foreground when there is no dubbed narration.
    if base_audio is not None:
        base_index = len(inputs) // 2
        inputs.extend(["-i", str(base_audio)])
        filters.append(
            f"[{base_index}:a]aresample=48000,aformat=channel_layouts=stereo,apad,atrim=duration={total:.3f}[base]"
        )
        if voice_label:
            filters.append("[base]volume=0.55[basebed]")
            filters.append(f"{voice_label}[basebed]amix=inputs=2:normalize=0:duration=first[fore]")
        else:
            filters.append("[base]anull[fore]")
        voice_label = "[fore]"

    if music is not None:
        music_index = len(inputs) // 2
        inputs.extend(["-i", str(music)])
        filters.append(f"[{music_index}:a]volume=0.55,apad,atrim=duration={total:.3f}[music]")
        if voice_label:
            # Duck the music under the foreground so speech stays intelligible.
            filters.append(f"{voice_label}asplit=2[voicemix][voicekey]")
            filters.append("[music][voicekey]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=350[ducked]")
            filters.append("[ducked][voicemix]amix=inputs=2:normalize=0:duration=first[premaster]")
        else:
            filters.append("[music]anull[premaster]")
    else:
        filters.append(f"{voice_label}anull[premaster]")

    filters.append(f"[premaster]loudnorm=I=-15:TP=-1.5:LRA=11,atrim=duration={total:.3f}[aout]")
    mixed = tmp / "director-audio.wav"
    subprocess.run(
        [
            "ffmpeg", "-y", *inputs,
            "-filter_complex", ";".join(filters),
            "-map", "[aout]", "-ar", "48000", "-ac", "2", str(mixed),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return mixed


HEADLINE_FONT = Path("/opt/fonts/BebasNeue-Regular.ttf")


def _wrapped_caption(text: str, width: int) -> str:
    import textwrap

    words = " ".join(str(text or "").split())
    return "\n".join(textwrap.wrap(words, width=max(12, width), break_long_words=False))


def _overlay_director_captions(source: Path, payload: dict, output: Path, aspect: str) -> bool:
    timeline = [item for item in _director_timeline(payload) if item.get("caption")]
    if not timeline:
        return False

    filters = []
    for index, item in enumerate(timeline):
        start = float(item["start"])
        end = float(item["end"])
        fade = min(0.3, max(0.05, (end - start) / 4))
        position = item.get("caption_position", "bottom")
        headline = position in {"top", "center"} and HEADLINE_FONT.exists()
        fontfile = str(HEADLINE_FONT) if headline else "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        fontsize = (72 if aspect == "9:16" else 64) if headline else (46 if aspect == "9:16" else 40)
        margin = 150 if aspect == "9:16" else 80
        # Bebas is condensed, so headlines fit more characters per line.
        width = (22 if aspect == "9:16" else 40) if headline else (28 if aspect == "9:16" else 44)
        lines = _wrapped_caption(str(item["caption"]), width).split("\n")
        line_height = int(fontsize * (1.08 if headline else 1.35))
        block = line_height * len(lines)
        # Alpha ramps in and out so text never pops on or off between shots.
        alpha = (
            f"if(lt(t,{start:.3f}),0,if(lt(t,{start + fade:.3f}),(t-{start:.3f})/{fade:.3f},"
            f"if(lt(t,{end - fade:.3f}),1,if(lt(t,{end:.3f}),({end:.3f}-t)/{fade:.3f},0))))"
        )
        # One drawtext per line so every line is centered (ffmpeg 5.1 has no
        # text_align for multi-line text).
        for row, line in enumerate(lines):
            caption_file = output.with_name(f"caption-{index:02d}-{row:02d}.txt")
            caption_file.write_text(line, encoding="utf-8")
            if position == "top":
                y_expr = f"{int(margin * 0.9) + row * line_height}"
            elif position == "center":
                y_expr = f"(h-{block})/2+{row * line_height}"
            else:
                y_expr = f"h-{margin}-{block - row * line_height}"
            filters.append(
                "drawtext="
                f"fontfile={fontfile}:"
                f"textfile='{caption_file.as_posix()}':"
                "fontcolor=white:"
                f"fontsize={fontsize}:"
                "borderw=3:bordercolor=black@0.85:"
                "shadowx=2:shadowy=3:shadowcolor=black@0.6:"
                f"box={0 if headline else 1}:boxcolor=black@0.28:boxborderw=14:"
                "x=(w-text_w)/2:"
                f"y={y_expr}:"
                f"alpha='{alpha}':"
                f"enable='between(t,{start:.3f},{end:.3f})'"
            )

    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(source),
            "-vf", ",".join(filters),
            "-map", "0:v:0", "-map", "0:a?",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
            "-pix_fmt", "yuv420p", "-c:a", "copy", str(output),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return True


def _mux_director_audio(video: Path, audio: Path, output: Path, seconds: float) -> None:
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(video), "-i", str(audio),
            "-t", f"{float(seconds):.3f}",
            "-map", "0:v:0", "-map", "1:a:0",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
            "-movflags", "+faststart", str(output),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def _has_audio(path: Path) -> bool:
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", str(path)],
        capture_output=True,
        text=True,
    )
    return bool(probe.stdout.strip())


def _apply_ending(source: Path, payload: dict, output: Path) -> bool:
    if str(payload.get("director_ending") or "") != "fade_to_black":
        return False
    seconds = _video_seconds(source)
    fade = min(0.6, max(0.25, seconds * 0.05))
    start = max(0.0, seconds - fade)
    command = [
        "ffmpeg", "-y", "-i", str(source),
        "-vf", f"fade=t=out:st={start:.3f}:d={fade:.3f}",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    ]
    if _has_audio(source):
        command += ["-af", f"afade=t=out:st={start:.3f}:d={fade:.3f}", "-c:a", "aac", "-b:a", "192k"]
    subprocess.run(command + ["-movflags", "+faststart", str(output)], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return True


def _finish_video(result: Path, payload: dict, tmp: Path, aspect: str, total_seconds: float,
                  include_narration: bool = True) -> Path:
    """Deterministic post-production shared by every engine.

    On-screen text, narration dub, music and the ending are applied here so the
    diffusion models only have to solve picture (and, for joint engines, speech).
    """
    if not _director_timeline(payload):
        return result
    captioned = tmp / "finish-captioned.mp4"
    if _overlay_director_captions(result, payload, captioned, aspect):
        result = captioned

    base_audio = None
    if _has_audio(result):
        base_audio = tmp / "finish-base.wav"
        subprocess.run(["ffmpeg", "-y", "-i", str(result), "-vn", "-ac", "2", "-ar", "48000", str(base_audio)],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    audio = _build_director_audio(payload, tmp, total_seconds, base_audio=base_audio,
                                  include_narration=include_narration)
    if audio is not None:
        mixed = tmp / "finish-with-audio.mp4"
        _mux_director_audio(result, audio, mixed, total_seconds)
        result = mixed

    ended = tmp / "finish-ending.mp4"
    if _apply_ending(result, payload, ended):
        result = ended
    return result


def _upload(payload: dict, output_path: Path) -> str:
    import requests

    target = payload.get("nova_output") or {}
    upload_url = str(target.get("upload_url") or "")
    public_url = str(target.get("public_url") or "")
    if not upload_url.startswith("https://") or not public_url.startswith("https://"):
        raise ValueError("NOVA output target is required")
    t0 = time.time()
    with output_path.open("rb") as handle:
        response = requests.put(upload_url, data=handle, headers={"Content-Type": "video/mp4"}, timeout=240)
    response.raise_for_status()
    _phase_timing("upload_result", t0)
    return public_url


def _notify(payload: dict, status: str, error_code: str | None = None) -> None:
    import requests

    callback = payload.get("nova_callback") or {}
    url = str(callback.get("url") or "")
    token = str(callback.get("token") or "")
    if not token or not url.startswith(("https://", "http://localhost")):
        return
    for attempt in range(3):
        try:
            response = requests.post(
                url,
                headers={"Authorization": f"Bearer {token}"},
                json={"status": status, "error_code": error_code},
                timeout=15,
            )
            if 200 <= response.status_code < 300:
                return
        except Exception:
            pass
        time.sleep(1 + attempt)


def _prepare_normal_wan_runtime() -> None:
    """Make the normal Wan TI2V runtime self-contained on Modal GPUs."""
    init_file = WAN_CODE / "wan" / "__init__.py"
    source = init_file.read_text(encoding="utf-8")
    optional_imports = [
        ("from .speech2video import WanS2V", "WanS2V"),
        ("from .animate import WanAnimate", "WanAnimate"),
    ]
    for needle, symbol in optional_imports:
        replacement = f"try:\n    {needle}\nexcept ImportError:\n    {symbol} = None"
        if needle in source:
            source = source.replace(needle, replacement, 1)
    init_file.write_text(source, encoding="utf-8")

    # Wan's model.py calls flash_attention() directly. The base image does not
    # ship the compiled flash-attn extension, so that path asserts before the
    # first denoising step. Use Wan's own PyTorch SDPA fallback instead.
    model_file = WAN_CODE / "wan" / "modules" / "model.py"
    model_source = model_file.read_text(encoding="utf-8")
    model_source = model_source.replace(
        "from .attention import flash_attention",
        "from .attention import attention as flash_attention",
        1,
    )
    model_file.write_text(model_source, encoding="utf-8")


def _run_normal_segment(
    *,
    prompt: str,
    aspect: str,
    frames: int,
    steps: int,
    seed: int,
    output: Path,
    reference: Path | None = None,
) -> None:
    """Render one Wan TI2V clip using the verified SDPA runtime."""
    t0 = time.time()
    command = [
        "python", str(WAN_CODE / "generate.py"),
        "--task", "ti2v-5B",
        "--size", _size(aspect),
        "--ckpt_dir", str(TI2V_DIR),
        "--offload_model", "True",
        "--convert_model_dtype",
        "--t5_cpu",
        "--prompt", prompt,
        "--frame_num", str(frames),
        "--sample_steps", str(steps),
        "--base_seed", str(seed),
        "--save_file", str(output),
    ]
    if reference is not None:
        command.extend(["--image", str(reference)])
    try:
        subprocess.run(command, cwd=str(WAN_CODE), check=True, timeout=14 * 60)
    finally:
        _phase_timing(f"render_ti2v_{aspect}_frames{frames}_steps{steps}", t0)


def _normal_generate(payload: dict) -> str:
    _prepare_normal_wan_runtime()
    t0 = time.time()
    _ensure_model(TI2V_REPO, TI2V_DIR)
    _phase_timing("runtime_prep", t0)
    prompt = str(payload.get("prompt") or "").strip()
    task = str(payload.get("task") or "text-to-video")
    if not prompt:
        raise ValueError("Prompt is required")
    if task not in {"text-to-video", "image-to-video", "continue-video"}:
        raise ValueError("Unsupported normal video task")

    duration = max(5, min(10, int(payload.get("duration") or 5)))
    aspect = str(payload.get("aspect_ratio") or "16:9")
    steps = max(8, min(24, int(os.environ.get("NOVA_WAN_SAMPLE_STEPS", "14"))))
    seed = int(payload.get("seed") or int(time.time() * 1000) % 2_147_483_647)

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            segment = tmp / "segment.mp4"
            reference: Path | None = None
            source_video: Path | None = None

            if task == "image-to-video":
                reference = tmp / "reference.jpg"
                _download(str(payload.get("image_url") or ""), reference, 20_000_000)
            elif task == "continue-video":
                source_video = tmp / "source.mp4"
                reference = tmp / "last-frame.png"
                _download(str(payload.get("source_video_url") or ""), source_video)
                _extract_last_frame(source_video, reference)

            directed = None
            if task in {"text-to-video", "image-to-video"}:
                directed = _render_director_sequence(
                    payload=payload,
                    tmp=tmp,
                    aspect=aspect,
                    steps=steps,
                    seed=seed,
                    initial_reference=reference,
                )

            if directed is None:
                _run_normal_segment(
                    prompt=prompt,
                    aspect=aspect,
                    frames=_frames(duration),
                    steps=steps,
                    seed=seed,
                    output=segment,
                    reference=reference,
                )
                result = segment
            else:
                result = directed

            if aspect == "1:1":
                square = tmp / "square.mp4"
                _crop_square(result, square)
                result = square

            if source_video is not None:
                combined = tmp / "combined.mp4"
                _concat(source_video, result, combined)
                result = combined

            # Captions and narration are deterministic post-production. This
            # keeps typography exact and lets Wan spend its capacity on motion,
            # anatomy, camera and continuity.
            if source_video is None and _director_timeline(payload):
                timeline = _director_timeline(payload)
                total_seconds = max(
                    float(duration),
                    max((float(item["end"]) for item in timeline), default=float(duration)),
                )
                result = _finish_video(result, payload, tmp, aspect, total_seconds)

            return _upload(payload, result)
    except Exception:
        # The Modal class wrapper notifies NOVA (or hands off to the next engine).
        raise

def _speech_generate(payload: dict) -> str:
    if not _speech_enabled():
        raise RuntimeError("Speech video is disabled")
    t0 = time.time()
    _ensure_model(S2V_REPO, S2V_DIR)
    _phase_timing("speech_runtime_prep", t0)

    prompt = str(payload.get("prompt") or "").strip()
    speech_text = str(payload.get("speech_text") or "").strip()
    image_url = str(payload.get("image_url") or "")
    if not prompt or not speech_text or not image_url.startswith("https://"):
        raise ValueError("Speech video requires prompt, speech_text and reference image")

    aspect = str(payload.get("aspect_ratio") or "16:9")
    duration = max(5, min(10, int(payload.get("duration") or 5)))
    clips = 1 if duration <= 5 else 2
    steps = max(4, min(40, int(os.environ.get("NOVA_WAN_SPEECH_STEPS", "20"))))
    seed = int(payload.get("seed") or int(time.time() * 1000) % 2_147_483_647)

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            reference = tmp / "reference.jpg"
            output = tmp / "speech.mp4"
            _download(image_url, reference, 20_000_000)
            _phase_timing("speech_download_reference", time.time())

            command = [
                "python", str(WAN_CODE / "generate.py"),
                "--task", "s2v-14B",
                "--size", "704*1024" if aspect == "9:16" else "1024*704",
                "--ckpt_dir", str(S2V_DIR),
                "--offload_model", "True",
                "--convert_model_dtype",
                "--t5_cpu",
                "--prompt", prompt,
                "--image", str(reference),
                "--enable_tts",
                "--tts_prompt_audio", str(WAN_CODE / "examples" / "zero_shot_prompt.wav"),
                "--tts_prompt_text", TTS_PROMPT_TEXT,
                "--tts_text", speech_text[:500],
                "--num_clip", str(clips),
                "--sample_steps", str(steps),
                "--base_seed", str(seed),
                "--save_file", str(output),
            ]
            try:
                subprocess.run(command, cwd=str(WAN_CODE), check=True, timeout=15 * 60)
            finally:
                _phase_timing(f"speech_render_clips{clips}_steps{steps}", time.time())

            result = output
            if aspect == "1:1":
                square = tmp / "speech-square.mp4"
                _crop_square(result, square)
                result = square
            return _upload(payload, result)
    except Exception:
        raise


@app.function(
    image=base_image,
    gpu="H100",
    cpu=4.0,
    memory=65536,
    volumes={str(MODEL_ROOT): model_volume},
    timeout=12 * 60,
)
def smoke_complex_director():
    """Render a short real multi-shot sample including pt-BR TTS and captions."""
    _prepare_normal_wan_runtime()
    _ensure_model(TI2V_REPO, TI2V_DIR)
    payload = {
        "prompt": "Brazilian documentary reconstruction, natural live-action motion.",
        "duration": 4,
        "aspect_ratio": "16:9",
        "director_visual_style": "handheld documentary camera, realistic skin, soft window light",
        "director_voiceover": "real Brazilian female documentary narrator, warm and natural",
        "director_timeline": [
            {
                "start": 0,
                "end": 2,
                "visual": "close-up of a woman's trembling hands holding a smartphone, natural finger motion",
                "camera": "subtle handheld close-up",
                "narration": "Até hoje, ela lembra daquele momento.",
                "caption": "ATÉ HOJE, ELA LEMBRA DAQUELE MOMENTO",
                "audio": "",
            },
            {
                "start": 2,
                "end": 4,
                "visual": "camera moves to her emotional face as she starts to smile through tears",
                "camera": "gentle push-in then slight pull-back",
                "narration": "O nome dela apareceu na lista.",
                "caption": "O NOME DELA APARECEU NA LISTA",
                "audio": "",
            },
        ],
    }
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        visual = _render_director_sequence(
            payload=payload,
            tmp=tmp,
            aspect="16:9",
            steps=8,
            seed=20260920,
        )
        if visual is None or not visual.exists():
            raise RuntimeError("Director smoke did not render a visual sequence")
        captioned = tmp / "captioned.mp4"
        if not _overlay_director_captions(visual, payload, captioned, "16:9"):
            raise RuntimeError("Director smoke did not render captions")
        audio = _build_director_audio(payload, tmp, 4.0)
        if audio is None or not audio.exists():
            raise RuntimeError("Director smoke did not synthesize narration")
        final = tmp / "final.mp4"
        _mux_director_audio(captioned, audio, final, 4.0)
        if not final.exists() or final.stat().st_size < 50_000:
            raise RuntimeError("Director smoke final MP4 is invalid")
        return {
            "ok": True,
            "bytes": final.stat().st_size,
            "timeline_beats": 2,
            "captions": True,
            "pt_br_tts": True,
        }


@app.function(image=base_image, gpu="L4", timeout=120, memory=8192)
def smoke_import():
    """Fail early if the normal Wan runtime has missing imports."""
    _prepare_normal_wan_runtime()
    import wan  # noqa: F401
    from einops import rearrange  # noqa: F401
    assert wan.WanTI2V is not None
    return {"ok": True, "wan": True, "einops": True, "ti2v": True}


@app.function(image=base_image, volumes={str(MODEL_ROOT): model_volume}, timeout=45 * 60, memory=65536)
def preload_models(include_speech: bool = False):
    """Download checkpoints on CPU so no GPU minutes are burned by downloads."""
    _ensure_model(TI2V_REPO, TI2V_DIR)
    if include_speech:
        _ensure_model(S2V_REPO, S2V_DIR)
    return {"normal": TI2V_DIR.exists(), "speech": S2V_DIR.exists()}


# ---------------------------------------------------------------------------
# Engine chain. LLM-planned jobs carry payload["engine_order"], e.g.
# ["ltx", "wan"] or ["wan-speech", "ltx-speech"]. Each engine that fails hands
# the same job to the next one; NOVA is only told "failed" at the end.
# ---------------------------------------------------------------------------
ENGINES = ("ltx", "ltx-speech", "wan", "wan-speech")
LTX_SPACE = os.environ.get("NOVA_LTX_SPACE_URL", "https://lightricks-ltx-2-3.hf.space").rstrip("/")
LTX_WAIT_SECONDS = 8 * 60


def _engine_order(payload: dict) -> list[str]:
    raw = payload.get("engine_order")
    if not isinstance(raw, list):
        return []
    order = [str(name) for name in raw if str(name) in ENGINES]
    if not _speech_enabled():
        order = [name for name in order if name != "wan-speech"]
    return order


def _spawn_engine(name: str, payload: dict):
    job = {**payload, "engine": name}
    if name.startswith("ltx"):
        return NovaLtxVideo().generate.spawn(job)
    if name == "wan-speech":
        return NovaWanSpeechVideo().generate.spawn(job)
    return NovaWanVideo().generate.spawn(job)


def _hand_off(payload: dict, error: Exception) -> bool:
    order = _engine_order(payload)
    current = str(payload.get("engine") or "")
    if current not in order:
        return False
    remaining = order[order.index(current) + 1:]
    if not remaining:
        return False
    print(f"[NOVA_VIDEO ENGINE] {current} failed ({str(error)[:240]}); handing off to {remaining[0]}", flush=True)
    _spawn_engine(remaining[0], payload)
    return True


def _hf_headers(payload: dict) -> dict:
    # The customer's own Hugging Face token (their free ZeroGPU quota) wins over
    # NOVA's; never logged.
    token = str(payload.get("hf_token") or os.environ.get("HF_TOKEN") or "").strip()
    return {"Authorization": f"Bearer {token}"} if token else {}


def _ltx_dimensions(aspect: str) -> tuple[int, int]:
    if aspect == "9:16":
        return 576, 1024
    if aspect == "1:1":
        return 768, 768
    return 1024, 576


def _gradio_upload(path: Path, headers: dict) -> dict:
    import requests

    with path.open("rb") as handle:
        response = requests.post(f"{LTX_SPACE}/gradio_api/upload", files={"files": handle}, headers=headers, timeout=120)
    response.raise_for_status()
    remote = response.json()[0]
    return {"path": remote, "meta": {"_type": "gradio.FileData"}}


def _ltx_render(prompt: str, image: dict | None, seconds: int, seed: int, width: int, height: int,
                headers: dict, output: Path) -> None:
    import json
    import requests

    t0 = time.time()
    submit = requests.post(
        f"{LTX_SPACE}/gradio_api/call/generate_video",
        json={"data": [image, prompt, seconds, False, seed, False, height, width]},
        headers=headers,
        timeout=60,
    )
    submit.raise_for_status()
    event_id = submit.json()["event_id"]

    video_url = None
    event = ""
    with requests.get(f"{LTX_SPACE}/gradio_api/call/generate_video/{event_id}", headers=headers,
                      stream=True, timeout=(30, LTX_WAIT_SECONDS)) as stream:
        for raw_line in stream.iter_lines(decode_unicode=True):
            if time.time() - t0 > LTX_WAIT_SECONDS:
                raise TimeoutError("LTX queue wait exceeded")
            line = (raw_line or "").strip()
            if line.startswith("event:"):
                event = line[6:].strip()
            elif line.startswith("data:") and event == "complete":
                data = json.loads(line[5:].strip())
                first = data[0] if data else None
                video_url = (first or {}).get("url") if isinstance(first, dict) else None
                break
            elif line.startswith("data:") and event == "error":
                # ZeroGPU quota exhaustion arrives here with an empty payload.
                raise RuntimeError(f"LTX engine error: {line[5:].strip()[:200] or 'no detail (quota?)'}")
    if not video_url:
        raise RuntimeError("LTX engine returned no video")
    _phase_timing("ltx_render", t0)

    response = requests.get(video_url, headers=headers, timeout=180)
    response.raise_for_status()
    output.write_bytes(response.content)


def _ltx_generate(payload: dict) -> str:
    engine = str(payload.get("engine") or "ltx")
    native_speech = engine == "ltx-speech"
    prompt_key = "ltx_speech_prompt" if native_speech else "ltx_prompt"
    prompt = str(payload.get(prompt_key) or payload.get("prompt") or "").strip()
    if not prompt:
        raise ValueError("LTX prompt is required")
    aspect = str(payload.get("aspect_ratio") or "16:9")
    duration = max(2, min(10, int(payload.get("duration") or 5)))
    seed = int(payload.get("seed") or int(time.time() * 1000) % 2_147_483_647)
    width, height = _ltx_dimensions(aspect)
    headers = _hf_headers(payload)

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        image = None
        if str(payload.get("task")) == "image-to-video" and payload.get("image_url"):
            reference = tmp / "reference.jpg"
            _download(str(payload["image_url"]), reference, 20_000_000)
            image = _gradio_upload(reference, headers)

        raw = tmp / "ltx.mp4"
        _ltx_render(prompt, image, duration, seed, width, height, headers, raw)
        if _video_seconds(raw) < duration - 1.0:
            raise RuntimeError("LTX engine returned a truncated video")

        # On-camera speech already comes from the engine; otherwise NOVA dubs
        # the narration so every language gets a known-good voice.
        result = _finish_video(raw, payload, tmp, aspect, float(duration), include_narration=not native_speech)
        return _upload(payload, result)


def _director_speech_generate(payload: dict) -> str:
    """Lip-synced on-camera speech with Apache-2.0 models only.

    Kokoro speaks the director's narration in the customer's language, and
    Wan2.2-S2V animates a reference portrait to that exact audio. Without a
    customer image the portrait is rendered with Wan TI2V first.
    """
    import math

    _ensure_model(S2V_REPO, S2V_DIR)
    timeline = _director_timeline(payload)
    speech = " ".join(item["narration"] for item in timeline if item.get("narration")).strip()
    if not speech:
        raise ValueError("Director speech requires narration")
    aspect = str(payload.get("aspect_ratio") or "16:9")
    duration = max(3, min(10, int(payload.get("duration") or 5)))
    steps = max(4, min(40, int(os.environ.get("NOVA_WAN_SPEECH_STEPS", "20"))))
    seed = int(payload.get("seed") or int(time.time() * 1000) % 2_147_483_647)

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        reference = tmp / "reference.png"
        if payload.get("image_url"):
            _download(str(payload["image_url"]), reference, 20_000_000)
        else:
            _prepare_normal_wan_runtime()
            _ensure_model(TI2V_REPO, TI2V_DIR)
            first = timeline[0]
            portrait = (
                f"{first.get('visual', '')} Medium close-up portrait, the person faces the camera with a "
                "neutral closed mouth, face evenly and clearly lit, sharp focus, photorealistic. "
                "No text, no captions."
            )
            still = tmp / "portrait.mp4"
            _run_normal_segment(prompt=portrait, aspect=aspect, frames=17, steps=12, seed=seed,
                                output=still, reference=None)
            _extract_last_frame(still, reference)

        lang, voice, speed = _tts_config(payload, speech)
        voice_raw = tmp / "speech-raw.wav"
        _synthesize_kokoro(speech, voice_raw, lang, voice, speed)
        spoken = _audio_seconds(voice_raw)
        tempo = min(MAX_NARRATION_SPEEDUP, max(1.0, spoken / max(1.0, duration - 0.3)))
        voice_wav = tmp / "speech.wav"
        filters = f"atempo={tempo:.4f}," if tempo > 1.001 else ""
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(voice_raw), "-af", f"{filters}atrim=duration={duration:.3f}",
             "-ar", "16000", "-ac", "1", str(voice_wav)],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )

        output = tmp / "speech.mp4"
        command = [
            "python", str(WAN_CODE / "generate.py"),
            "--task", "s2v-14B",
            "--size", "704*1024" if aspect == "9:16" else "1024*704",
            "--ckpt_dir", str(S2V_DIR),
            "--offload_model", "True",
            "--convert_model_dtype",
            "--t5_cpu",
            "--prompt", f"{timeline[0].get('visual', '')} The person speaks to the camera naturally.",
            "--image", str(reference),
            "--audio", str(voice_wav),
            "--start_from_ref",
            "--num_clip", str(max(1, math.ceil(_audio_seconds(voice_wav) * 16 / 80))),
            "--sample_steps", str(steps),
            "--base_seed", str(seed),
            "--save_file", str(output),
        ]
        t0 = time.time()
        try:
            subprocess.run(command, cwd=str(WAN_CODE), check=True, timeout=15 * 60)
        finally:
            _phase_timing(f"director_speech_render_steps{steps}", t0)

        result = output
        if aspect == "1:1":
            square = tmp / "speech-square.mp4"
            _crop_square(result, square)
            result = square
        total = min(float(duration), _video_seconds(result))
        result = _finish_video(result, payload, tmp, aspect, total, include_narration=False)
        return _upload(payload, result)


def _run_engine(payload: dict, render, failure_code: str) -> dict:
    try:
        public_url = render(payload)
        _notify(payload, "completed")
        return {"success": True, "video_url": public_url, "engine": payload.get("engine")}
    except Exception as error:
        if _hand_off(payload, error):
            return {"success": False, "handed_off": True}
        _notify(payload, "failed", failure_code)
        raise


@app.cls(
    image=base_image,
    gpu="L40S",
    cpu=4.0,
    memory=65536,
    volumes={str(MODEL_ROOT): model_volume},
    secrets=[engine_secret],
    timeout=18 * 60,
    scaledown_window=60,
    max_containers=2,
)
class NovaWanVideo:
    @modal.method()
    def generate(self, payload: dict) -> dict:
        return _run_engine(payload, _normal_generate, "GENERATION_FAILED")


@app.cls(
    image=speech_image,
    gpu="A100-80GB",
    cpu=4.0,
    memory=65536,
    volumes={str(MODEL_ROOT): model_volume},
    secrets=[engine_secret],
    timeout=18 * 60,
    scaledown_window=15,
    max_containers=1,
)
class NovaWanSpeechVideo:
    @modal.method()
    def generate(self, payload: dict) -> dict:
        render = _director_speech_generate if payload.get("engine") == "wan-speech" else _speech_generate
        return _run_engine(payload, render, "SPEECH_GENERATION_FAILED")


# LTX runs on Hugging Face ZeroGPU; this container only waits, downloads and
# post-produces, so it is CPU-only and costs almost nothing while it waits.
@app.cls(
    image=base_image,
    cpu=2.0,
    memory=8192,
    volumes={str(MODEL_ROOT): model_volume},
    secrets=[engine_secret],
    timeout=14 * 60,
    scaledown_window=30,
    max_containers=4,
)
class NovaLtxVideo:
    @modal.method()
    def generate(self, payload: dict) -> dict:
        return _run_engine(payload, _ltx_generate, "GENERATION_FAILED")


@app.function(image=base_image, secrets=[engine_secret], timeout=60)
@modal.asgi_app()
def api():
    from fastapi import FastAPI, HTTPException, Request

    web = FastAPI(title="NOVA Video Engine", docs_url=None, redoc_url=None, openapi_url=None)

    @web.get("/health")
    async def health():
        tasks = ["text-to-video", "image-to-video", "continue-video"]
        if _speech_enabled():
            tasks.append("speech-video")
        return {"ok": True, "provider": "modal", "tasks": tasks}

    @web.post("/")
    async def generate_video(request: Request):
        authorization = request.headers.get("authorization", "")
        supplied = authorization[7:] if authorization.lower().startswith("bearer ") else ""
        if not _authorized(supplied):
            raise HTTPException(status_code=401, detail="Unauthorized")

        body = await request.json()
        payload = body.get("input") if isinstance(body, dict) else None
        if not isinstance(payload, dict):
            raise HTTPException(status_code=400, detail="Invalid input")

        task = str(payload.get("task") or "")
        if task == "speech-video":
            if not _speech_enabled():
                raise HTTPException(status_code=503, detail="Speech engine disabled")
            call = await NovaWanSpeechVideo().generate.spawn.aio(payload)
            engine = "wan-s2v"
        elif task in {"text-to-video", "image-to-video"} and _engine_order(payload):
            first = _engine_order(payload)[0]
            job = {**payload, "engine": first}
            if first.startswith("ltx"):
                call = await NovaLtxVideo().generate.spawn.aio(job)
            elif first == "wan-speech":
                call = await NovaWanSpeechVideo().generate.spawn.aio(job)
            else:
                call = await NovaWanVideo().generate.spawn.aio(job)
            engine = first
        elif task in {"text-to-video", "image-to-video", "continue-video"}:
            call = await NovaWanVideo().generate.spawn.aio(payload)
            engine = "wan-ti2v"
        else:
            raise HTTPException(status_code=400, detail="Unsupported task")

        return {"accepted": True, "status": "processing", "call_id": call.object_id, "engine": engine}

    return web
