# MISST Lightning — Provider Readiness (Vaisala NLDN Target)

This documents MISST's lightning provider architecture, the three ingestion modes,
and what remains to connect a real-time feed. It does **not** assume any undocumented
provider behavior. The intended production candidate is **Vaisala NLDN** (U.S.
real-time lightning, ~12-second published provider latency, per-strike location /
type / duration / polarity / peak current). No live Vaisala credentials are
configured and no Vaisala-specific API behavior has been assumed.

## 1. Current provider = MOCK

- Active provider: **MOCK**, selected via the `LIGHTNING_PROVIDER` secret (defaults
  to `mock` when unset or any value other than `live`).
- Mock strikes are generated on demand by admins via `lightningDevAction`
  (`generate_random` / `generate_storm` / `replay_last_hour`). They exercise the
  **real** architecture end-to-end: entity create → realtime event → RadioScope
  marker + flash → alert evaluation. There is no fake frontend-only path.
- The pull-based live provider code path exists (`createLiveProvider`) but is **not
  configured** (no `LIGHTNING_API_URL` / `LIGHTNING_API_KEY`); it degrades
  gracefully (returns `[]`, health = `not_configured`).

## 2. Pull provider remains available

`lightningPoll` (scheduled automation, every 5 min) calls
`provider.getLatestStrikes(sinceMs)` for the `live` provider. New strikes are
deduped by `provider_strike_id` (DB + in-memory cache), bulk-created, and processed
for alerts. This path is unchanged and serves any pull-only HTTP provider. Its
latency is bounded by the 5-minute poll interval — not WeatherBug-style.

## 3. Realtime webhook is ready

`lightningWebhook` is the push ingestion endpoint. A push-capable provider POSTs
strikes the instant it detects them; the function authenticates (shared secret,
fail-closed), normalizes via the shared `normalizeStrikeArray`, dedupes by
`provider_strike_id`, and `bulkCreate`s with `processed: false`. The existing
architecture then delivers with no polling:

- `LightningStrike` create → platform realtime "create" event → RadioScope + Lighting Engine
- `LightningStrike` create → `lightningOnStrike` entity automation → alert evaluation + push

`LIGHTNING_WEBHOOK_SECRET` authenticates the endpoint (header
`x-lightning-webhook-secret` or `Authorization: Bearer <secret>`). Fail-closed:
unset secret → 503; mismatched/missing → 401. Authentication is not weakened.

## Provider interface (contract)

Every pull provider implements `LightningProvider` (`base44/shared/lightning.ts`):

```ts
interface LightningProvider {
  name: string;
  getLatestStrikes(sinceMs: number): Promise<Strike[]>;          // incremental fetch
  getStrikeHistory(fromMs: number, toMs: number): Promise<Strike[]>;
  healthCheck(): Promise<{ ok: boolean; latencyMs?: number; detail?: string; rateLimit?: string }>;
}
```

Push providers do **not** implement this interface — MISST does not call them;
they call MISST via `lightningWebhook`. The interface supports pull/history/health;
the webhook supports realtime push. Both write to the same `LightningStrike` entity
and share one normalizer, so downstream behavior (realtime event, alert
automation, RadioScope, Lighting Engine) is identical regardless of ingress.

`Strike` (normalized internal model): `{ id, provider_strike_id, latitude,
longitude, strike_time, provider, strike_type, intensity, metadata, processed }`.
Provider-specific extras (polarity, duration, peak current) are carried in the
`metadata` JSON — they are not invented when absent.

## Shared normalizer — fields accommodated

`normalizeStrikeArray(data, maxStrikes, provider)` maps flexible provider field
names into the `Strike` model. All fields except lat/lon are optional (missing
values are not invented):

| MISST field | Provider field aliases accepted |
|---|---|
| provider_strike_id | `id` / `strikeId` / `uuid` / `provider_strike_id` (composite lat,lon,time if absent) |
| latitude | `latitude` / `lat` / `Latitude` |
| longitude | `longitude` / `lon` / `lng` / `Longitude` |
| strike_time | `time` / `timestamp` / `utc_time` / `dateTime` / `detected_at` / `strike_time` |
| strike_type (lightning type) | `type` / `stroke_type` / `lightning_type` / `flash_type` |
| intensity / peak current | `intensity` / `peak_current` / `peakCurrent` |
| polarity (→ metadata) | `polarity` / `polarity_sign` |
| duration (→ metadata) | `duration` / `duration_ms` |
| provider | pass-through parameter (default `live`) |
| metadata | structured JSON: `{ raw, polarity?, duration_ms?, peak_current? }` |

Polarity is deliberately separate from `strike_type` (lightning type) — they are
distinct concepts (type = CG/IC/etc.; polarity = positive/negative). Array payload
shapes accepted: bare array, `{ strikes: [...] }`, `{ data: [...] }`,
`{ features: [...] }`.

## Required credentials / configuration (secrets)

Only variables required by the existing architecture are listed. No fake values.

| Secret | Purpose | Required for |
|---|---|---|
| `LIGHTNING_PROVIDER` | `mock` (default) or `live` (pull) | selecting mock vs pull |
| `LIGHTNING_API_URL` | Pull provider REST endpoint (supports `{since}` placeholder) | pull provider |
| `LIGHTNING_API_KEY` | Pull provider auth (Bearer + `x-api-key`) | pull provider (if it requires auth) |
| `LIGHTNING_WEBHOOK_SECRET` | Authenticates the push webhook (fail-closed) | push provider |
| `LIGHTNING_MAX_STRIKES` | Max strikes per fetch/batch (default 500) | optional |
| `LIGHTNING_REQUEST_TIMEOUT_MS` | Per-request timeout (default 8000) | optional (pull) |
| `LIGHTNING_RETRY_ATTEMPTS` | Exponential-backoff retries (default 3) | optional (pull) |
| `LIGHTNING_RATE_LIMIT_PER_MIN` | Client-side rate cap (default 600) | optional (pull) |

All secrets are server-side only, read via the `secrets` runtime. Set them in
**Dashboard → Secrets**. A push provider (e.g. Vaisala realtime) needs only
`LIGHTNING_WEBHOOK_SECRET` (plus pointing the provider at the webhook URL); it does
not need `LIGHTNING_API_URL`/`KEY` unless it also offers a pull API.

## Failure handling (already covered by the architecture)

| Failure | Handling |
|---|---|
| Duplicate strikes | Dedupe by `provider_strike_id` (DB filter) in webhook + poller; `LightningAlertDelivery` dedupe for alerts |
| Malformed payloads | `req.json().catch(() => null)` → 400; invalid rows skipped by normalizer |
| Invalid coordinates | `isFinite(lat/lon)` check → row skipped |
| Invalid timestamps | `isFinite(t)` check → row skipped |
| Provider outages | Pull: retry w/ exponential backoff + `LightningProviderState` health tracking. Push: provider stops sending; no stale data served (realtime is event-driven) |
| Authentication failures | Webhook fail-closed: unset secret → 503, mismatched → 401 |
| Temporary network failures | Pull: retry with backoff (3 attempts) |
| Provider rate limits | Pull: client-side `LIGHTNING_RATE_LIMIT_PER_MIN` + provider `x-ratelimit-remaining` surfaced in state |
| Replayed webhook events | Dedupe by `provider_strike_id` (provider must send stable ids) |

No undocumented provider-specific behavior is implemented.

## Expected latency (architecture, not a current MISST measurement)

Vaisala publishes ~12-second NLDN provider latency. That is a **provider
characteristic**, not a current MISST measurement. MISST's end-to-end path once a
strike is ingested:

```
Provider detection
  → provider delivery method (pull: ≤5 min poll; push: provider-dependent)
  → MISST ingestion (lightningPoll | lightningWebhook)
  → shared normalizer + duplicate protection
  → LightningStrike entity create
  → realtime "create" event
  ├── RadioScope (marker, realtime-first)
  ├── Lighting Engine (flash overlay)
  └── Alert system (lightningOnStrike entity automation → push)
```

- **Mock**: instant (admin action → entity create → realtime + automation same tick).
- **Pull provider**: up to 5 min (poll interval) + HTTP + processing.
- **Push provider via webhook**: ~1 second (one HTTP POST → entity create → realtime
  event + automation), **plus the provider's own detection-to-delivery latency**
  (e.g. NLDN's published ~12 s). The MISST-internal portion is sub-second.

Database persistence is the **record** (history, replay, analytics), not the
**discovery** mechanism — downstream consumers subscribe to the realtime event
fired by the create, not to a DB poll.

## 4. Vaisala NLDN readiness

MISST is architecturally ready for a Vaisala NLDN real-time feed:

- The push path (`lightningWebhook`) accepts per-strike JSON with flexible field
  names covering NLDN's published fields (location, type, duration, polarity, peak
  current).
- The shared normalizer carries polarity + duration in metadata without inventing
  them when absent.
- Duplicate protection, fail-closed auth, and the full realtime downstream
  (RadioScope, Lighting Engine, alerts) are already wired.
- No `LightningStrike` entity change is required — polarity/duration ride in
  `metadata`.

What is **not** done (intentionally): no Vaisala-specific adapter is registered, no
Vaisala endpoint/credential/protocol is assumed, and no live connection is made.

## 5. No live Vaisala credentials are configured

`LIGHTNING_PROVIDER` is unset (→ mock). No `LIGHTNING_API_URL`/`KEY` and no
Vaisala-specific secret exist. The webhook secret is set but no provider is pointed
at it.

## 6. No undocumented Vaisala API behavior assumed

Vaisala's public description (U.S. real-time, ~12 s latency, per-strike
location/type/duration/polarity/peak current) is noted as a target only. The actual
delivery method (webhook vs SSE vs WebSocket vs polled REST), auth scheme, payload
schema, and rate limits are **not assumed** — they must come from the official
Vaisala feed/API specification.

## 7. Remaining step

Obtain the official Vaisala NLDN feed/API specification and credentials. Then:
1. Confirm the delivery method. If push → point Vaisala at the `lightningWebhook`
   URL with the shared-secret header (no code change expected; field aliases already
   cover the published fields). If pull → set `LIGHTNING_PROVIDER=live`,
   `LIGHTNING_API_URL`, `LIGHTNING_API_KEY` and adjust the poll interval if needed.
2. If Vaisala's payload uses field names not already aliased, add the aliases to
   `normalizeStrikeArray` (one place).
3. Verify with the mock provider, then switch the secret to enable the live path.

## NOAA GOES-19 GLM (free development provider)

A free, public lightning source is wired as a development provider alongside the
mock and pull paths:

NOAA GOES-19 GLM L2 LCFA (S3 `noaa-goes19`, AWS Open Data) -> AWS Lambda relay ->
`lightningWebhook` -> `normalizeStrikeArray` -> `LightningStrike` -> existing realtime
event (RadioScope + Lighting Engine) + `lightningOnStrike` alerts.

- Product: GLM L2 LCFA flashes (NetCDF4), one file per 20-second window, ~20 s NOAA
  product latency. Optical total-lightning detection (IC + CC + CG) — does NOT
  classify ground strikes, has NO polarity or peak current.
- Provider slug: `noaa_glm`. `strike_type` = `total_lightning`. `provider_strike_id` =
  `glm-<flash_id>` (stable per-flash ID -> webhook dedupe is idempotent).
- Geographic filter: configurable bbox (default South Florida) applied in the relay
  before POST; MISST never receives the full Western Hemisphere.
- Position accuracy ~8-14 km (satellite optical); RadioScope shows flash centroids,
  not ground-stroke points. Do not imply NLDN precision.
- Attribution: "Lightning data: NOAA GOES-R Geostationary Lightning Mapper" shown in
  RadioScope. NOAA data is public (NODD); attribution requested, no endorsement
  implied.
- The relay is an external AWS Lambda (see `aws/noaa-glm-relay/`); MISST ingestion is
  the existing webhook — no LightningStrike / RadioScope / Lighting Engine / alert
  changes. A native MISST poller is NOT used (Base44's 5-min automation floor cannot
  meet the 20-second cadence).
- NetCDF variable names follow the GOES-R L2 LCFA Product Definition; confirm against
  a real file via `aws/noaa-glm-relay/self_test.py` before relying on them.

## What is NOT invented here

No compatibility with any specific commercial provider is claimed. Provider-specific
field mapping, auth scheme, and push mechanism must be implemented against the real
provider's documented API when one is chosen. The abstraction is ready; the provider
is not connected.