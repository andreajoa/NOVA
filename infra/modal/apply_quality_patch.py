"""Apply production-safe quality fixes to the NOVA Modal video worker before deploy.

Why this exists:
- Wan2.2 TI2V-5B's upstream config uses 50 sampling steps and 121 frames (5s at 24fps).
- NOVA had been forcing 8 sampling steps and 241 frames for a 10s render.
- The deploy workflow patches the worker before Modal builds it, so these assertions make
  the production transformation explicit and fail closed if the worker shape changes.

This file is intentionally small and deterministic. Once the worker is consolidated,
these transformations can be moved directly into nova_video_worker.py.
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

    # A single native Wan TI2V segment is 5 seconds / 121 frames. For a requested
    # 10-second result we render two native segments and condition the second on
    # the final frame of the first. This keeps the model inside its intended
    # temporal regime instead of asking it for a single 241-frame diffusion pass.
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

    # Upstream Wan2.2 TI2V-5B defaults to 50 steps. Keep a quality floor so a
    # stale/incorrect secret can never silently push production back to 8 steps.
    steps = max(24, min(50, int(os.environ.get("NOVA_WAN_SAMPLE_STEPS", "50"))))
    seed = int(payload.get("seed") or int(time.time() * 1000) % 2_147_483_647)
    segment_count = 1 if duration <= 5 else 2
    print(
        f"[NOVA_VIDEO CONFIG] task={task} duration={duration}s segments={segment_count} "
        f"frames_per_segment={_frames(5)} steps={steps} aspect={aspect}",
        flush=True,
    )

    try:
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
                reference = tmp / "source-last-frame.png"
                _download(str(payload.get("source_video_url") or ""), source_video)
                _extract_last_frame(source_video, reference)

            _run_normal_segment(
                prompt=prompt,
                aspect=aspect,
                frames=_frames(5),
                steps=steps,
                seed=seed,
                output=first,
                reference=reference,
            )

            result = first
            if duration > 5:
                second_reference = tmp / "segment-1-last-frame.png"
                second = tmp / "segment-2.mp4"
                stitched = tmp / "segment-10s.mp4"
                _extract_last_frame(first, second_reference)
                _run_normal_segment(
                    prompt=prompt,
                    aspect=aspect,
                    frames=_frames(5),
                    steps=steps,
                    seed=seed + 1,
                    output=second,
                    reference=second_reference,
                )
                _concat(first, second, stitched)
                result = stitched

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

    text = replace_once(
        text,
        'subprocess.run(command, cwd=str(WAN_CODE), check=True, timeout=14 * 60)',
        'subprocess.run(command, cwd=str(WAN_CODE), check=True, timeout=16 * 60)',
        "normal segment subprocess timeout",
    )
    text = replace_once(
        text,
        'timeout=18 * 60,\n    scaledown_window=60,',
        'timeout=30 * 60,\n    scaledown_window=60,',
        "normal Modal class timeout",
    )

    WORKER.write_text(text, encoding="utf-8")
    print("Applied NOVA Modal quality patch: 50-step capable, native 5s segments, 10s continuity.")


if __name__ == "__main__":
    main()
