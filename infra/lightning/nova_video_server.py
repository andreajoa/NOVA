"""NOVA VIDEO worker for a Lightning AI GPU deployment.

L4: Wan2.2-TI2V-5B for text/image/continuation.
>=75 GB GPU + NOVA_ENABLE_SPEECH=1: Wan2.2-S2V-14B with built-in CosyVoice TTS.
"""

from __future__ import annotations

import hmac
import os
import subprocess
import tempfile
import threading
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from huggingface_hub import snapshot_download
import requests

WAN_CODE = Path(os.environ.get("WAN_CODE_DIR", "~/Wan2.2")).expanduser()
MODEL_ROOT = Path(os.environ.get("NOVA_MODEL_ROOT", "~/nova-models")).expanduser()
TI2V_REPO = "Wan-AI/Wan2.2-TI2V-5B"
S2V_REPO = "Wan-AI/Wan2.2-S2V-14B"
TI2V_DIR = MODEL_ROOT / "Wan2.2-TI2V-5B"
S2V_DIR = MODEL_ROOT / "Wan2.2-S2V-14B"
TTS_PROMPT_TEXT = "希望你以后能够做的比我还好呦。"

app = FastAPI(title="NOVA Lightning Video Engine", docs_url=None, redoc_url=None, openapi_url=None)
generation_lock = threading.Lock()


def _authorized(token: str) -> bool:
    expected = os.environ.get("NOVA_VIDEO_WORKER_SECRET", "")
    return bool(expected) and hmac.compare_digest(token, expected)


def _gpu_memory_gb() -> float:
    try:
        import torch
        if not torch.cuda.is_available():
            return 0.0
        return torch.cuda.get_device_properties(0).total_memory / (1024**3)
    except Exception:
        return 0.0


def _speech_enabled() -> bool:
    requested = str(os.environ.get("NOVA_ENABLE_SPEECH", "0")).lower() in {"1", "true", "yes"}
    return requested and _gpu_memory_gb() >= 75


def _frames(seconds: int) -> int:
    return (max(5, min(10, int(seconds))) * 24) + 1


def _size(aspect: str) -> str:
    return "704*1280" if str(aspect) == "9:16" else "1280*704"


def _ensure_model(repo_id: str, local_dir: Path) -> None:
    marker = local_dir / ".nova-ready"
    if marker.exists():
        return
    local_dir.mkdir(parents=True, exist_ok=True)
    snapshot_download(repo_id=repo_id, local_dir=str(local_dir), local_dir_use_symlinks=False)
    marker.write_text(repo_id, encoding="utf-8")


def _download(url: str, destination: Path, max_bytes: int = 150_000_000) -> None:
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


def _extract_last_frame(source: Path, output: Path) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-sseof", "-0.12", "-i", str(source), "-frames:v", "1", str(output)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def _crop_square(source: Path, output: Path) -> None:
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(source),
            "-vf", "crop='min(iw,ih)':'min(iw,ih)'",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", str(output),
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


def _notify(payload: dict, status: str, error_code: str | None = None) -> None:
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


def _upload(payload: dict, output_path: Path) -> str:
    target = payload.get("nova_output") or {}
    upload_url = str(target.get("upload_url") or "")
    public_url = str(target.get("public_url") or "")
    if not upload_url.startswith("https://") or not public_url.startswith("https://"):
        raise ValueError("NOVA output target missing")
    with output_path.open("rb") as handle:
        response = requests.put(upload_url, data=handle, headers={"Content-Type": "video/mp4"}, timeout=240)
    response.raise_for_status()
    return public_url


def _normal(payload: dict) -> str:
    _ensure_model(TI2V_REPO, TI2V_DIR)
    task = str(payload.get("task") or "")
    prompt = str(payload.get("prompt") or "").strip()
    if task not in {"text-to-video", "image-to-video", "continue-video"}:
        raise ValueError("Unsupported task")
    if not prompt:
        raise ValueError("Prompt required")

    duration = max(5, min(10, int(payload.get("duration") or 5)))
    aspect = str(payload.get("aspect_ratio") or "16:9")
    steps = max(4, min(50, int(os.environ.get("NOVA_WAN_SAMPLE_STEPS", "24"))))
    seed = int(payload.get("seed") or int(time.time() * 1000) % 2_147_483_647)

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        segment = tmp / "segment.mp4"
        reference = None
        source_video = None

        if task == "image-to-video":
            reference = tmp / "reference.jpg"
            _download(str(payload.get("image_url") or ""), reference, 20_000_000)
        elif task == "continue-video":
            source_video = tmp / "source.mp4"
            reference = tmp / "last-frame.png"
            _download(str(payload.get("source_video_url") or ""), source_video)
            _extract_last_frame(source_video, reference)

        command = [
            "python", str(WAN_CODE / "generate.py"),
            "--task", "ti2v-5B",
            "--size", _size(aspect),
            "--ckpt_dir", str(TI2V_DIR),
            "--offload_model", "True",
            "--convert_model_dtype",
            "--t5_cpu",
            "--prompt", prompt,
            "--frame_num", str(_frames(duration)),
            "--sample_steps", str(steps),
            "--base_seed", str(seed),
            "--save_file", str(segment),
        ]
        if reference:
            command.extend(["--image", str(reference)])
        subprocess.run(command, cwd=str(WAN_CODE), check=True, timeout=11 * 60)

        result = segment
        if aspect == "1:1":
            square = tmp / "square.mp4"
            _crop_square(result, square)
            result = square
        if source_video:
            combined = tmp / "combined.mp4"
            _concat(source_video, result, combined)
            result = combined
        return _upload(payload, result)


def _speech(payload: dict) -> str:
    if not _speech_enabled():
        raise RuntimeError("Speech task requires an >=75 GB GPU")
    _ensure_model(S2V_REPO, S2V_DIR)

    prompt = str(payload.get("prompt") or "").strip()
    speech_text = str(payload.get("speech_text") or "").strip()
    image_url = str(payload.get("image_url") or "")
    if not prompt or not speech_text or not image_url.startswith("https://"):
        raise ValueError("Speech video requires prompt, speech_text and image")

    duration = max(5, min(10, int(payload.get("duration") or 5)))
    aspect = str(payload.get("aspect_ratio") or "16:9")
    steps = max(4, min(40, int(os.environ.get("NOVA_WAN_SPEECH_STEPS", "20"))))
    seed = int(payload.get("seed") or int(time.time() * 1000) % 2_147_483_647)

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
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
            "--num_clip", "1" if duration <= 5 else "2",
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


def _generate_background(payload: dict) -> None:
    with generation_lock:
        try:
            if str(payload.get("task") or "") == "speech-video":
                _speech(payload)
            else:
                _normal(payload)
            _notify(payload, "completed")
        except Exception:
            code = "SPEECH_GENERATION_FAILED" if payload.get("task") == "speech-video" else "GENERATION_FAILED"
            _notify(payload, "failed", code)


@app.get("/health")
def health():
    tasks = ["text-to-video", "image-to-video", "continue-video"]
    if _speech_enabled():
        tasks.append("speech-video")
    return {"ok": True, "provider": "lightning", "gpuMemoryGb": round(_gpu_memory_gb(), 1), "tasks": tasks}


@app.post("/")
async def generate(request: Request):
    authorization = request.headers.get("authorization", "")
    token = authorization[7:] if authorization.lower().startswith("bearer ") else ""
    if not _authorized(token):
        raise HTTPException(status_code=401, detail="Unauthorized")

    body = await request.json()
    payload = body.get("input") if isinstance(body, dict) else None
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Invalid input")

    task = str(payload.get("task") or "")
    allowed = {"text-to-video", "image-to-video", "continue-video"}
    if _speech_enabled():
        allowed.add("speech-video")
    if task not in allowed:
        raise HTTPException(status_code=503 if task == "speech-video" else 400, detail="Unsupported task")

    thread = threading.Thread(target=_generate_background, args=(payload,), daemon=True)
    thread.start()
    return {"accepted": True, "status": "processing", "engine": "wan-s2v" if task == "speech-video" else "wan-ti2v"}
