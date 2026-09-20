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
        seconds = max(2.0, min(10.0, float(beat["end"]) - float(beat["start"])))
        clip = tmp / f"director-{index:02d}.mp4"
        prompt = _segment_prompt(payload, beat, index, len(timeline))
        _run_normal_segment(
            prompt=prompt,
            aspect=aspect,
            frames=_frames(seconds),
            steps=steps,
            seed=seed + index,
            output=clip,
            reference=reference,
        )
        clips.append(clip)
        if index < len(timeline) - 1:
            reference = tmp / f"director-{index:02d}-last.png"
            _extract_last_frame(clip, reference)

    combined = tmp / "director-combined.mp4"
    _concat_many(clips, combined)
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


def _tts_config(payload: dict, narration_text: str) -> tuple[str, str, float]:
    direction = str(payload.get("director_voiceover") or "")
    combined = f"{direction} {narration_text}".lower()
    portuguese = _looks_portuguese(combined)
    female = "female" in combined or "femin" in combined or "woman" in combined or "mulher" in combined
    male = "male" in combined or "mascul" in combined or "man " in combined or "homem" in combined

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


def _fit_audio_to_window(source: Path, output: Path, target_seconds: float) -> None:
    import soundfile as sf

    duration = float(sf.info(str(source)).duration or 0.0)
    target = max(0.25, float(target_seconds))
    if duration <= 0:
        raise RuntimeError("Generated narration is empty")

    filters = []
    if duration > target:
        ratio = duration / target
        while ratio > 2.0:
            filters.append("atempo=2.0")
            ratio /= 2.0
        while ratio < 0.5:
            filters.append("atempo=0.5")
            ratio /= 0.5
        filters.append(f"atempo={ratio:.5f}")
    filters.append(f"apad=pad_dur={target:.3f}")
    filters.append(f"atrim=duration={target:.3f}")

    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(source),
            "-af", ",".join(filters),
            "-ar", "48000", "-ac", "2", str(output),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def _make_piano_note(output: Path, seconds: float = 0.9) -> None:
    expr = (
        "0.22*(sin(2*PI*261.63*t)*exp(-3.2*t)"
        "+0.45*sin(2*PI*523.25*t)*exp(-4.2*t)"
        "+0.20*sin(2*PI*784.88*t)*exp(-5.0*t))"
    )
    subprocess.run(
        [
            "ffmpeg", "-y", "-f", "lavfi",
            "-i", f"aevalsrc={expr}:s=48000:d={float(seconds):.3f}",
            "-ac", "2", str(output),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def _build_director_audio(payload: dict, tmp: Path, total_seconds: float) -> Path | None:
    timeline = _director_timeline(payload)
    narration_items = [item for item in timeline if item.get("narration")]
    has_piano = any("piano" in str(item.get("audio") or "").lower() for item in timeline)
    if not narration_items and not has_piano:
        return None

    narration_text = " ".join(str(item.get("narration") or "") for item in narration_items)
    lang, voice, speed = _tts_config(payload, narration_text)
    inputs = []
    filters = []
    mix_labels = []

    for index, item in enumerate(narration_items):
        raw = tmp / f"voice-{index:02d}-raw.wav"
        fitted = tmp / f"voice-{index:02d}.wav"
        window = max(0.35, float(item["end"]) - float(item["start"]))
        _synthesize_kokoro(str(item["narration"]), raw, lang, voice, speed)
        _fit_audio_to_window(raw, fitted, window)
        inputs.extend(["-i", str(fitted)])
        delay_ms = max(0, int(round(float(item["start"]) * 1000)))
        filters.append(f"[{len(mix_labels)}:a]adelay={delay_ms}|{delay_ms}[a{len(mix_labels)}]")
        mix_labels.append(f"[a{len(mix_labels)}]")

    if has_piano:
        piano_item = next(item for item in timeline if "piano" in str(item.get("audio") or "").lower())
        piano = tmp / "piano.wav"
        _make_piano_note(piano)
        input_index = len(mix_labels)
        inputs.extend(["-i", str(piano)])
        delay_ms = max(0, int(round(float(piano_item["start"]) * 1000)))
        filters.append(f"[{input_index}:a]adelay={delay_ms}|{delay_ms}[a{input_index}]")
        mix_labels.append(f"[a{input_index}]")

    mixed = tmp / "director-audio.wav"
    filters.append(
        "".join(mix_labels) +
        f"amix=inputs={len(mix_labels)}:normalize=0:duration=longest,"
        f"atrim=duration={float(total_seconds):.3f},alimiter=limit=0.95[aout]"
    )
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
        caption_file = output.with_name(f"caption-{index:02d}.txt")
        width = 28 if aspect == "9:16" else 44
        caption_file.write_text(_wrapped_caption(str(item["caption"]), width), encoding="utf-8")
        start = float(item["start"])
        end = float(item["end"])
        fontsize = 36 if aspect == "9:16" else 32
        margin = 130 if aspect == "9:16" else 75
        filters.append(
            "drawtext="
            "fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:"
            f"textfile='{caption_file.as_posix()}':"
            "fontcolor=white:"
            f"fontsize={fontsize}:"
            "line_spacing=5:"
            "box=1:boxcolor=black@0.58:boxborderw=12:"
            "x=(w-text_w)/2:"
            f"y=h-text_h-{margin}:"
            f"enable='between(t,{start:.3f},{end:.3f})'"
        )

    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(source),
            "-vf", ",".join(filters),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
            "-pix_fmt", "yuv420p", "-an", str(output),
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
    steps = max(4, min(24, int(os.environ.get("NOVA_WAN_SAMPLE_STEPS", "8"))))
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
            if aspect == "1:1":
                square = tmp / "square.mp4"
                _crop_square(result, square)
                result = square
            if source_video is not None:
                combined = tmp / "combined.mp4"
                _concat(source_video, result, combined)
                result = combined
            return _upload(payload, result)
    except Exception:
        _notify(payload, "failed", "GENERATION_FAILED")
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
        _notify(payload, "failed", "SPEECH_GENERATION_FAILED")
        raise


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
        try:
            public_url = _normal_generate(payload)
            _notify(payload, "completed")
            return {"success": True, "video_url": public_url}
        except Exception:
            _notify(payload, "failed", "GENERATION_FAILED")
            raise


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
        try:
            public_url = _speech_generate(payload)
            _notify(payload, "completed")
            return {"success": True, "video_url": public_url}
        except Exception:
            _notify(payload, "failed", "SPEECH_GENERATION_FAILED")
            raise


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
        elif task in {"text-to-video", "image-to-video", "continue-video"}:
            call = await NovaWanVideo().generate.spawn.aio(payload)
            engine = "wan-ti2v"
        else:
            raise HTTPException(status_code=400, detail="Unsupported task")

        return {"accepted": True, "status": "processing", "call_id": call.object_id, "engine": engine}

    return web
