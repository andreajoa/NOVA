"""Isolated Modal benchmark for a genuinely low-latency NOVA video engine.

This does NOT alter the production endpoint. It benchmarks Lightricks' public
LTX-Video 2B 0.9.6 distilled model on H100 at NOVA's 480p-class vertical size.
The official release describes this distilled checkpoint as real-time capable on
H100, using 8 (or fewer) diffusion steps.
"""

import tempfile
import time
from pathlib import Path

import modal

APP_NAME = "nova-ltx-fast-benchmark"
CACHE = Path("/ltx-cache")
MODEL_FILE = "ltxv-2b-0.9.6-distilled-04-25.safetensors"
MODEL_REPO = "Lightricks/LTX-Video"
TEXT_REPO = "PixArt-alpha/PixArt-XL-2-1024-MS"

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "git", "libgl1", "libglib2.0-0")
    .uv_pip_install(
        "torch>=2.7,<3",
        "torchvision",
        "diffusers>=0.33,<0.36",
        "transformers>=4.49,<4.52",
        "sentencepiece>=0.2,<1",
        "huggingface-hub>=0.30,<0.31",
        "einops>=0.8,<1",
        "timm>=1,<2",
        "imageio[ffmpeg]>=2.37,<3",
        "imageio-ffmpeg>=0.6,<1",
        "av>=14,<16",
        "pyyaml>=6,<7",
        "safetensors>=0.5,<1",
        "numpy<2",
    )
    .run_commands(
        "git clone --depth 1 https://github.com/Lightricks/LTX-Video.git /opt/LTX-Video",
        "cd /opt/LTX-Video && pip install -e . --no-deps",
    )
    .env(
        {
            "HF_HOME": str(CACHE),
            "HF_HUB_CACHE": str(CACHE / "hub"),
            "HF_XET_HIGH_PERFORMANCE": "1",
            "PYTHONPATH": "/opt/LTX-Video",
            "TOKENIZERS_PARALLELISM": "false",
        }
    )
)

app = modal.App(APP_NAME)
volume = modal.Volume.from_name("nova-ltx-fast-cache", create_if_missing=True)


@app.function(image=image, cpu=4, memory=16384, volumes={str(CACHE): volume}, timeout=30 * 60)
def preload():
    from huggingface_hub import hf_hub_download, snapshot_download

    started = time.time()
    model = hf_hub_download(repo_id=MODEL_REPO, filename=MODEL_FILE)
    snapshot_download(
        repo_id=TEXT_REPO,
        allow_patterns=["text_encoder/*", "tokenizer/*"],
    )
    volume.commit()
    result = {"model": model, "seconds": round(time.time() - started, 2)}
    print(f"[NOVA_LTX PRELOAD] {result}", flush=True)
    return result


def _config_file(tmp: Path) -> Path:
    import yaml

    config = {
        "pipeline_type": "base",
        "checkpoint_path": MODEL_FILE,
        "guidance_scale": 1,
        "stg_scale": 0,
        "rescaling_scale": 1,
        "num_inference_steps": 8,
        "stg_mode": "attention_values",
        "decode_timestep": 0.05,
        "decode_noise_scale": 0.025,
        "text_encoder_model_name_or_path": TEXT_REPO,
        "precision": "bfloat16",
        "sampler": "from_checkpoint",
        # Disable extra caption/LLM prompt enhancement: user prompts are already
        # generated upstream and this latency path must not load two extra models.
        "prompt_enhancement_words_threshold": 0,
        "prompt_enhancer_image_caption_model_name_or_path": "MiaoshouAI/Florence-2-large-PromptGen-v2.0",
        "prompt_enhancer_llm_model_name_or_path": "unsloth/Llama-3.2-3B-Instruct",
        "stochastic_sampling": True,
    }
    path = tmp / "ltx-fast.yaml"
    path.write_text(yaml.safe_dump(config), encoding="utf-8")
    return path


@app.function(
    image=image,
    gpu="H100",
    cpu=6,
    memory=65536,
    volumes={str(CACHE): volume},
    timeout=12 * 60,
)
def benchmark(duration: int = 5):
    from ltx_video.inference import InferenceConfig, infer

    duration = 5 if int(duration) <= 5 else 10
    # 24 fps and 8n+1 frame compatibility: 5s -> 121; 10s -> 241.
    frames = duration * 24 + 1
    height, width = 768, 512
    prompt = (
        "A cinematic documentary-style scene of a man walking slowly through a softly lit modern room, "
        "natural human motion, realistic skin and clothing, subtle camera movement, coherent background, "
        "soft practical lighting, detailed facial features, physically plausible movement, no text, no subtitles."
    )

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        cfg = _config_file(tmp)
        output = tmp / "out"
        started = time.time()
        infer(
            InferenceConfig(
                prompt=prompt,
                pipeline_config=str(cfg),
                output_path=str(output),
                seed=20260902,
                height=height,
                width=width,
                num_frames=frames,
                frame_rate=24,
                offload_to_cpu=False,
            )
        )
        elapsed = time.time() - started
        videos = list(output.glob("*.mp4"))
        size = videos[0].stat().st_size if videos else 0
        result = {
            "ok": bool(videos and size > 0),
            "duration": duration,
            "frames": frames,
            "width": width,
            "height": height,
            "seconds": round(elapsed, 2),
            "bytes": size,
        }
        print(f"[NOVA_LTX BENCHMARK] {result}", flush=True)
        return result
