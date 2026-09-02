"""Apply the measured low-latency NOVA Modal profile before deployment.

Production evidence captured from Modal on 2026-09-02:
- L40S + 8 steps + 241 frames completed a 10s clip in 382.46s.
- L40S + 50 steps + 121 frames repeatedly hit the 960s subprocess timeout
  before even the first 5s segment completed.

The fast profile therefore prioritizes completed jobs and latency:
- H100 (80GB class) instead of L40S.
- Keep Wan TI2V-5B fully on GPU by removing CPU/offload flags.
- Single-pass generation for both 5s and 10s requests.
- Default 8 sampling steps, with a bounded 4..16 override range.

Wan's upstream documentation explicitly recommends removing offload_model,
convert_model_dtype and t5_cpu on GPUs with at least 80GB VRAM to speed up
TI2V-5B inference.
"""

from pathlib import Path


WORKER = Path("infra/modal/nova_video_worker.py")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


def main() -> None:
    text = WORKER.read_text(encoding="utf-8")

    start = text.index("def _normal_generate(payload: dict) -> str:\n")
    end = text.index("\ndef _speech_generate(payload: dict) -> str:\n", start)

    normal_generate = '''def _normal_generate(payload: dict) -> str:
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

    # 8 steps is the only profile measured end-to-end on this stack that has
    # already completed a real 10-second production render. Keep the override
    # bounded so an accidental 50-step secret cannot silently break latency again.
    steps = max(4, min(16, int(os.environ.get("NOVA_WAN_SAMPLE_STEPS", "8"))))
    seed = int(payload.get("seed") or int(time.time() * 1000) % 2_147_483_647)
    frames = _frames(duration)
    print(
        f"[NOVA_VIDEO CONFIG] profile=h100-fast task={task} duration={duration}s "
        f"segments=1 frames={frames} steps={steps} aspect={aspect}",
        flush=True,
    )

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
                frames=frames,
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
'''

    text = text[:start] + normal_generate + text[end:]

    # On an H100 the 5B model fits in GPU memory. Wan upstream recommends removing
    # these flags on >=80GB VRAM because CPU offload/T5-on-CPU materially slows inference.
    text = replace_once(
        text,
        '        "--ckpt_dir", str(TI2V_DIR),\n        "--offload_model", "True",\n        "--convert_model_dtype",\n        "--t5_cpu",\n',
        '        "--ckpt_dir", str(TI2V_DIR),\n',
        "normal Wan H100 full-GPU execution",
    )

    text = replace_once(
        text,
        '    gpu="L40S",\n',
        '    gpu="H100",\n',
        "normal Modal GPU",
    )

    # Four containers allow multiple users to make progress without serializing all
    # video jobs behind one or two long-running renders.
    text = replace_once(
        text,
        '    max_containers=2,\n)\nclass NovaWanVideo:',
        '    max_containers=4,\n)\nclass NovaWanVideo:',
        "normal Modal container cap",
    )

    # Add a CLI-only benchmark function. It is not exposed through the web endpoint
    # and lets CI measure the exact deployed inference stack without R2/callback noise.
    benchmark_anchor = '@app.function(image=base_image, gpu="L4", timeout=120, memory=8192)\ndef smoke_import():'
    benchmark = '''@app.function(
    image=base_image,
    gpu="H100",
    cpu=4.0,
    memory=65536,
    volumes={str(MODEL_ROOT): model_volume},
    timeout=14 * 60,
)
def benchmark_fast_normal(duration: int = 5, steps: int = 8):
    _prepare_normal_wan_runtime()
    _ensure_model(TI2V_REPO, TI2V_DIR)
    duration = max(5, min(10, int(duration)))
    steps = max(4, min(16, int(steps)))
    with tempfile.TemporaryDirectory() as tmpdir:
        output = Path(tmpdir) / "benchmark.mp4"
        started = time.time()
        _run_normal_segment(
            prompt="A natural cinematic close-up of a person walking through a softly lit room, realistic motion, documentary style",
            aspect="9:16",
            frames=_frames(duration),
            steps=steps,
            seed=20260902,
            output=output,
        )
        elapsed = time.time() - started
        result = {
            "ok": output.exists() and output.stat().st_size > 0,
            "duration": duration,
            "steps": steps,
            "frames": _frames(duration),
            "seconds": round(elapsed, 2),
            "bytes": output.stat().st_size if output.exists() else 0,
        }
        print(f"[NOVA_VIDEO BENCHMARK] {result}", flush=True)
        return result


@app.function(image=base_image, gpu="L4", timeout=120, memory=8192)
def smoke_import():'''
    text = replace_once(text, benchmark_anchor, benchmark, "benchmark insertion")

    WORKER.write_text(text, encoding="utf-8")
    print("Applied NOVA fast profile: H100, full-GPU Wan, single-pass, 8-step default.")


if __name__ == "__main__":
    main()
