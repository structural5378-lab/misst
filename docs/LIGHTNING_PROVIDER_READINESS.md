# MISST Lightning — Live Provider Readiness

This documents what the current lightning provider abstraction supports and what
is required to connect a **real** (production) lightning data source. It does NOT
invent provider capabilities — only describes the existing interface and the
ingestion methods the architecture already supports.

## Current state

- Active provider: **MOCK** (selected via the `LIGHTNING_PROVIDER` secret;
  defaults to `mock` when unset or not `live`).
- Mock strikes are generated on demand by admins via the `lightningDevAction`
  endpoint (`generate_random` / `generate_storm` / `replay_last_hour`). They
  exercise the **real** architecture end-to-end: entity create → realtime event →
  RadioScope marker + flash → alert evaluation. There is no fake frontend-only
  path.
- The live provider code path exists (`createLiveProvider`) but is not
  configured (no `LIGHTNING_API_URL` / `LIGHTNING_API_KEY`), so it degrades
  gracefully (returns `[]`, health = `not_configured`).

## Provider interface (contract)

Every provider must implement `LightningProvider` (see `base44/shared/lightning.ts`):

```ts
interface LightningProvider {
  name: string;
  getLatestStrikes(sinceMs: number): Promise<Strike[]>;   // incremental fetch
  getStrikeHistory(fromMs: number, toMs: number): Promise<Strike[]>;
  healthCheck(): Promise<{ ok: boolean; latencyMs?: number; detail?: string; rateLimit?: string }>;
}
```

A `Strike` is the normalized internal model: `{ id, provider_strike_id, latitude,
longitude, strike_time, provider, strike_type, intensity, metadata, processed }`.
Providers normalize their raw format into this shape (see `normalizeStrikes` for
the flexible field-name mapping already supported: `lat`/`latitude`,
`time`/`timestamp`/`detected_at`, `type`/`polarity`, `intensity`/`peak_current`,
array shapes `{strikes|data|features}`).

## Required credentials / configuration (secrets)

| Secret | Purpose | Required for live |
|---|---|---|
| `LIGHTNING_PROVIDER` | `mock` or `live` | yes (set to `live`) |
| `LIGHTNING_API_URL` | Provider REST endpoint (supports `{since}` placeholder) | yes |
| `LIGHTNING_API_KEY` | Bearer + `x-api-key` header auth | yes (if provider requires) |
| `LIGHTNING_MAX_STRIKES` | Max strikes per fetch (default 500) | optional |
| `LIGHTNING_REQUEST_TIMEOUT_MS` | Per-request timeout (default 8000) | optional |
| `LIGHTNING_RETRY_ATTEMPTS` | Exponential-backoff retries (default 3) | optional |
| `LIGHTNING_RATE_LIMIT_PER_MIN` | Client-side rate cap (default 600) | optional |

All secrets are server-side only (never exposed to the client) and are read via
the `secrets` runtime. Set them in **Dashboard → Secrets**.

## Ingestion methods

### 1. Polling (currently implemented for `live`)
`lightningPoll` (scheduled automation, every 5 min) calls
`provider.getLatestStrikes(sinceMs)` where `sinceMs` = the provider state's
`last_poll_at`. New strikes are deduped by `provider_strike_id` (DB + in-memory
cache), bulk-created with `processed: true`, and processed for alerts.

**Latency**: up to the poll interval (5 min) between provider detection and the
entity write. This is the main barrier to WeatherBug-style speed for a polled
live provider.

### 2. Webhook / push (architecture-ready, not wired)
For true realtime, a production provider that offers push delivery (webhook /
WebSocket / SSE) should write strikes directly to the `LightningStrike` entity
from a backend function exposed as an HTTP endpoint. The existing
`lightningOnStrike` **entity automation** (fires on every `LightningStrike`
create) already handles alert processing — so a webhook that simply creates the
strike record gets full realtime delivery for free (alert evaluation + the
frontend realtime subscription). No poller needed for push providers.

To add a push provider:
1. Create a backend function (e.g. `lightningWebhook`) that validates the
   provider's signature/auth, normalizes the payload into the `Strike` model, and
   calls `base44.entities.LightningStrike.create(...)`.
2. The entity create fires `lightningOnStrike` (alerts) and the platform realtime
   event (RadioScope marker + flash).
3. Set `LIGHTNING_PROVIDER` to the new provider name and register it in
   `PROVIDER_REGISTRY` (or skip the registry if it only pushes).

No other architecture changes are required — the realtime path is already
provider-agnostic.

## Expected update frequency

- Mock: on demand (admin dev panel).
- Live (polled): every 5 min (the `lightningPoll` schedule). Can be lowered, but
  polling is inherently latent.
- Live (push): provider-dependent (sub-second to seconds). This is the
  WeatherBug-style target. The architecture supports it; only the provider
  endpoint + credentials are missing.

## Rate limits

Enforced client-side via `LIGHTNING_RATE_LIMIT_PER_MIN` (default 600/min). The
provider's own rate-limit headers (`x-ratelimit-remaining`) are surfaced in
`LightningProviderState.rate_limit_status` for the admin status page. A push
provider sidesteps outbound rate limits entirely (it receives, not polls).

## Geographic coverage

Not constrained by the abstraction. The scope filter (50 mi around the active
community center) is applied at render/delivery time, not ingestion. A provider
may supply global strikes; only community-relevant ones are shown/alerted.

## Latency characteristics (event path)

- **Realtime event → RadioScope marker**: sub-second (platform realtime push;
  now merged into local state immediately via `useRealtimeLightningStrikes`).
- **Realtime event → flash overlay**: sub-second (Lighting Engine seam).
- **Provider detection → entity write**:
  - Mock: instant (admin action).
  - Live (polled): up to 5 min (poll interval).
  - Live (push): provider-dependent (target: <2 s).
- **Alert evaluation**: synchronous in `lightningOnStrike` (entity automation),
  fires on create — not gated by any poll.

## What is NOT invented here

This document does not claim compatibility with any specific commercial provider
(Vaisala, Earth Networks, Blitzortung, etc.). Provider-specific field mapping,
auth scheme, and push mechanism must be implemented against the real provider's
documented API when one is chosen. The abstraction is ready; the provider is not.