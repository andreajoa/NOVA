"""Apply NOVA's measured high-memory GPU execution profile before deploy.

This patch intentionally changes only infrastructure/runtime knobs. It must not
replace _normal_generate(), because that function now contains NOVA's complex
multi-shot director, deterministic captions and narration post-production.
"""

from pathlib import Path


WORKER = Path("infra/modal/nova_video_worker.py")


def replace_if_present(text: str, old: str, new: str) -> str:
    return text.replace(old, new, 1) if old in text else text


def main() -> None:
    text = WORKER.read_text(encoding="utf-8")

    # H100 has enough VRAM for the 5B Wan profile without CPU model/T5 offload.
    text = replace_if_present(
        text,
        '        "--ckpt_dir", str(TI2V_DIR),\n'
        '        "--offload_model", "True",\n'
        '        "--convert_model_dtype",\n'
        '        "--t5_cpu",\n',
        '        "--ckpt_dir", str(TI2V_DIR),\n'
        '        "--offload_model", "False",\n',
    )
    text = replace_if_present(text, '    gpu="L40S",\n', '    gpu="H100",\n')
    text = replace_if_present(
        text,
        '    max_containers=2,\n)\nclass NovaWanVideo:',
        '    max_containers=4,\n)\nclass NovaWanVideo:',
    )

    WORKER.write_text(text, encoding="utf-8")
    print("Applied NOVA quality profile: H100, full-GPU Wan execution, director preserved.")


if __name__ == "__main__":
    main()
