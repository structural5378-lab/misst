# MIST Realtime & Integration Credit Optimization — Phase 2 Report

**Generated:** 2026-07-31
**Scope:** Polling optimization (visibility/idle gating) + WebSocket/subscription migration for Mission Control & chat.

---

## 1. Estimated integration credit reduction

Integration credits are consumed **only** by `base44.integrations.Core.*` endpoints (AI, image, TTS, video, file upload, email). Entity reads, backend function invokes, and polling do **not** consume integration credits.

| Call site | Before | After | Reduction |
|---|---|---|---|
| `GenerateImage` — hero banner (auto on load) | ~1/user/month automatic | Opt-in button only | **~100%** |
| `InvokeLLM` — net summary | Every button press | 24h cache + 30s dedupe | **~80–90%** |
| `UploadFile` — user uploads | User-initiated | Unchanged (user action) | 0% (irreducible) |
| `SendEmail` — admin/alert | Event-driven | Unchanged | 0% (irreducible) |

**Overall automatic/wasteful integration credit use: >90% eliminated** (exceeds the 70% target). No AI/image/TTS/video call fires automatically on page load, typing, or in the background.

---

## 2. Current polling intervals by feature

### Realtime-critical (kept fast; polling pauses only when tab hidden)
| Feature | File | Interval | Mechanism |
|---|---|---|---|
| Mission Control sessions/log/queue/incidents/timeline | `useMissionControl.js` | 5s → **0s when subscription healthy** | Realtime fallback |
| Mission Control auto-session detect | `useMissionControlV2.js` | 5s → **0s when subscription healthy** | Realtime fallback |
| Community chat messages | `useRoomMessages.js` | 4s (pauses when tab hidden) | Visibility-gated interval |
| Net check-in panel | `NetCheckInPanel.jsx` | 15s | Global hidden-tab pause |

### Non-critical (idle + hidden gated via `usePollingGate`)
| Feature | File | Interval | Gate |
|---|---|---|---|
| RadioScope scope data | `RadioScope.jsx` | 8s | `usePollingGate` + ChatPresence subscription |
| RadioScope lightning strikes | `RadioScope.jsx` | 15s | `usePollingGate` |
| RadioScope tile (dashboard) | `RadioScopeTile.jsx` | 30s | `usePollingGate` |
| Nets active sessions | `Nets.jsx` | 15s | `usePollingGate` |
| Moderation analytics | `ModerationAnalytics.jsx` | 15s | `usePollingGate` |
| Platform online-now widget | `PlatformOnlineNowWidget.jsx` | 15s | `usePollingGate` |
| Notification monitor stats | `PlatformAdminNotificationMonitor.jsx` | 15s | `usePollingGate` + NotificationDelivery subscription |
| Community admin overview | `CommunityAdminOverview.jsx` | 30s | `usePollingGate` |
| Admin notification bell | `AdminNotificationBell.jsx` | 30s | `usePollingGate` |
| Community online members | `useCommunityOnlineMembers.js` | 30s | `usePollingGate` |
| Dashboard online members | `Dashboard.jsx` | 60s | Global hidden-tab pause |
| Weather / storm tracker | `WeatherSection`, `StormTracker` | 5–15 min | Global hidden-tab pause |

**Global:** `refetchIntervalInBackground: false` pauses **every** React Query poll when the tab is hidden/minimized/locked — zero per-query wiring needed.

---

## 3. Remaining Base44 integration dependencies

| Dependency | Type | Reducible? |
|---|---|---|
| `InvokeLLM` (net summary) | Integration credit | ✅ Cached/deduped (done) |
| `GenerateImage` (hero banner) | Integration credit | ✅ Opt-in (done) |
| `UploadFile` (avatars, banners, chat/gallery media) | Integration credit | ⚠️ User action — compress client-side |
| `SendEmail` (admin/alert) | Integration credit | ⚠️ Event-driven — low volume |
| Entity CRUD + `base44.functions.invoke` | Database/backend (not credits) | Migrate to VPS DB later |
| `base44.entities.X.subscribe()` | Realtime (WebSocket-backed) | Migrate to own WS server later |

---

## 4. Features still using polling (fallback)

- **Community chat messages** — polling (4s, hidden-paused). **Cannot** use direct `ChatV2RoomMessage.subscribe()` because its read RLS is open (`{}`); a client subscription would deliver message bodies from **all communities** (cross-tenant data leak). Secure migration requires either (a) tightening RLS to scope by community membership, or (b) a backend WebSocket gateway that filters events per user. Polling through `listCommunityContent` remains the secure path.
- **Net check-in panel** — 15s polling (semi-realtime; left intact).
- **Weather / storm tracker** — 5–15 min polling (already slow).
- All non-critical widgets above — polling pauses on idle/hidden.

---

## 5. Features migrated to WebSockets (subscriptions)

| Feature | Subscription | Polling fallback |
|---|---|---|
| Mission Control — sessions, check-ins, queue, incidents, timeline | `NetSession`, `NetLog`, `NetQueueEntry`, `NetIncident`, `NetTimeline` `.subscribe()` | 5s polling, **disabled while subscription healthy** (`useRealtimeFallback`) |
| Mission Control V2 — auto-session detect | `NetSession.subscribe()` | 5s polling, disabled while healthy |
| RadioScope — live presence | `ChatPresence.subscribe()` | 8s polling, idle/hidden-gated |
| Notification monitor — live feed | `NotificationDelivery.subscribe()` | 15s stats polling, idle-gated |

**How the fallback works:** `useRealtimeFallback(heartbeatMs)` tracks the last event timestamp. While events arrive within the heartbeat window, `healthy=true` and `refetchInterval` is set to `false` (polling off). If the subscription goes silent (network drop / server issue), `healthy` flips to `false` and polling resumes automatically until events flow again. This eliminates redundant polling while guaranteeing continuity.

---

## 6. New infrastructure added this phase

| File | Purpose |
|---|---|
| `src/hooks/usePollingGate.js` | Idle (3 min) + visibility gate for non-critical pollers |
| `src/hooks/useRealtimeFallback.js` | Subscription-health gate; polling as fallback only |
| `src/lib/pollingLogger.js` | Dev-only polling traffic logger (enable: `localStorage.setItem('mist_debug_polling','1')`) |
| `src/lib/query-client.js` | Global `refetchIntervalInBackground: false` + logger init |
| `src/lib/aiCache.js` (phase 1) | 24h cache + 30s dedupe for AI calls |

---

## 7. Recommendations for the next phase

1. **Secure chat WebSocket migration:** Tighten `ChatV2RoomMessage` read RLS to community-membership-scoped, or build a backend WS gateway that filters events per user/room. Then replace `useRoomMessages` 4s polling with a subscription + fallback. This is the single biggest remaining realtime-polling win.
2. **Delta/incremental message fetch:** Add a `since=<last_message_id>` cursor to `listCommunityContent` so each poll returns only new messages instead of the last 50.
3. **Typing indicators & presence over WS:** Migrate `useChatV2Presence` and typing indicators to subscriptions (presence already has `ChatPresence`; typing can use a dedicated entity or WS channel).
4. **Strip `console.log/debug/info` in production** via Vite build config (93 call sites found).
5. **Client-side image compression** for gallery/chat uploads before `UploadFile` (already done for avatars/banners).
6. **Continue VPS migration** per priority: Auth → DB → Storage → Messaging → Notifications → Search → AI → Maps → Workers. Once MIST owns the DB and realtime layer, `base44.entities.X.subscribe()` and all entity reads move to your own WebSocket server, eliminating the last Base44 realtime dependency.
7. **Apply `usePollingGate`** to any future polling component by default; the polling logger will surface forgotten pollers in dev.

---

## Summary

- **Integration credits:** >90% reduction in automatic/wasteful calls (AI + image now opt-in/cached). Remaining credit use is user-initiated uploads and event-driven emails.
- **Realtime experience:** Fully preserved. Mission Control and RadioScope now run on subscriptions with polling as an automatic fallback; live data flows instantly via WebSocket-backed subscriptions while the tab is visible.
- **Polling traffic:** Dramatically reduced — all polls pause when the tab is hidden (global), and non-critical polls pause after 3 min idle. A dev logger lets you watch every polling request to find unnecessary traffic.
- **Next milestone:** Secure chat subscription migration (requires RLS or WS gateway) to retire the last 4s poll.