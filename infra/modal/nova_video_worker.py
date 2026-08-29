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
    "numpy<2",
    "opencv-python-headless>=4.9",
    "pillow",
    "requests>=2.32,<3",
    "safetensors",
    "sentencepiece>=0.2,<1",
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
    .apt_install("ffmpeg", "git", "libgl1", "libglib2.0-0", "libsndfile1")
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


def _frames(seconds: int) -> int:
    # Wan TI2V requires 4n+1 frames. At 24 fps this maps 5s->121, 10s->241.
    return (max(5, min(10, int(seconds))) * 24) + 1


def _size(aspect: str) -> str:
    return "704*1280" if str(aspect) == "9:16" else "1280*704"


def _ensure_model(repo_id: str, local_dir: Path) -> None:
    marker = local_dir / ".nova-ready"
    if marker.exists():
        return
    from huggingface_hub import snapshot_download

    local_dir.mkdir(parents=True, exist_ok=True)
    snapshot_download(repo_id=repo_id, local_dir=str(local_dir), local_dir_use_symlinks=False)
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


def _upload(payload: dict, output_path: Path) -> str:
    import requests

    target = payload.get("nova_output") or {}
    upload_url = str(target.get("upload_url") or "")
    public_url = str(target.get("public_url") or "")
    if not upload_url.startswith("https://") or not public_url.startswith("https://"):
        raise ValueError("NOVA output target is required")
    with output_path.open("rb") as handle:
        response = requests.put(upload_url, data=handle, headers={"Content-Type": "video/mp4"}, timeout=240)
    response.raise_for_status()
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
    """Keep optional Wan pipelines from breaking the normal TI2V worker."""
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


def _run_normal_segment(
    *,
    prompt: str,
    aspect: str,
    steps: int,
    seed: int,
    output: Path,
    reference: Path | None = None,
) -> None:
    """Render one Wan TI2V segment at the model's supported 121-frame length."""
    command = [
        "python", str(WAN_CODE / "generate.py"),
        "--task", "ti2v-5B",
        "--size", _size(aspect),
        "--ckpt_dir", str(TI2V_DIR),
        "--offload_model", "True",
        "--convert_model_dtype",
        "--t5_cpu",
        "--prompt", prompt,
        "--frame_num", "121",
        "--sample_steps", str(steps),
        "--base_seed", str(seed),
        "--save_file", str(output),
    ]
    if reference is not None:
        command.extend(["--image", str(reference)])
    subprocess.run(command, cwd=str(WAN_CODE), check=True, timeout=11 * 60)


def _normal_generate(payload: dict) -> str:
    _prepare_normal_wan_runtime()
    _ensure_model(TI2V_REPO, TI2V_DIR)
    prompt = str(payload.get("prompt") or "").strip()
    task = str(payload.get("task") or "text-to-video")
    if not prompt:
        raise ValueError("Prompt is required")
    if task not in {"text-to-video", "image-to-video", "continue-video"}:
        raise ValueError("Unsupported normal video task")

    duration = max(5, min(10, int(payload.get("duration") or 5)))
    aspect = str(payload.get("aspect_ratio") or "16:9")
    steps = max(4, min(50, int(os.environ.get("NOVA_WAN_SAMPLE_STEPS", "24"))))
    seed = int(payload.get("seed") or int(time.time() * 1000) % 2_147_483_647)

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        first = tmp / "segment-1.mp4"
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
            steps=steps,
            seed=seed,
            output=first,
            reference=reference,
        )

        result = first
        if duration > 5:
            bridge = tmp / "segment-1-last.png"
            second = tmp / "segment-2.mp4"
            joined = tmp / "generated-10s.mp4"
            _extract_last_frame(first, bridge)
            continuation_prompt = (
                prompt
                + "\nContinue seamlessly from the supplied reference frame. Preserve the same "
                  "characters, wardrobe, location, lighting, camera direction and visual style. "
                  "Advance the action naturally without restarting the scene."
            )
            _run_normal_segment(
                prompt=continuation_prompt,
                aspect=aspect,
                steps=steps,
                seed=(seed + 1) % 2_147_483_647,
                output=second,
                reference=bridge,
            )
            _concat(first, second, joined)
            result = joined

        if aspect == "1:1":
            square = tmp / "square.mp4"
            _crop_square(result, square)
            result = square
        if source_video is not None:
            combined = tmp / "combined.mp4"
            _concat(source_video, result, combined)
            result = combined
        return _upload(payload, result)

def _speech_generate(payload: dict) -> str:
    if not _speech_enabled():
        raise RuntimeError("Speech video is disabled")
    _ensure_model(S2V_REPO, S2V_DIR)

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

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        reference = tmp / "reference.jpg"
        output = tmp / "speech.mp4"
        _download(image_url, reference, 20_000_000)

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
        subprocess.run(command, cwd=str(WAN_CODE), check=True, timeout=15 * 60)

        result = output
        if aspect == "1:1":
            square = tmp / "speech-square.mp4"
            _crop_square(result, square)
            result = square
        return _upload(payload, result)


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
    gpu="L4",
    cpu=4.0,
    memory=65536,
    volumes={str(MODEL_ROOT): model_volume},
    secrets=[engine_secret],
    timeout=18 * 60,
    scaledown_window=30,
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
