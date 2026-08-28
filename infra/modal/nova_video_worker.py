"""NOVA VIDEO worker for Modal.

The public NOVA repository intentionally does not contain the underlying model ID.
Create a Modal secret named `nova-video-engine` with:

  NOVA_VIDEO_MODEL_REPO=<approved open-weight video model repository>
  NOVA_VIDEO_WORKER_SECRET=<same value configured in NOVA_ZERO_COST_VIDEO_SECRET>

Optional:
  NOVA_VIDEO_STEPS=8

Deploy with:
  modal deploy infra/modal/nova_video_worker.py

The resulting HTTPS endpoint is configured in NOVA as NOVA_ZERO_COST_VIDEO_URL.
The worker accepts the private NOVA contract and uploads MP4 output directly to a
pre-signed R2 URL supplied by NOVA, so large video bytes never pass through Vercel.
"""

from __future__ import annotations

import hmac
import os
import tempfile
from pathlib import Path

import modal

APP_NAME = "nova-video-engine"
MODEL_CACHE = Path("/models")

worker_image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("ffmpeg")
    .uv_pip_install(
        "accelerate==1.6.0",
        "diffusers==0.33.1",
        "fastapi[standard]",
        "huggingface-hub==0.36.0",
        "imageio==2.37.0",
        "imageio-ffmpeg==0.5.1",
        "pillow",
        "requests",
        "sentencepiece==0.2.0",
        "torch==2.7.0",
        "transformers==4.51.3",
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
    # 24 fps and an 8n+1 frame count keeps temporal latent geometry valid.
    return (max(5, min(10, int(seconds))) * 24) + 1


def _authorized(request_secret: str | None) -> bool:
    expected = os.environ.get("NOVA_VIDEO_WORKER_SECRET", "")
    if not expected:
        return False
    return hmac.compare_digest(str(request_secret or ""), expected)


@app.cls(
    image=worker_image,
    gpu="L4",
    volumes={str(MODEL_CACHE): model_volume},
    secrets=[engine_secret],
    timeout=10 * 60,
    scaledown_window=60,
    max_containers=2,
)
class NovaVideoEngine:
    @modal.enter()
    def load(self):
        import torch
        from diffusers import LTXImageToVideoPipeline, LTXPipeline

        model_repo = os.environ.get("NOVA_VIDEO_MODEL_REPO", "").strip()
        if not model_repo:
            raise RuntimeError("NOVA video model is not configured")

        self.t2v = LTXPipeline.from_pretrained(
            model_repo,
            torch_dtype=torch.bfloat16,
        ).to("cuda")

        # Reuse the same components/weights instead of loading a second copy.
        self.i2v = LTXImageToVideoPipeline(**self.t2v.components)

    @modal.method()
    def generate(self, payload: dict) -> dict:
        import requests
        from diffusers.utils import export_to_video, load_image

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

        generator = None
        if seed is not None:
            import torch

            generator = torch.Generator(device="cuda").manual_seed(int(seed))

        common = dict(
            prompt=prompt,
            negative_prompt=negative_prompt,
            width=width,
            height=height,
            num_frames=num_frames,
            num_inference_steps=steps,
            generator=generator,
        )

        if task == "image-to-video":
            image_url = str(payload.get("image_url") or "")
            if not image_url.startswith(("http://", "https://")):
                raise ValueError("A public reference image URL is required")
            image = load_image(image_url)
            frames = self.i2v(image=image, **common).frames[0]
        elif task == "text-to-video":
            frames = self.t2v(**common).frames[0]
        else:
            raise ValueError("Unsupported NOVA video task")

        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = Path(tmpdir) / "nova-video.mp4"
            export_to_video(frames, output_path, fps=24)

            with output_path.open("rb") as handle:
                response = requests.put(
                    upload_url,
                    data=handle,
                    headers={"Content-Type": "video/mp4"},
                    timeout=120,
                )
            response.raise_for_status()

        return {
            "success": True,
            "uploaded": True,
            "video_url": public_url,
        }


@app.function(
    image=worker_image,
    secrets=[engine_secret],
    timeout=12 * 60,
)
@modal.asgi_app()
def api():
    from fastapi import FastAPI, HTTPException, Request

    web = FastAPI(title="NOVA Video Engine", docs_url=None, redoc_url=None, openapi_url=None)

    @web.get("/health")
    async def health():
        return {"ok": True}

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

        try:
            return NovaVideoEngine().generate.remote(payload)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    return web
