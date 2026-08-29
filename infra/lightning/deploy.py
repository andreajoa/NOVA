"""Deploy NOVA Wan workers to Lightning AI.

Required environment:
  LIGHTNING_USER_ID
  LIGHTNING_API_KEY
  NOVA_VIDEO_WORKER_SECRET

Optional:
  LIGHTNING_TEAMSPACE
  LIGHTNING_ORG
  NOVA_LIGHTNING_DEPLOY_SPEECH=1

Normal video is prepared on CPU and deployed from an L4 Studio snapshot.
Speech is attempted on an >=80 GB GPU; if that tier is unavailable, normal
video remains deployed and speech is reported as unavailable.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

from lightning_sdk import Deployment, Machine, Studio
from lightning_sdk.deployment import Env, HttpHealthCheck

ROOT = Path(__file__).resolve().parents[2]
SERVER = ROOT / "infra" / "lightning" / "nova_video_server.py"
TEAMSPACE = os.environ.get("LIGHTNING_TEAMSPACE") or None
ORG = os.environ.get("LIGHTNING_ORG") or None
SECRET = os.environ.get("NOVA_VIDEO_WORKER_SECRET", "")
DEPLOY_SPEECH = os.environ.get("NOVA_LIGHTNING_DEPLOY_SPEECH", "1").lower() in {"1", "true", "yes"}


def _studio(name: str) -> Studio:
    kwargs = {"create_ok": True}
    if TEAMSPACE:
        kwargs["teamspace"] = TEAMSPACE
    if ORG:
        kwargs["org"] = ORG
    return Studio(name, **kwargs)


def _deployment(name: str) -> Deployment:
    kwargs = {}
    if TEAMSPACE:
        kwargs["teamspace"] = TEAMSPACE
    if ORG:
        kwargs["org"] = ORG
    return Deployment(name, **kwargs)


def _run(studio: Studio, command: str) -> None:
    output, code = studio.run_with_exit_code(command)
    if code != 0:
        raise RuntimeError(f"Lightning setup failed ({code}): {str(output)[-3000:]}")


def _base_setup(studio: Studio, speech: bool) -> None:
    studio.upload_file(str(SERVER), remote_path="nova_video_server.py")
    _run(
        studio,
        """
set -e
sudo apt-get update -y
sudo apt-get install -y ffmpeg git libgl1 libglib2.0-0 libsndfile1
if [ ! -d "$HOME/Wan2.2/.git" ]; then
  git clone --depth 1 https://github.com/Wan-Video/Wan2.2.git "$HOME/Wan2.2"
else
  git -C "$HOME/Wan2.2" pull --ff-only
fi
python -m pip install --upgrade pip
python -m pip install \
  'torch>=2.7,<3' torchvision torchaudio \
  'transformers>=4.49,<=4.51.3' 'diffusers>=0.31,<1' \
  'accelerate>=1.6,<2' 'huggingface-hub>=0.36,<1' \
  sentencepiece tokenizers safetensors easydict ftfy tqdm \
  'imageio[ffmpeg]>=2.37,<3' imageio-ffmpeg \
  opencv-python-headless decord dashscope 'numpy<2' \
  'fastapi[standard]' 'requests>=2.32,<3'
mkdir -p "$HOME/nova-models"
""",
    )
    if speech:
        _run(
            studio,
            """
set -e
python -m pip install \
  openai-whisper HyperPyYAML onnxruntime inflect wetext omegaconf \
  conformer hydra-core lightning rich gdown matplotlib wget pyarrow \
  pyworld librosa modelscope GitPython
""",
        )


def _download_model(studio: Studio, speech: bool) -> None:
    repo = "Wan-AI/Wan2.2-S2V-14B" if speech else "Wan-AI/Wan2.2-TI2V-5B"
    directory = "Wan2.2-S2V-14B" if speech else "Wan2.2-TI2V-5B"
    _run(
        studio,
        f"""
set -e
python - <<'PY'
import os
from huggingface_hub import snapshot_download
snapshot_download(
    repo_id={repo!r},
    local_dir=os.path.expanduser({('~/nova-models/' + directory)!r}),
    local_dir_use_symlinks=False,
)
PY
""",
    )


def _public_url(deployment: Deployment) -> str:
    for attr in ("url", "public_url"):
        value = getattr(deployment, attr, None)
        if isinstance(value, str) and value.startswith("https://"):
            return value.rstrip("/")
    urls = getattr(deployment, "urls", None)
    if isinstance(urls, str) and urls.startswith("https://"):
        return urls.rstrip("/")
    if isinstance(urls, dict):
        for value in urls.values():
            if isinstance(value, str) and value.startswith("https://"):
                return value.rstrip("/")
    if isinstance(urls, (list, tuple)):
        for value in urls:
            if isinstance(value, str) and value.startswith("https://"):
                return value.rstrip("/")
    try:
        response = deployment.get("/health")
        response_url = str(getattr(response, "url", ""))
        if response_url.startswith("https://"):
            return response_url.rsplit("/health", 1)[0].rstrip("/")
    except Exception:
        pass
    return ""


def _deploy_one(name: str, speech: bool) -> str:
    studio = _studio(f"{name}-studio")
    studio.start(Machine.CPU)
    try:
        _base_setup(studio, speech=speech)
        _download_model(studio, speech=speech)

        machine = Machine.L4
        if speech:
            machine = getattr(Machine, "A100_80GB", None) or getattr(Machine, "H200")
        studio.switch_machine(machine)
        _run(studio, "python -c 'import torch; assert torch.cuda.is_available(); print(torch.cuda.get_device_name(0))'")

        deployment = _deployment(name)
        deployment.start(
            studio=studio,
            command="uvicorn nova_video_server:app --host 0.0.0.0 --port 8000",
            ports=[8000],
            health_check=HttpHealthCheck(path="/health", port=8000),
        )
        deployment.update(
            env=[
                Env(name="NOVA_VIDEO_WORKER_SECRET", value=SECRET),
                Env(name="NOVA_ENABLE_SPEECH", value="1" if speech else "0"),
                Env(name="NOVA_MODEL_ROOT", value="~/nova-models"),
                Env(name="WAN_CODE_DIR", value="~/Wan2.2"),
                Env(name="NOVA_WAN_SAMPLE_STEPS", value="24"),
                Env(name="NOVA_WAN_SPEECH_STEPS", value="20"),
            ]
        )

        url = _public_url(deployment)
        if not url:
            raise RuntimeError("Lightning deployment completed without a discoverable public URL")
        return url
    finally:
        try:
            studio.stop()
        except Exception:
            pass


def main() -> None:
    if not os.environ.get("LIGHTNING_USER_ID") or not os.environ.get("LIGHTNING_API_KEY"):
        raise SystemExit("LIGHTNING_USER_ID and LIGHTNING_API_KEY are required")
    if not SECRET:
        raise SystemExit("NOVA_VIDEO_WORKER_SECRET is required")

    result = {"normal": _deploy_one("nova-video-normal", speech=False), "speech": None, "speech_error": None}
    if DEPLOY_SPEECH:
        try:
            result["speech"] = _deploy_one("nova-video-speech", speech=True)
        except Exception as error:
            result["speech_error"] = str(error)[:1000]
            print(f"Speech deployment unavailable; normal Lightning worker remains active: {error}")

    Path("lightning-urls.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result))


if __name__ == "__main__":
    main()
