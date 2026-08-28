# NOVA Included Generation

This feature adds a branded acquisition layer without exposing the inference engine behind each NOVA experience.

## Public product names

Only these names are presented to users:

- `NOVA IMAGEM FREE`
- `NOVA VIDEO FREE`

The browser receives only NOVA model aliases (`nova-image-free`, `nova-video-free`). Provider endpoints and underlying model identifiers must remain server-side deployment configuration.

## Daily allowances

### Trial / free account

- NOVA IMAGEM FREE: 10 images per UTC day.
- NOVA VIDEO FREE: 3 videos per UTC day.
- Included video duration: 5 seconds.
- Included video resolution: 480p.

### Paid plans

- NOVA IMAGEM FREE: 10 images per UTC day by default.
- NOVA VIDEO FREE: 10 videos per UTC day.
- Included video durations: 5 or 10 seconds.
- Included video resolution: 480p.
- Paid users keep their normal premium credits/models in addition to this included pool.

All counters reset at 00:00 UTC. Failed included generations refund the user's daily allowance.

Override policy without changing source:

```bash
NOVA_FREE_IMAGE_DAILY_LIMIT=10
NOVA_FREE_VIDEO_DAILY_LIMIT=3
NOVA_FREE_VIDEO_MAX_SECONDS=5
NOVA_PAID_IMAGE_DAILY_LIMIT=10
NOVA_PAID_VIDEO_DAILY_LIMIT=10
NOVA_PAID_FREE_VIDEO_MAX_SECONDS=10
```

## Image zero-cost protection

The included image route is configured through server-only environment variables. Do not hard-code the underlying model identifier in client code or public documentation.

```bash
NOVA_IMAGE_FREE_ENGINE_MODEL=...
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_AI_API_TOKEN=...
```

`CLOUDFLARE_AI_API_TOKEN` is optional when the existing `CLOUDFLARE_API_TOKEN` already has the required Workers AI permission.

NOVA also applies a conservative application-level daily capacity cap to protect the account-level free inference allocation:

```bash
NOVA_CLOUDFLARE_IMAGE_DAILY_CAP=150
```

When that shared capacity is exhausted, NOVA stops the included image route until the daily reset instead of silently using a paid fallback.

## Video zero-cost requirement

`NOVA VIDEO FREE` is intentionally configured as zero-cost-only. It never silently falls back to a metered paid inference API.

The production zero-cost video worker is configured only through environment variables:

```bash
NOVA_ZERO_COST_VIDEO_URL=...
NOVA_ZERO_COST_VIDEO_SECRET=...
```

Until a production-capable zero-cost video worker is configured and tested, the route returns a controlled unavailable response. This is deliberate: NOVA must not create hidden inference spend just to keep the FREE badge online.

Expected worker contract:

```json
{
  "input": {
    "task": "text-to-video",
    "prompt": "...",
    "duration": 5,
    "resolution": "480p",
    "aspect_ratio": "16:9",
    "num_frames": 81,
    "frames_per_second": 16
  }
}
```

For image-to-video the worker also receives `image_url`. Paid-plan included video may request 10 seconds and receives the corresponding frame count.

## Security / white-label rules

- Client components import `publicGenerationCatalog.js`, which contains no provider endpoints.
- `/api/generate` resolves the private engine server-side.
- The client does not send provider endpoints.
- Included generation responses report the provider as `nova`.
- Included responses do not expose raw provider payloads.
- Generated filenames use NOVA names.
- Legacy provider-facing free IDs are rejected by server-side selection.
- Do not put the real underlying free engine/model ID in public source files, browser bundles, API docs, errors or analytics visible to end users.

## Product funnel

The included routes are acquisition/retention benefits, not replacements for the premium catalog. Users can start creating without credits, while paid plans continue to monetize higher-end models, higher resolution, larger volume and premium credits.
