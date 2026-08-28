"""Private-engine adapter for NOVA VIDEO.

The public NOVA repository intentionally contains no underlying model identifier.
Deployment configuration is supplied through a private Modal Secret named
`nova-video-engine`:

  NOVA_VIDEO_T2V_MODEL_REPO=<private approved text-to-video repository id>
  NOVA_VIDEO_I2V_MODEL_REPO=<private approved image-to-video repository id>
  NOVA_VIDEO_WORKER_SECRET=<same value used by the NOVA server>
  NOVA_VIDEO_STEPS=<optional inference steps>

The HTTP endpoint only acknowledges jobs. GPU generation continues in a durable
background invocation, writes the MP4 directly to NOVA's pre-signed R2 target,
and calls NOVA back when the job completes or fails.
"""

from __future__ import annotations

import hmac
import os
import subprocess
import tempfile
import time
from pathlib import Path

import modal

APP_NAME = "nova-video-engine"
MODEL_CACHE = Path("/models")

worker_image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("ffmpeg")
    .uv_pip_install(
        "accelerate>=1.6,<2",
        "diffusers>=0.33,<1",
        "fastapi[standard]",
        "huggingface-hub>=0.36,<1",
        "imageio>=2.37,<3",
        "imageio-ffmpeg>=0.5,<1",
        "pillow",
        "requests>=2.32,<3",
        "sentencepiece>=0.2,<1",
        "torch>=2.7,<3",
        "transformers>=4.51,<6",
    )
    .env(
        {
            "HF_HOME": str(MODEL_CACHE),
            "HF_XET_HIGH_PERFORMANCE": "1",
        }
    )
)

app = modal.App(APP_NAME)
model_volume = modal.Volume.from_name("nova-video-model-cache", create_if_missing=True)
engine_secret = modal.Secret.from_name("nova-video-engine")


def _dimensions(aspect_ratio: str) -> tuple[int, int]:
    ratio = str(aspect_ratio or "16:9")
    if ratio == "9:16":
        return 448, 768
    if ratio == "1:1":
        return 512, 512
    return 768, 448


def _frames_for_duration(seconds: int) -> int:
    return (max(5, min(10, int(seconds))) * 24) + 1


def _authorized(request_secret: str | None) -> bool:
    expected = os.environ.get("NOVA_VIDEO_WORKER_SECRET", "")
    if not expected:
        return False
    return hmac.compare_digest(str(request_secret or ""), expected)


def _download(url: str, destination: Path) -> None:
    import requests

    if not url.startswith("https://"):
        raise ValueError("Only HTTPS media URLs are accepted")
    with requests.get(url, stream=True, timeout=60) as response:
        response.raise_for_status()
        with destination.open("wb") as handle:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    handle.write(chunk)


def _extract_last_frame(video_path: Path, frame_path: Path) -> None:
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-sseof",
            "-0.15",
            "-i",
            str(video_path),
            "-frames:v",
            "1",
            str(frame_path),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def _concat_videos(first: Path, second: Path, output: Path) -> None:
    list_file = output.with_suffix(".txt")
    list_file.write_text(
        f"file '{first.as_posix()}'\nfile '{second.as_posix()}'\n",
        encoding="utf-8",
    )
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(list_file),
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "20",
            "-pix_fmt",
            "yuv420p",
            str(output),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


@app.cls(
    image=worker_image,
    gpu="L4",
    volumes={str(MODEL_CACHE): model_volume},
    secrets=[engine_secret],
    timeout=12 * 60,
    scaledown_window=60,
    max_containers=2,
)
class NovaVideoEngine:
    @modal.enter()
    def load(self):
        import torch
        from diffusers import DiffusionPipeline

        t2v_repo = os.environ.get("NOVA_VIDEO_T2V_MODEL_REPO", "").strip()
        i2v_repo = os.environ.get("NOVA_VIDEO_I2V_MODEL_REPO", "").strip()
        if not t2v_repo or not i2v_repo:
            raise RuntimeError("NOVA video engine repositories are not configured")

        self.t2v = DiffusionPipeline.from_pretrained(
            t2v_repo,
            torch_dtype=torch.bfloat16,
        ).to("cuda")
        self.i2v_repo = i2v_repo
        self.i2v = None
        model_volume.commit()

    def _image_pipeline(self):
        if self.i2v is None:
            import torch
            from diffusers import DiffusionPipeline

            self.i2v = DiffusionPipeline.from_pretrained(
                self.i2v_repo,
                torch_dtype=torch.bfloat16,
            ).to("cuda")
            model_volume.commit()
        return self.i2v

    @modal.method()
    def generate(self, payload: dict) -> dict:
        import requests
        import torch
        from diffusers.utils import export_to_video, load_image

        callback = payload.get("nova_callback") or {}
        callback_url = str(callback.get("url") or "")
        callback_token = str(callback.get("token") or "")

        def notify(status: str, error_code: str | None = None) -> None:
            if not callback_url.startswith(("https://", "http://localhost")) or not callback_token:
                return
            for attempt in range(3):
                try:
                    response = requests.post(
                        callback_url,
                        headers={"Authorization": f"Bearer {callback_token}"},
                        json={"status": status, "error_code": error_code},
                        timeout=15,
                    )
                    if 200 <= response.status_code < 300:
                        return
                except Exception:
                    pass
                time.sleep(1 + attempt)

        try:
            task = str(payload.get("task") or "text-to-video")
            prompt = str(payload.get("prompt") or "").strip()
            negative_prompt = str(
                payload.get("negative_prompt")
                or "worst quality, inconsistent motion, blurry, jittery, distorted"
            )
            duration = max(5, min(10, int(payload.get("duration") or 5)))
            width, height = _dimensions(payload.get("aspect_ratio") or "16:9")
            num_frames = _frames_for_duration(duration)
            steps = max(4, min(50, int(os.environ.get("NOVA_VIDEO_STEPS", "8"))))
            seed = payload.get("seed")
            output = payload.get("nova_output") or {}
            upload_url = str(output.get("upload_url") or "")
            public_url = str(output.get("public_url") or "")

            if not prompt:
                raise ValueError("Prompt is required")
            if not upload_url or not public_url:
                raise ValueError("NOVA output target is required")
            if task not in {"text-to-video", "image-to-video", "continue-video"}:
                raise ValueError("Unsupported NOVA video task")

            generator = None
            if seed is not None:
                generator = torch.Generator(device="cuda").manual_seed(int(seed))

            request_args = {
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "width": width,
                "height": height,
                "num_frames": num_frames,
                "num_inference_steps": steps,
                "generator": generator,
            }

            source_video = None
            with tempfile.TemporaryDirectory() as tmpdir:
                tmp = Path(tmpdir)

                if task == "image-to-video":
                    image_url = str(payload.get("image_url") or "")
                    if not image_url.startswith("https://"):
                        raise ValueError("A public HTTPS reference image is required")
                    request_args["image"] = load_image(image_url)
                    pipeline = self._image_pipeline()
                elif task == "continue-video":
                    source_url = str(payload.get("source_video_url") or "")
                    if not source_url.startswith("https://"):
                        raise ValueError("A NOVA source video is required")
                    source_video = tmp / "source.mp4"
                    last_frame = tmp / "last-frame.png"
                    _download(source_url, source_video)
                    _extract_last_frame(source_video, last_frame)
                    request_args["image"] = load_image(str(last_frame))
                    pipeline = self._image_pipeline()
                else:
                    pipeline = self.t2v

                frames = pipeline(**request_args).frames[0]
                segment_path = tmp / "segment.mp4"
                export_to_video(frames, segment_path, fps=24)

                output_path = segment_path
                if source_video is not None:
                    combined_path = tmp / "combined.mp4"
                    _concat_videos(source_video, segment_path, combined_path)
                    output_path = combined_path

                with output_path.open("rb") as handle:
                    response = requests.put(
                        upload_url,
                        data=handle,
                        headers={"Content-Type": "video/mp4"},
                        timeout=180,
                    )
                response.raise_for_status()

            notify("completed")
            return {"success": True, "uploaded": True, "video_url": public_url}
        except Exception:
            notify("failed", "GENERATION_FAILED")
            raise


@app.function(
    image=worker_image,
    secrets=[engine_secret],
    timeout=60,
)
@modal.asgi_app()
def api():
    from fastapi import FastAPI, HTTPException, Request

    web = FastAPI(title="NOVA Video Engine", docs_url=None, redoc_url=None, openapi_url=None)

    @web.get("/health")
    async def health():
        configured = bool(
            os.environ.get("NOVA_VIDEO_T2V_MODEL_REPO")
            and os.environ.get("NOVA_VIDEO_I2V_MODEL_REPO")
            and os.environ.get("NOVA_VIDEO_WORKER_SECRET")
        )
        return {"ok": configured}

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

        output = payload.get("nova_output") or {}
        public_url = str(output.get("public_url") or "")
        if not public_url:
            raise HTTPException(status_code=400, detail="Invalid output target")

        call = NovaVideoEngine().generate.spawn(payload)
        return {
            "accepted": True,
            "status": "processing",
            "call_id": call.object_id,
            "video_url": public_url,
        }

    return web
