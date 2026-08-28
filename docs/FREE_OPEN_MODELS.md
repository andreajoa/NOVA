# NOVA Included Generation

This feature adds a branded acquisition layer without exposing the inference engine behind each NOVA experience.

## Public product names

Only these names are presented to users:

- `NOVA IMAGEM FREE`
- `NOVA VIDEO FREE`

The browser receives only NOVA aliases (`nova-image-free`, `nova-video-free`). Provider endpoints and underlying model identifiers are server-side deployment configuration.

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

### Admin

- Existing NOVA admin detection is authoritative.
- Admin bypasses per-user included quotas and sees `Ilimitado`.
- Existing premium/admin access remains unchanged.

All non-admin user counters reset at 00:00 UTC. A request that cannot be enqueued is refunded automatically.

Policy overrides:

```bash
NOVA_FREE_IMAGE_DAILY_LIMIT=10
NOVA_FREE_VIDEO_DAILY_LIMIT=3
NOVA_FREE_VIDEO_MAX_SECONDS=5
NOVA_PAID_IMAGE_DAILY_LIMIT=10
NOVA_PAID_VIDEO_DAILY_LIMIT=10
NOVA_PAID_FREE_VIDEO_MAX_SECONDS=10
```

## Image included-capacity protection

NOVA IMAGEM FREE calls Workers AI directly from the server. The browser never receives the engine identifier or Cloudflare credentials.

```bash
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_AI_API_TOKEN=...
NOVA_IMAGE_FREE_ENGINE_MODEL=...
NOVA_CLOUDFLARE_IMAGE_DAILY_CAP=150
```

`CLOUDFLARE_AI_API_TOKEN` may fall back to the existing `CLOUDFLARE_API_TOKEN` when it has Workers AI permission. NOVA never switches the included route to a metered provider after the protected daily capacity has been consumed.

## NOVA VIDEO

NOVA VIDEO uses a dedicated asynchronous route instead of holding a Vercel request open during GPU inference.

Flow:

1. `/api/free-video-generate` authenticates the dashboard user, validates duration/mode, checks live worker health and reserves quota.
2. NOVA creates a private job record and a pre-signed Cloudflare R2 upload target.
3. The GPU worker acknowledges immediately and generates in a durable background invocation.
4. The worker uploads the MP4 directly to R2; large video bytes never traverse Vercel.
5. The worker calls `/api/internal/free-video-callback` with a one-time job token.
6. The UI polls `/api/free-video-status` until completion/failure. Stale jobs are failed safely and user quota is refunded.

Supported user modes:

- Text to Video
- Image to Video
- Continue Video

Continuation extracts the last frame of the existing NOVA-owned video, generates another segment, concatenates both clips and returns one longer MP4. Each continuation counts as another daily generation for non-admin users.

The worker is configured only through deployment secrets:

```bash
NOVA_ZERO_COST_VIDEO_URL=...
NOVA_ZERO_COST_VIDEO_SECRET=...
```

The NOVA app also maintains a global included-video compute guard. A 10-second request consumes two 5-second capacity units:

```bash
NOVA_VIDEO_INCLUDED_DAILY_CAP_UNITS=30
```

This global guard is separate from user quotas and prevents the acquisition feature from silently turning into uncapped infrastructure spend. Admin bypasses user quotas; premium models remain available independently.

## Modal deployment adapter

`infra/modal/nova_video_worker.py` is a provider adapter. The model repositories are deployment secrets, not client configuration:

```bash
MODAL_TOKEN_ID=...
MODAL_TOKEN_SECRET=...
NOVA_VIDEO_T2V_MODEL_REPO=...
NOVA_VIDEO_I2V_MODEL_REPO=...
NOVA_VIDEO_WORKER_SECRET=...
```

The GitHub workflow creates the private Modal secret and deploys the adapter. The NOVA application itself only knows the resulting private worker URL and shared secret.

## Security / white-label rules

- Client components import `publicGenerationCatalog.js`, which contains no provider endpoints.
- The generic `/api/generate` accepts NOVA IMAGEM FREE but rejects NOVA VIDEO FREE; included video is dashboard-only and async.
- The client does not choose provider endpoints.
- Included responses identify the provider only as `nova`.
- Raw provider payloads are not returned for included generation.
- Generated filenames use NOVA names.
- Legacy provider-facing free IDs are rejected by server-side selection.
- Video continuation accepts only NOVA-owned R2 source videos, preventing arbitrary server-side URL fetching.

## Product funnel

Included routes are acquisition/retention benefits, not replacements for the premium catalog. Users can start creating without premium credits, while paid plans monetize higher-end models, higher resolution, larger volume and premium credits.
