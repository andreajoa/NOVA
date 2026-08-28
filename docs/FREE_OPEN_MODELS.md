# NOVA Free/Open Models

This feature adds a controlled free acquisition layer without removing NOVA's premium catalog.

## Product strategy

Free users can start creating immediately with lower-cost open-weight models. Premium models, higher resolution, larger volume and paid-plan credits remain the monetization path.

Default free starter pool (shared across the free models and lifetime-based per account):

- Images: 10 starter generations per signed-in account.
- Video: 1 starter generation per signed-in account.
- Free image output: one image per request, capped around 1 MP / 1K.
- Free video output: Wan 2.1, 5 seconds, 480p, 81 frames.
- NOVA API requests are never free: API-key requests keep using the API credit wallet.
- Admin requests bypass the user quota.
- A failed free generation is refunded to the user's free quota.

Override the acquisition budget with environment variables:

```bash
NOVA_FREE_IMAGE_LIMIT=10
NOVA_FREE_VIDEO_LIMIT=1
```

The default limits are lifetime starter allowances rather than monthly allowances. That prevents a non-paying account from creating recurring provider cost forever and makes the free models a conversion funnel instead of a permanent subsidy.

## Models

### Image

- `flux-schnell` — FLUX.1 Schnell · FREE
  - Preferred provider: RunPod when configured.
  - High-availability fallback: `fal-ai/flux/schnell`.
  - 4 inference steps, one image, ~1K max in the free path.

- `z-image-turbo` — Z-Image Turbo · FREE
  - Text-to-image: `fal-ai/z-image/turbo`.
  - Image-to-image: `fal-ai/z-image/turbo/image-to-image`.
  - RunPod hook is available through `RUNPOD_ENDPOINT_Z_IMAGE` for a compatible NOVA worker.

### Video

- `wan21-free` — Wan 2.1 · FREE
  - Text-to-video fallback: `fal-ai/wan-t2v`.
  - Image-to-video fallback: `fal-ai/wan-i2v`.
  - Free route forces 480p / 81 frames / ~5 seconds.
  - RunPod hook is available through `RUNPOD_ENDPOINT_WAN21` for a compatible NOVA worker.

Wan 2.2 remains in the premium catalog deliberately. The free model is the acquisition experience; Wan 2.2, Seedance, Kling, Veo and the other premium models remain upgrade incentives.

## Provider routing and reliability

The browser no longer decides which provider endpoint the server executes. It sends `model` and `mode`; `/api/generate` resolves the approved endpoint from NOVA's server-side model catalog.

For free/open models the order is:

1. RunPod, if the compatible endpoint and `RUNPOD_API_KEY` are configured.
2. fal.ai fallback, using `FAL_KEY`.
3. If neither provider can return media, the request fails with HTTP 503 and the dashboard free quota is refunded.

This gives NOVA a migration path from acquisition spend on fal.ai to lower-cost self-hosted inference without changing the UI or model IDs.

## FLUX Schnell on RunPod

The repository includes the official RunPod/ComfyUI-compatible FLUX Schnell workflow in code (`src/lib/openModelWorkflows.js`). It uses the model filenames from RunPod's official `worker-comfyui` FLUX.1 Schnell build:

- `flux1-schnell.safetensors`
- `t5xxl_fp8_e4m3fn.safetensors`
- `clip_l.safetensors`
- `ae.safetensors`

Configure:

```bash
RUNPOD_API_KEY=...
RUNPOD_ENDPOINT_FLUX_SCHNELL=...
```

The RunPod Serverless endpoint should use the official ComfyUI FLUX Schnell worker/build or an equivalent image containing those exact model files and standard ComfyUI nodes.

Keep minimum workers at 0 while traffic is small so idle GPU time does not erase NOVA's margin. Increase warm workers only after real demand justifies it.

## Optional custom RunPod workers

These variables are supported for compatible NOVA workers:

```bash
RUNPOD_ENDPOINT_Z_IMAGE=...
RUNPOD_ENDPOINT_WAN21=...
```

The generic NOVA worker input contracts are:

Image:

```json
{
  "model": "z-image-turbo",
  "task": "text-to-image",
  "prompt": "...",
  "width": 1024,
  "height": 1024,
  "num_outputs": 1
}
```

Video:

```json
{
  "model": "wan21-free",
  "task": "text-to-video",
  "prompt": "...",
  "duration": 5,
  "resolution": "480p",
  "aspect_ratio": "16:9",
  "num_frames": 81,
  "frames_per_second": 16
}
```

If these custom endpoints are absent or fail, the server automatically falls back to fal.ai.

## Profit protection

The free limits are intentionally separate from NOVA's paid credit wallet. Do not advertise them as unlimited.

The default fallback acquisition cost is tightly bounded because:

- FLUX Schnell free generation is capped to one ~1 MP image.
- Z-Image Turbo free generation is capped to one ~1 MP image.
- Wan 2.1 free video is capped to one 480p starter generation per account by default.
- API/Claude usage still consumes purchased API credits.
- Premium video remains credit-priced.

Monitor conversion and provider spend before increasing the free limits.
