# MISST V2 Architecture

**Status:** Target architecture for the `misst-v2` branch  
**Source of truth:** Current repository layout plus the read-only Base44-exit assessment  
**Rule for this branch:** Do not delete or rewrite existing MISST functionality. Keep Base44 working until each replacement is verified. Production deployment stays on Base44 until the final cutover.

This document describes **where MISST V2 is going**. It is not a license to rip out the current stack. The live application remains a React SPA on Base44 until each subsystem below has a working MISST-owned replacement and a rollback path.

---

## 1. Current baseline (do not discard)

MISST today is a GMRS community platform (repeaters, maps, nets / Mission Control, chat, forum, weather / lightning, radio files, galleries, marketplace, multi-community tenancy, platform admin).

```
Browser (Vite + React 18 SPA)
  → src/api/mist facade
      → @base44/sdk  (auth, entities, functions, integrations)
      → optional MISST Core when VITE_MIST_CORE_API_URL is set
  → Firebase Cloud Messaging (/public/sw.js)
  → MyBB PHP bridge (https://insomniacsgmrs.com/mist-api.php) — forum / SSO / stats, not the UI session
  → OpenWeather, RepeaterBook, RainViewer, NWS radar
  → AWS Lambda NOAA GLM relay → lightningWebhook
```

**Already in the repo (reuse, do not replace blindly):**

| Piece | Location | Role in V2 |
|---|---|---|
| Frontend SPA | `src/pages`, `src/components`, `src/hooks`, `src/lib` | Preserve UI |
| Unified API facade | `src/api/mist` | Hybrid routing during migration |
| Core client | `src/api/mist/core/*` | JWT + REST when Core URL is set |
| Core backend scaffold | `src/backend` | Express modular monolith |
| Entity schemas | `base44/entities/*.jsonc` (66 entities) | Source for Postgres mapping |
| Generated SQL | `src/backend/db/schema.sql`, `migrations/001_auth.sql`, `002_entities.sql` | Starting point — needs FKs + PostGIS |
| 93 Deno functions | `base44/functions/*/entry.ts` | Business logic to port, not delete |
| Shared backend logic | `base44/shared/*` (RBAC, notifications, FCM, lightning, community access) | Port into Node services |
| NOAA GLM relay | `aws/noaa-glm-relay` | Keep; retarget webhook URL |
| API target docs | `docs/api/*` | Dedicated domain APIs (final shape) |

**Hybrid gate already implemented:** `VITE_MIST_CORE_API_URL`. When unset, everything stays on Base44. When set, auth, generic entity CRUD, and four community-membership functions can route to Core. Core entity `subscribe()` is currently a no-op — realtime must be rebuilt before Core entities are enabled in production.

---

## 2. Target architecture overview

```
                    ┌─────────────────────────────────────┐
                    │  React 18 + Vite + Tailwind SPA      │
                    │  Existing pages / components         │
                    │  mist.* facade (Base44 until ready)  │
                    └─────────────────┬───────────────────┘
                                      │ HTTPS
                                      │ REST + WebSocket
                    ┌─────────────────▼───────────────────┐
                    │  MISST Core — Node.js / TypeScript   │
                    │  Express modular monolith            │
                    │  REST /api  ·  WS /ws  ·  workers    │
                    └─┬──────────┬──────────┬─────────────┘
                      │          │          │
              ┌───────▼──┐ ┌─────▼────┐ ┌───▼────────────┐
              │ PostgreSQL│ │ S3-compat│ │ SMTP / SES    │
              │ + PostGIS │ │ object   │ │ FCM           │
              │           │ │ storage  │ │ optional MyBB │
              └───────────┘ └──────────┘ │ OpenWeather   │
                                         │ RepeaterBook  │
                                         │ RainViewer/NWS│
                                         │ NOAA GLM      │
                                         │ AI providers  │
                                         └───────────────┘
```

**Final production** (Phase 8+): no Base44 SDK, no Base44 functions, no Base44 hosting, no Base44 auth, no Base44 UploadFile / SendEmail / InvokeLLM / GenerateImage. Until then, Base44 remains the production runtime.

---

## 3. FRONTEND

### 3.1 Stack (unchanged)

- React 18 (`src/main.jsx`, `src/App.jsx`)
- Vite 6
- Tailwind 3 + shadcn/ui (Radix, New York style)
- React Router v6
- TanStack Query 5
- Leaflet / react-leaflet, Turf, existing map stack

### 3.2 Preservation rule

Existing MISST pages, layouts, and components are **assets**, not legacy to throw away. Calculators, RadioScope UI, Mission Control V2, messaging hub, community shells, platform admin chrome, account/profile, weather, and theme system stay unless a specific screen is proven unused.

### 3.3 Base44 frontend infrastructure

Do **not** remove these until the named replacement is verified:

| Current | Replacement | Remove when |
|---|---|---|
| `@base44/sdk` + `src/api/base44Client.js` | Core HTTP + WS clients behind `mist` | All facades route to Core |
| `@base44/vite-plugin` | Standard Vite React plugin only | Local/prod builds no longer need Studio HMR / visual edit |
| `AuthContext` public-settings bootstrap (`/api/apps/public/...`) | Core `/api/auth/me` path (already sketched) | Core auth is the only login |
| `app-params.js` (`base44_*` localStorage, URL `access_token`) | `mist_core_*` tokens only | Base44 session gone |
| `mist.integrations.Core.UploadFile` | `mist.media.upload` | Storage Phase 4 |
| `InvokeLLM` / `GenerateImage` | `mist.ai.*` | AI provider live |
| `media.base44.com` asset URLs | MISST CDN / object storage | Assets copied and rewritten |
| `OAuthConsent.jsx` / MCP `/api/apps/:id/mcp/*` | Drop or replace if MCP is still required | Platform MCP unused |

The `mist` facade is the **only** place the rest of the UI should learn about backends. Pages keep `import { mist } from '@/api/mist'`.

### 3.4 PWA

- Commit a real `manifest.json` (today `index.html` links `/manifest.json` but it is not in `public/`).
- Keep `public/sw.js` as the FCM worker; do not turn it into an offline-cache experiment until hardening.
- Keep `InstallBanner` and badge sync.

---

## 4. BACKEND

### 4.1 Stack

- Node.js
- TypeScript
- Express
- Modular monolith (API → services → repositories → PostgreSQL)
- REST under `/api`
- WebSocket server on `/ws` (same HTTP process initially; split later only if needed)
- Worker / job system (separate process or in-process scheduler with durable jobs)

Layering already described in `src/backend/README.md` is the target. Completing missing modules is the work; inventing a second backend is not.

### 4.2 Module map (target)

| Module | Responsibility | Today |
|---|---|---|
| Auth | Register, login, OTP, reset, sessions, Google OAuth | Partial (`src/backend/auth`, `api/routes/auth.routes.ts`) |
| Users / profiles | `me`, profile fields, callsign | Partial |
| Entities compatibility | Generic CRUD mirroring Base44 during migration | Implemented; **temporary** |
| Communities / membership | Tenancy, join/leave, staff, roles | Membership REST started; rest still Deno |
| Chat | Rooms, DMs, presence, attachments metadata | Deno + entity subscribe |
| Nets / Mission Control | Sessions, check-ins, queue, incidents, timeline | Deno + entities |
| Repeaters / RadioScope / maps | Directory, geo search, geofences, location share | Deno + Leaflet client |
| Notifications | In-app, FCM, email, preferences, delivery log | Deno shared `notifications.ts` |
| Weather / lightning | OpenWeather proxy, strike ingest, alerts | Deno + AWS relay |
| Forum | Native forum entities; optional MyBB adapter | Native entities in UI; MyBB still bridged |
| Media | Upload, delete, signed URLs, thumbnails | Base44 `UploadFile` |
| Admin / RBAC | Platform admin functions, audit | Deno `admin*` / `rbac*` |
| Jobs | Pollers, expiry, reminders, lightning pull fallback | Base44 scheduled functions (5‑min floor) |

### 4.3 Dedicated domain APIs (final)

Generic `GET/POST /api/entities/:name` is a **migration compatibility layer** so the existing `mist.entities.*` Proxy can keep working. The long-term public API follows `docs/api/*`: auth, users, profiles, chat, groups/communities, images, notifications, weather, repeaters, maps, events, alerts, AI, forum, feed, realtime.

Hot paths that must leave generic CRUD: chat send/history, net session mutations, RadioScope geo queries, notification dispatch, membership lifecycle.

### 4.4 Porting Deno functions

There are 93 `base44/functions/*/entry.ts` handlers. They are the current backend. V2 **ports** them into TypeScript services. Do not delete the Deno tree until Phase 8.

Pattern: keep `mist.functions.invoke(name, args)` on the client; add the name to the facade’s `migratedFunctions` map when the Express route is proven (same pattern as `manageCommunityMembership` today).

---

## 5. DATABASE

### 5.1 Engine

- PostgreSQL
- PostGIS for RadioScope, repeaters, location share, geofences, lightning, weather radius
- Proper relational foreign keys (`users.id`, `community.id`, chat/net child tables)
- Every schema change is a numbered migration (`src/backend/db/migrations/`)

### 5.2 Preserve entities

The 66 Base44 entity schemas remain the **domain dictionary**. Tables may be renamed to snake_case (already started in `002_entities.sql`) but fields and product meaning stay unless a later hardening phase consolidates duplicates (Chat V1 vs V2, two PM models).

Current entity list:

`AccountMigration`, `Alert`, `BlockedUser`, `ChatMessage`, `ChatPresence`, `ChatV2Conversation`, `ChatV2Message`, `ChatV2Participant`, `ChatV2Presence`, `ChatV2Room`, `ChatV2RoomMembership`, `ChatV2RoomMessage`, `Club`, `Community`, `CommunityAuditLog`, `CommunityMember`, `CommunityMemberRole`, `CommunityRole`, `CommunityRoleDefinition`, `CommunitySettings`, `Conversation`, `ConversationParticipant`, `DeviceToken`, `DirectMessage`, `DMMessage`, `Event`, `FeatureFlag`, `FollowedThread`, `ForumCategory`, `ForumPost`, `ForumSubscription`, `ForumThread`, `GatheringPhoto`, `Geofence`, `LightningAlertDelivery`, `LightningAlertSettings`, `LightningProviderState`, `LightningStrike`, `LocationShare`, `MarketplaceItem`, `ModeratorNote`, `Net`, `NetCheckIn`, `NetIncident`, `NetLog`, `NetQueueEntry`, `NetSession`, `NetTemplate`, `NetTimeline`, `Notification`, `NotificationDelivery`, `NotificationPreferences`, `PlatformAuditLog`, `PlatformRole`, `RadioFile`, `RadioManufacturer`, `RadioModel`, `RbacAuditLog`, `Repeater`, `Report`, `Role`, `User`, `UserPresence`, `UserRadio`, `UserRole`, `UserStats`

Auth tables already sketched: `users`, `profiles`, `sessions`, `otp_codes`.

### 5.3 ID migration (explicit)

| Topic | Plan |
|---|---|
| Base44 IDs | Opaque strings |
| V2 IDs | UUID primary keys (`gen_random_uuid()`) |
| Mapping | Keep `legacy_base44_id TEXT UNIQUE` on every migrated table until cutover |
| Client | Facade may accept either ID during hybrid; Core always returns UUID |
| Files / deep links | Rewrite stored URLs and notification `link` fields in a batch job |
| User | Merge Base44 platform `User` with Core `users`; email is the join key; `AccountMigration` already models MyBB ↔ MIST mapping |
| RLS | Port Base44 RLS JSON via the existing interpreter **and** add community-scoped rules the current Core engine does not evaluate |

`002_entities.sql` is auto-generated and stores JSON as TEXT with no FKs. Later migrations must add PostGIS columns (`geography(Point,4326)`), FKs, indexes, and NOT NULL where the product already requires it. Do not hand-edit the generator output; add follow-on migrations.

### 5.4 Dual-write / import

1. Export Base44 entities (admin backup function or scripted `list` with pagination).
2. Load into Postgres with `legacy_base44_id` populated.
3. Optional dual-write from functions still on Base44 (out of scope until Phase 2 tooling exists).
4. Cut reads to Postgres per domain when checksums match.
5. Keep Base44 data frozen-read for rollback.

---

## 6. AUTHENTICATION

**Target:** MISST-owned identity. No permanent dependency on Base44 authentication.

| Capability | V2 |
|---|---|
| Email + password | Core `/api/auth/login`, `/register` (already sketched; Argon2) |
| Access + refresh JWT | Short-lived access, hashed refresh in `sessions` |
| OTP / email verify | `otp_codes` + SMTP |
| Password reset | Existing Core routes |
| Google OAuth | **To be implemented** in Core (`GOOGLE_CLIENT_ID` / `SECRET` already in env schema). Frontend `loginWithProvider("google")` stays on Base44 until Core OAuth is live |
| Session bootstrap | Core path in `AuthContext` when `VITE_MIST_CORE_API_URL` is set — no `/api/apps/public` |
| RBAC | Port `base44/shared/rbac.ts` and `communityRbac.ts`; `resolveRbac` becomes a Core service |

`useMistUser` remains the UI identity contract. The derived `mybbUser` object stays as a **read-only compatibility view**, not a second session.

MyBB `mybbAuth` / `registerMyBBUser` / `ssoIssueToken` become optional adapter endpoints, not the login page.

---

## 7. REALTIME

Base44 `entity.subscribe()` is the current push bus. Core’s `subscribe()` no-op **must not** be enabled in production.

**Target:** authenticated WebSocket at `/ws`, rooms rather than global entity firehoses.

| Domain | Events | Consumers today |
|---|---|---|
| Chat | message create/update/delete, room membership | `useChat`, `useChatV2`, `useRoomMessages`, Messages hub |
| Mission Control / nets | `NetSession`, `NetLog`, `NetTimeline`, `NetQueueEntry`, `NetIncident` | `useMissionControl`, `useMissionControlV2` |
| Net check-ins | check-in create / approve | Mission Control + public net cards |
| Presence | `ChatPresence`, `ChatV2Presence`, `UserPresence` | RadioScope, chat, members |
| Notifications | `Notification`, `NotificationDelivery` | `useNotifications`, admin monitor |
| RadioScope | presence, location share, repeater updates | `RadioScope.jsx` |
| Lightning | `LightningStrike` create | `useRealtimeLightningStrikes`, lighting engine |

**Compatibility:** keep the `mist.entities.X.subscribe(cb)` signature during migration; implement it with WS in the Core entity client instead of a no-op. Dedicated `mist.realtime.join(room)` can follow.

Polling fallbacks (`useRealtimeFallback`, `usePollingGate`) stay as safety nets until WS is proven.

Connection manager in `src/backend/websockets` is the starting point; it currently only logs messages. Auth middleware for WS is still missing and must be implemented in Phase 3.

---

## 8. STORAGE

**Target:** S3-compatible object storage (MinIO locally, S3 / R2 / equivalent on the VPS).

Replace `mist.integrations.Core.UploadFile` without changing UX:

- Avatars, banners, gallery (`GatheringPhoto`), chat attachments, radio files, community branding, marketplace images, composer uploads

`src/backend/media/upload.service.ts` already describes validate → upload → thumbnail → signed URL. It currently imports a non-existent `base44.storage` module; V2 implements `storage/s3.storage.ts` instead of Base44.

Preserve content-type allowlists already mirrored in `src/lib/radioFiles.js`. Rewrite stored `media.base44.com` URLs as part of data migration. Never commit credentials; use env (`S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`).

---

## 9. EMAIL

**Target:** SMTP / SES abstraction (`email.channel.ts` already talks SMTP via `SMTP_URL` / `SMTP_FROM`).

Replace `base44.asServiceRole.integrations.Core.SendEmail` used by alerts, community admin blasts, and membership emails.

Same interface for OTP and password-reset mail. Do not hard-code Base44 SendEmail. Do not put SMTP passwords in source.

---

## 10. AI

**Target:** provider abstraction (`mist.ai.complete`, `mist.ai.generateImage`) behind env (`AI_PROVIDER=openai|local|none`, endpoint, model, key).

Current Base44 usage to wrap, not delete until replaced:

- `InvokeLLM` — Mission Control net summary (`useMissionControlV2`, `McvAiAssistant`) — keep `src/lib/aiCache.js`
- `GenerateImage` — opt-in hero artwork (`useHeroArtwork`)

Local AI (e.g. Ollama / OpenAI-compatible localhost) should work where practical so development and air-gapped ops are not billed to a cloud vendor. If no provider is configured, UI shows the existing empty/cached state rather than calling Base44.

Do not hard-code the application to Base44 AI services.

---

## 11. INTEGRATIONS

| Integration | V2 stance |
|---|---|
| Firebase FCM | **May remain.** Keep `getFcmPublicConfig`, `DeviceToken`, `public/sw.js`, `FCM_*` secrets in server env |
| MyBB | **Optional adapter.** Forum connector behind `forum.service.ts`. Identity is MISST. Bridge URL and `MIST_BRIDGE_SECRET` / `MYBB_BOT_PASSWORD` stay server-side |
| NOAA GLM relay | **Remain usable.** Lambda still POSTs to MISST `lightningWebhook`; only the URL/secret change at cutover |
| OpenWeather | MISST-owned `getWeatherData` service; `WEATHER_API_KEY` in env. Keep Orlando fallback as config, not a hardcoded product rule long-term |
| RepeaterBook | MISST-owned `fetchRepeaterBook` service |
| RainViewer + NWS radar | Client or thin proxy; preserve Weather page behavior |
| PushAlert | Legacy pollers only; do not build new features on it. Retire in Phase 5/8 once FCM + in-app cover the same jobs |
| Stripe packages | Present in npm; marketplace `stripe_checkout_id` exists. No live payment requirement in this architecture; do not expand until a dedicated billing design exists |
| Google OAuth | MISST-owned when implemented (see Auth) |

Secrets stay in environment / secret store. The platform admin “ask Base44 to update the secret” UI is replaced in Phase 6/7 with operator runbooks, not committed values.

---

## 12. DEPLOYMENT

### 12.1 Until cutover (unchanged)

Production remains Base44 publish (`base44/config.jsonc`: `npm run build` → `./dist`). This document does **not** change production deployment.

### 12.2 Local development (Windows)

- Node.js LTS, Git
- PostgreSQL + PostGIS (native install, Docker Desktop, or equivalent)
- MinIO or local S3-compatible store (optional until Phase 4)
- Redis optional (jobs / pub-sub); in-process jobs acceptable early
- `npm install` (frontend) and backend `mist-core-backend` scripts (`tsx src/backend/main.ts`)
- `.env` / `.env.local` never committed; `VITE_MIST_CORE_API_URL=http://localhost:<port>` to exercise Core
- Base44 env vars remain for hybrid (`VITE_BASE44_APP_ID`, `VITE_BASE44_APP_BASE_URL`)

### 12.3 Production (final — Phase 7+)

- Our VPS
- Nginx reverse proxy (SPA static files + `/api` + `/ws` upgrade)
- HTTPS (Let’s Encrypt or existing certs)
- Git-based deployment (pull `misst-v2` / main after merge, `npm ci`, `npm run build`, restart systemd units for API + worker)
- PostgreSQL on the VPS or managed instance
- S3-compatible bucket
- Process manager: systemd (API, worker)
- **No Base44 requirement** in the final architecture

Rollback: keep previous `dist` + previous API binary/container + database backup; DNS/Nginx can point back to Base44 hosting until Phase 8 is complete.

---

## 13. MIGRATION PRINCIPLES

1. **Do not break the existing application unnecessarily.** Default is Base44 behavior.
2. **Migrate one subsystem at a time.** Auth, then data, then realtime, then storage, then domain functions, then admin.
3. **Keep Base44 working until its replacement is verified.** Hybrid facade; feature flags if needed (`FeatureFlag` entity).
4. **Never expose secrets in source code.** Env only; rotate when leaving Base44’s secret store.
5. **Every database change requires a migration.**
6. **Every major backend feature requires tests.** (Auth, membership, entity RLS, chat, nets, notifications at minimum.)
7. **Preserve the existing MISST UI whenever practical.**
8. **Prefer dedicated domain APIs over generic CRUD as the final architecture.**
9. **Keep a rollback path throughout migration.** Dual-run, `legacy_base44_id`, previous deploy artifacts.
10. **Production must remain functional until the final cutover.** No production deployment changes in early phases.

---

## 14. What must not happen on this branch (standing orders)

- Do not delete or rewrite existing MISST product functionality “to make V2 cleaner.”
- Do not remove Base44 dependencies until Phase 8.
- Do not modify production deployment configuration as part of early phases.
- Do not merge experimental breakage into `main` until a phase is verified.
- Do not enable Core entity routing in production while `subscribe()` is a no-op.

---

## 15. Phased migration roadmap

### Phase 0 — Architecture and local development

**Goal:** A Windows developer can run the SPA and Core API locally without changing production.

- This document; environment templates (secrets unnamed in git)
- Postgres + PostGIS local
- Core `/health`, auth smoke, entity list against empty DB
- Document hybrid flags (`VITE_MIST_CORE_API_URL` vs Base44)
- Do not remove packages or Studio tooling

**Exit:** Local Core boots; SPA still works against Base44 with Core unset.

### Phase 1 — Authentication

**Goal:** MISST-owned email/password, OTP, reset, JWT sessions.

- Complete Core auth (already started)
- Frontend Core bootstrap path only when env set
- Google OAuth implemented in Core **before** removing Base44 `loginWithProvider`
- Password-reset and verification email via SMTP abstraction (can stub in dev)

**Exit:** Test users can register/login on Core without Base44; production still Base44.

**Rollback:** Unset `VITE_MIST_CORE_API_URL`.

### Phase 2 — PostgreSQL / data migration

**Goal:** Full entity dataset in Postgres with ID mapping.

- Export from Base44
- Migrations: `legacy_base44_id`, FKs, PostGIS for geo tables
- Import + checksums
- Generic entity API against Postgres in non-prod
- Plan User merge (platform User vs `users` table)

**Exit:** Staging DB mirrors production entities; IDs mapped.

**Rollback:** SPA still reads Base44 entities.

### Phase 3 — Realtime / WebSockets

**Goal:** Chat, Mission Control, check-ins, presence, notifications, RadioScope, lightning over `/ws`.

- WS auth
- Room model
- Implement Core `subscribe()` for the entities listed in §7
- Keep polling fallbacks

**Exit:** Staging UI stays live without Base44 websockets.

**Rollback:** Point `subscribe` back to Base44; do not enable Core entities in prod.

### Phase 4 — Media / storage / email

**Goal:** S3-compatible uploads and SMTP/SES mail.

- Implement storage driver; swap UploadFile call sites through `mist.media`
- Copy existing files off `media.base44.com`
- Replace SendEmail in ported functions
- Signed URLs for private radio files

**Exit:** Uploads and transactional email work with Base44 integrations disabled in staging.

**Rollback:** Facade routes media/email back to `base44.integrations`.

### Phase 5 — Domain functions

**Goal:** Port Deno business logic behind `mist.functions.invoke` / dedicated routes.

Order (highest coupling first):

1. Community membership (already started)
2. Chat send / rooms / DMs
3. `notify` + FCM dispatch
4. Nets / `manageNet`
5. Locations, weather, RepeaterBook
6. Lightning webhook (retarget GLM relay in staging)
7. Remaining `on*` automations as workers
8. Replace `check*` pollers (drop PushAlert when FCM+DB cover them)

**Exit:** Staging can run with Base44 functions unused except leftover admin.

**Rollback:** Facade `invoke` falls back to Base44 by function name.

### Phase 6 — Admin / RBAC

**Goal:** Platform admin and community admin work on Core.

- Port `rbacManage`, `resolveRbac`, `adminManage*`
- Secrets UI becomes “configured / not configured” against server env, not Base44 chat
- Backup/restore against Postgres + object storage
- Rebuild or retire “App Builder” (Base44 Studio only)

**Exit:** `/platform/admin` operates on Core in staging.

### Phase 7 — Production deployment

**Goal:** VPS + Nginx + HTTPS + git deploy serving SPA + API + worker, **in parallel** with Base44 still available.

- systemd units, Nginx (`/`, `/api`, `/ws`)
- Backups, log rotation, health checks
- Cut a **canary** (staff community or feature flag) to VPS
- GLM relay still pointed at Base44 until lightning is verified on VPS

**Exit:** A reversible slice of traffic on VPS; Base44 still hosts default production.

This phase **changes production only when operators explicitly cut over a slice**. Until then, Base44 remains production.

### Phase 8 — Base44 removal

**Goal:** No Base44 requirement.

- Point all traffic at VPS
- Remove `@base44/sdk`, `@base44/vite-plugin`, `base44Client`, Deno functions from the **runtime** path (source tree can archive later)
- Rewrite remaining `media.base44.com` URLs
- Retire URL `access_token` handshake and MCP consent if unused
- GLM webhook + DNS final

**Exit:** App runs with Base44 packages unused. Only then is deleting dependencies allowed.

**Rollback:** DNS / Nginx back to Base44 hosting; database is already migrated so a true rollback needs a freeze window.

### Phase 9 — Hardening and optimization

**Goal:** Production-quality MISST V2.

- Replace remaining generic CRUD with dedicated APIs
- PostGIS query performance, WS room fan-out, job durability (Redis / pg-boss)
- Consolidate Chat V1 vs V2 and PM entity duplicates if product agrees
- PWA manifest, tests, rate limits, observability
- Make MyBB optional at build/config
- Local AI provider documentation

---

## 16. Compatibility facade (how we avoid a big-bang rewrite)

```
mist.auth.*          → Core JWT when VITE_MIST_CORE_API_URL set, else Base44
mist.entities.*      → Core CRUD when enabled AND realtime is real, else Base44
mist.functions.invoke→ per-name map to REST, else Base44
mist.integrations    → Base44 until Phase 4/AI replacements exist
mist.media / mist.ai → new namespaces; add without deleting old call sites first
```

Extend `migratedFunctions` in `src/api/mist/index.js` one name at a time. Do not flip a global “all functions on Core” switch.

---

## 17. Risk register (architecture)

| Risk | Mitigation |
|---|---|
| Core `subscribe()` no-op breaks chat/nets/lightning | Phase 3 before prod entity cutover |
| String ID vs UUID | `legacy_base44_id`; facade translation |
| Community RLS weaker in Core than Base44 | Port community rules before chat/location cutover |
| Secrets only in Base44 store | Export to VPS env in Phase 7; rotate FCM and bridge secrets |
| Dual forum (native entities + MyBB) | Adapter; UI stays on native forum pages |
| 5‑minute Base44 automation floor | Workers on VPS; keep AWS GLM relay |
| Google login gap | Implement Core OAuth before disabling Base44 provider login |

---

## 18. Related documents

- `docs/api/00-overview.md` — intended REST + WebSocket contract
- `docs/architecture/multi-tenant-migration-plan.md` — tenancy notes (identity section is outdated: native auth is already the UI session)
- `docs/LIGHTNING_PROVIDER_READINESS.md` — GLM relay vs Base44 scheduler
- `src/backend/README.md` — Core backend layout
- `base44/config.jsonc` — current Base44 site build (unchanged until Phase 8)

---

**End of MISST V2 architecture.** Implementation work on `misst-v2` follows the phases above, one subsystem at a time, with Base44 remaining production until Phase 7–8 operators cut over.
)
