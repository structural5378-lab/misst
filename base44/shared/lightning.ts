// MIST Lightning Infrastructure — Phase 2 (Live Provider Integration)
//
// Provider abstraction layer + Lightning Service + Distance Engine + Notification
// Engine. The rest of the application never knows which provider supplies data;
// providers are registered in PROVIDER_REGISTRY and selected via getActiveProvider
// (LIGHTNING_PROVIDER env/secret). Phase 1 shipped the Mock provider; Phase 2 adds
// a production Live provider. Swapping providers is a configuration change only.
//
// Architecture (dependency injection, one-way):
//   Provider layer  →  Lightning Service  →  Distance Engine  →  Notification Engine  →  Push
//   (getLatestStrikes)   (processLightningStrikesBatch) (haversineMiles) (deliverLightningAlert) (NotificationService)
//
// Weather/lightning services NEVER call push directly — they go through the
// Notification Engine below, which owns in-app records, delivery logs, grouping,
// and push.

import { NotificationService } from "./notificationService.ts";
import { secrets } from "base44:runtime";

const EARTH_RADIUS_MI = 3958.8;
const ICON_URL = "https://insomniacsgmrs.com/uploads/mist-icon.png";

// ─── Secrets / config (server-only, never exposed to the client) ────────────
function getSecret(name: string, def = ""): string {
  try {
    const v = (secrets as any).get(name);
    return v == null ? def : String(v);
  } catch {
    return def;
  }
}

export function getActiveProviderName(): string {
  const name = getSecret("LIGHTNING_PROVIDER", "mock").trim().toLowerCase();
  return name === "live" ? "live" : "mock";
}

function readLiveConfig() {
  return {
    apiUrl: getSecret("LIGHTNING_API_URL", "").trim(),
    apiKey: getSecret("LIGHTNING_API_KEY", "").trim(),
    maxStrikes: parseInt(getSecret("LIGHTNING_MAX_STRIKES", "500")) || 500,
    timeoutMs: parseInt(getSecret("LIGHTNING_REQUEST_TIMEOUT_MS", "8000")) || 8000,
    retryAttempts: parseInt(getSecret("LIGHTNING_RETRY_ATTEMPTS", "3")) || 3,
    rateLimitPerMin: parseInt(getSecret("LIGHTNING_RATE_LIMIT_PER_MIN", "600")) || 600,
  };
}

// ─── Distance Engine (Haversine, in miles) + bearing ────────────────────────
export function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_MI * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const COMPASS = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
export function bearingCompass(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const deg = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return COMPASS[Math.round(deg / 45) % 8];
}

// ─── Strike model (normalized across all providers) ─────────────────────────
export interface Strike {
  id: string;
  provider_strike_id?: string;
  latitude: number;
  longitude: number;
  strike_time?: string;
  provider?: string;
  strike_type?: string;
  intensity?: number | null;
  metadata?: string;
  processed?: boolean;
  created_date?: string;
}

// ─── Provider interface ──────────────────────────────────────────────────────
// Every provider (Mock, Live, future Vaisala/Earth Networks/Blitzortung) must
// implement this interface. The Lightning Service talks only to this interface.
export interface LightningProvider {
  name: string;
  getLatestStrikes(sinceMs: number): Promise<Strike[]>;
  getStrikeHistory(fromMs: number, toMs: number): Promise<Strike[]>;
  healthCheck(): Promise<{ ok: boolean; latencyMs?: number; detail?: string; rateLimit?: string }>;
}

// ─── Mock provider (dev/test) ────────────────────────────────────────────────
export function createMockProvider(base44: any): LightningProvider {
  return {
    name: "mock",
    async getLatestStrikes(sinceMs: number): Promise<Strike[]> {
      const rows = await base44.asServiceRole.entities.LightningStrike.list("-strike_time", 500);
      return (rows || [])
        .filter((s: any) => {
          const t = new Date(s.strike_time || s.created_date).getTime();
          return isFinite(t) && t >= sinceMs;
        })
        .slice(0, 500);
    },
    async getStrikeHistory(fromMs: number, toMs: number): Promise<Strike[]> {
      const rows = await base44.asServiceRole.entities.LightningStrike.list("-strike_time", 1000);
      return (rows || []).filter((s: any) => {
        const t = new Date(s.strike_time || s.created_date).getTime();
        return isFinite(t) && t >= fromMs && t <= toMs;
      });
    },
    async healthCheck() {
      return { ok: true, detail: "mock provider operational" };
    },
  };
}

// ─── Live provider (production) ─────────────────────────────────────────────
// Fetches strikes from a configurable HTTP API, normalizes them into the internal
// Strike model, dedupes via an in-memory seen-id cache, retries with exponential
// backoff, and enforces a client-side rate limit. All communication is server-side.
// If the API URL/key are not configured, the provider degrades gracefully
// (returns [] / health=not-configured) so the app never crashes.
let seenIds: Set<string> = new Set();
let requestLog: number[] = [];

function rateLimited(cfg: { rateLimitPerMin: number }): boolean {
  const now = Date.now();
  requestLog = requestLog.filter((t) => now - t < 60_000);
  if (requestLog.length >= cfg.rateLimitPerMin) return true;
  requestLog.push(now);
  return false;
}

function buildUrl(cfg: { apiUrl: string }, sinceMs: number): string {
  const sinceIso = new Date(sinceMs).toISOString();
  const base = cfg.apiUrl;
  if (base.includes("{since}")) return base.replace("{since}", encodeURIComponent(sinceIso));
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}since=${encodeURIComponent(sinceIso)}&limit=${cfg.maxStrikes || 500}`;
}

// Normalize a provider payload into Strike[] WITHOUT a since-filter. Shared by
// the live polled provider (normalizeStrikes adds the since-filter below) and the
// push webhook (lightningWebhook), so ingestion normalization is defined once.
export function normalizeStrikeArray(data: any, maxStrikes = 500): Strike[] {
  let arr: any[] = [];
  if (Array.isArray(data)) arr = data;
  else if (data && Array.isArray(data.strikes)) arr = data.strikes;
  else if (data && Array.isArray(data.data)) arr = data.data;
  else if (data && Array.isArray(data.features)) arr = data.features;
  const out: Strike[] = [];
  for (const raw of arr) {
    const lat = +(raw.latitude ?? raw.lat ?? raw.Latitude);
    const lon = +(raw.longitude ?? raw.lon ?? raw.lng ?? raw.Longitude);
    if (!isFinite(lat) || !isFinite(lon)) continue;
    const tRaw = raw.time || raw.timestamp || raw.utc_time || raw.dateTime || raw.detected_at || raw.strike_time;
    const t = tRaw ? new Date(tRaw).getTime() : Date.now();
    if (!isFinite(t)) continue;
    const id = String(raw.id || raw.strikeId || raw.uuid || `${lat.toFixed(4)},${lon.toFixed(4)},${t}`);
    out.push({
      id,
      provider_strike_id: id,
      latitude: lat,
      longitude: lon,
      strike_time: new Date(t).toISOString(),
      provider: "live",
      strike_type: String(raw.type || raw.polarity || raw.stroke_type || ""),
      intensity: raw.intensity != null ? +raw.intensity : raw.peak_current != null ? +raw.peak_current : null,
      metadata: JSON.stringify({ raw: JSON.stringify(raw).slice(0, 2000) }),
      processed: false,
    });
    if (out.length >= maxStrikes) break;
  }
  return out;
}

function normalizeStrikes(data: any, sinceMs: number, maxStrikes: number): Strike[] {
  return normalizeStrikeArray(data, maxStrikes).filter((s) => {
    const t = new Date(s.strike_time || 0).getTime();
    return t >= sinceMs;
  });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchStrikesWithRetry(cfg: ReturnType<typeof readLiveConfig>, sinceMs: number): Promise<{ strikes: Strike[]; latencyMs: number; rateLimit: string }> {
  const t0 = Date.now();
  if (rateLimited(cfg)) {
    return { strikes: [], latencyMs: Date.now() - t0, rateLimit: `throttled (max ${cfg.rateLimitPerMin}/min)` };
  }
  let lastErr: any;
  for (let attempt = 0; attempt < cfg.retryAttempts; attempt++) {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
      const headers: Record<string, string> = { Accept: "application/json" };
      if (cfg.apiKey) {
        headers["Authorization"] = `Bearer ${cfg.apiKey}`;
        headers["x-api-key"] = cfg.apiKey;
      }
      const res = await fetch(buildUrl(cfg, sinceMs), { headers, signal: ctrl.signal });
      clearTimeout(to);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const strikes = normalizeStrikes(data, sinceMs, cfg.maxStrikes);
      const rl = res.headers.get("x-ratelimit-remaining") || res.headers.get("x-rate-limit-remaining") || "";
      return { strikes, latencyMs: Date.now() - t0, rateLimit: rl ? `remaining ${rl}` : "ok" };
    } catch (e) {
      lastErr = e;
      if (attempt < cfg.retryAttempts - 1) await sleep(1000 * 2 ** attempt);
    }
  }
  throw lastErr;
}

export function createLiveProvider(_base44: any): LightningProvider {
  return {
    name: "live",
    async getLatestStrikes(sinceMs: number): Promise<Strike[]> {
      const cfg = readLiveConfig();
      if (!cfg.apiUrl) return [];
      const { strikes } = await fetchStrikesWithRetry(cfg, sinceMs);
      // in-memory dedupe (warm-instance fast path)
      const fresh = strikes.filter((s) => s.provider_strike_id && !seenIds.has(s.provider_strike_id));
      for (const s of fresh) {
        seenIds.add(s.provider_strike_id!);
        if (seenIds.size > 2000) {
          // cap memory: drop oldest by recreating (Set preserves insertion order)
          const arr = [...seenIds];
          seenIds = new Set(arr.slice(-1500));
        }
      }
      return fresh;
    },
    async getStrikeHistory(fromMs: number, toMs: number): Promise<Strike[]> {
      const cfg = readLiveConfig();
      if (!cfg.apiUrl) return [];
      const { strikes } = await fetchStrikesWithRetry(cfg, fromMs);
      return strikes.filter((s) => {
        const t = new Date(s.strike_time || 0).getTime();
        return t >= fromMs && t <= toMs;
      });
    },
    async healthCheck() {
      const cfg = readLiveConfig();
      if (!cfg.apiUrl) return { ok: false, detail: "not configured (set LIGHTNING_API_URL)" };
      try {
        const { latencyMs, rateLimit } = await fetchStrikesWithRetry(cfg, Date.now() - 60_000);
        return { ok: true, latencyMs, detail: "live provider reachable", rateLimit };
      } catch (e: any) {
        return { ok: false, detail: String(e?.message || e).slice(0, 240) };
      }
    },
  };
}

// ─── Provider registry (dependency injection) ────────────────────────────────
const PROVIDER_REGISTRY: Record<string, (base44: any) => LightningProvider> = {
  mock: createMockProvider,
  live: createLiveProvider,
};

export function getProvider(name: string, base44: any): LightningProvider {
  const factory = PROVIDER_REGISTRY[name || "mock"] || createMockProvider;
  return factory(base44);
}

export function listRegisteredProviders(): string[] {
  return Object.keys(PROVIDER_REGISTRY);
}

// ─── Provider State (persisted runtime metrics for the admin status page) ──
export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getProviderState(base44: any): Promise<any> {
  const rows = await base44.asServiceRole.entities.LightningProviderState.list("-created_date", 1).catch(() => []);
  if (rows && rows.length) return rows[0];
  try {
    return await base44.asServiceRole.entities.LightningProviderState.create({
      provider: getActiveProviderName(),
      health: "unknown",
      total_strikes_today: 0,
      notifications_sent_today: 0,
      consecutive_failures: 0,
      avg_response_time_ms: 0,
      stats_date: todayStr(),
      last_poll_at: new Date().toISOString(),
    });
  } catch {
    return null;
  }
}

export async function updateProviderState(base44: any, patch: any): Promise<void> {
  const st = await getProviderState(base44);
  if (!st || !st.id) return;
  await base44.asServiceRole.entities.LightningProviderState.update(st.id, patch).catch(() => {});
}

export async function bumpStrikesToday(base44: any, n: number): Promise<void> {
  const st = await getProviderState(base44);
  const today = todayStr();
  const reset = st?.stats_date !== today;
  const val = (reset ? 0 : st?.total_strikes_today || 0) + n;
  await updateProviderState(base44, { total_strikes_today: val, stats_date: today });
}

export async function bumpNotificationsToday(base44: any, n: number): Promise<void> {
  const st = await getProviderState(base44);
  const today = todayStr();
  const reset = st?.stats_date !== today;
  const val = (reset ? 0 : st?.notifications_sent_today || 0) + n;
  await updateProviderState(base44, { notifications_sent_today: val, stats_date: today });
}

// ─── Retention: delete strikes older than the configured window ──────────────
export async function deleteExpiredStrikes(base44: any, retentionMinutes: number): Promise<number> {
  const cutoff = new Date(Date.now() - retentionMinutes * 60_000).toISOString();
  try {
    const res: any = await base44.asServiceRole.entities.LightningStrike.deleteMany({ strike_time: { $lt: cutoff } });
    return res?.deleted || 0;
  } catch {
    return 0;
  }
}

// ─── Notification Engine (lightning-specific, with intelligent grouping) ─────
// Owns: dedupe (LightningAlertDelivery), per-user throttle/grouping (60s window
// with escalation tiers), in-app Notification record, push via NotificationService,
// and NotificationDelivery logging. Honors per-user channel prefs.
const GROUP_WINDOW_MS = 60_000;
const GROUP_TIER1 = 3; // "Frequent lightning detected nearby."
const GROUP_TIER2 = 6; // "Storm activity increasing in your area."

async function deliverLightningAlert(
  base44: any,
  user: any,
  loc: any,
  strike: Strike,
  distanceMiles: number,
  settings: any
): Promise<{ delivered: boolean; reason?: string }> {
  // 1) Dedupe: one alert per (strike, user)
  try {
    const existing = await base44.asServiceRole.entities.LightningAlertDelivery.filter({
      strike_id: strike.id,
      user_id: user.id,
    });
    if (existing && existing.length > 0) return { delivered: false, reason: "duplicate" };
  } catch { /* proceed — best effort dedupe */ }

  try {
    await base44.asServiceRole.entities.LightningAlertDelivery.create({
      strike_id: strike.id,
      user_id: user.id,
      distance_miles: +distanceMiles.toFixed(2),
      strike_time: strike.strike_time || new Date().toISOString(),
    });
  } catch { /* dedupe race — treat as handled */ }

  const direction = bearingCompass(loc.latitude, loc.longitude, strike.latitude, strike.longitude);
  const distStr = distanceMiles.toFixed(1);
  const link = `/radioscope?strike=${strike.id}`;
  const baseMeta: any = {
    subcategory: "lightning",
    strike_id: strike.id,
    lat: strike.latitude,
    lon: strike.longitude,
    distance_miles: +distanceMiles.toFixed(2),
    direction,
    intensity: strike.intensity ?? null,
    auto_open_map: !!settings.auto_open_map,
  };

  // 2) Intelligent grouping / throttle
  const now = Date.now();
  const lastAt = settings.last_alert_at ? new Date(settings.last_alert_at).getTime() : 0;
  const inWindow = lastAt && now - lastAt < GROUP_WINDOW_MS;

  let title = "⚡ Lightning Nearby";
  let body = `Lightning detected ${distStr} miles ${direction}.`;
  let sendNotification = true;
  let patch: any = null;

  if (inWindow) {
    const count = (settings.recent_count || 0) + 1;
    const tier = settings.recent_escalated || 0;
    patch = { recent_count: count };
    if (tier < 1 && count >= GROUP_TIER1) {
      patch.recent_escalated = 1;
      title = "⚡ Frequent Lightning Nearby";
      body = `Frequent lightning detected nearby — ${count} strikes in the last minute.`;
    } else if (tier < 2 && count >= GROUP_TIER2) {
      patch.recent_escalated = 2;
      title = "⚡ Storm Activity Increasing";
      body = `Storm activity increasing in your area — ${count} strikes in the last minute.`;
    } else {
      // suppress individual notification; just count this strike
      sendNotification = false;
    }
  } else {
    // new window starts with this strike
    patch = { recent_count: 1, last_alert_at: new Date(now).toISOString(), recent_window_start: new Date(now).toISOString(), recent_escalated: 0 };
  }

  // persist throttle state + mutate in-memory settings (shared across batch)
  Object.assign(settings, patch);
  await base44.asServiceRole.entities.LightningAlertSettings.update(settings.id, patch).catch(() => {});

  if (!sendNotification) return { delivered: false, reason: "throttled" };

  // 3) In-app Notification record
  let notifId = "";
  try {
    const notif = await base44.asServiceRole.entities.Notification.create({
      recipient_id: user.id,
      recipient_name: user.full_name || user.email || "",
      sender_id: "",
      sender_name: "Lightning Alert",
      type: "weather_alert",
      title,
      message: body,
      related_object_id: strike.id,
      related_object_type: "lightning_strike",
      read: false,
      delivered_at: new Date().toISOString(),
      link,
      metadata: JSON.stringify(baseMeta),
    });
    notifId = notif?.id || "";
  } catch { /* in-app record is best-effort */ }

  // 4) Push (if enabled and tokens exist)
  if (settings.push_enabled) {
    let tokens: any[] = [];
    try {
      tokens = await base44.asServiceRole.entities.DeviceToken.filter(
        { user_id: user.id, is_active: true },
        "-created_date",
        100
      );
    } catch { tokens = []; }
    const tokenList = (tokens || []).map((t: any) => t.token).filter(Boolean);
    if (tokenList.length > 0) {
      const sound = !!settings.sound_enabled;
      const vibrate = settings.vibration_enabled ? [150, 100, 150] : undefined;
      const payload: any = {
        notification: { title, body },
        data: { link, type: "weather_alert", tag: "lightning", strike_id: strike.id, lat: String(strike.latitude), lon: String(strike.longitude), auto_open_map: settings.auto_open_map ? "1" : "0" },
        android: { notification: { icon: ICON_URL, sound: sound ? "default" : undefined, tag: "lightning", color: "#3B82F6" } },
        apns: { payload: { aps: { sound: sound ? "default" : undefined, "mutable-content": 1 } } },
        webpush: { notification: { icon: ICON_URL, badge: ICON_URL, tag: "lightning", requireInteraction: false, vibrate }, fcm_options: { link } },
      };
      let res: any = { sent: 0, failed: 0, invalidTokens: [], results: [], errors: [] };
      try { res = await NotificationService.sendPush(tokenList, payload); }
      catch (e) { res.errors = [String(e)]; res.failed = tokenList.length; }

      if (Array.isArray(res.invalidTokens) && res.invalidTokens.length) {
        await base44.asServiceRole.entities.DeviceToken
          .updateMany({ token: { $in: res.invalidTokens } }, { $set: { is_active: false } })
          .catch(() => {});
      }
      const status = res.failed === 0 ? "sent" : res.sent > 0 ? "sent" : "failed";
      try {
        await base44.asServiceRole.entities.NotificationDelivery.create({
          notification_id: notifId,
          recipient_id: user.id,
          type: "weather_alert",
          title,
          status,
          attempts: 1,
          max_attempts: 5,
          token_count: tokenList.length,
          fcm_message_id: (res.results || []).find((r: any) => r.ok)?.messageId || "",
          last_error: status === "failed" ? String((res.errors || [])[0] || "push failed").slice(0, 240) : "",
          sent_at: res.sent > 0 ? new Date().toISOString() : "",
          platforms: JSON.stringify(["web"]),
        });
      } catch { /* logging best-effort */ }
    }
  }
  return { delivered: true };
}

// ─── Helpers ────────────────────────────────────────────────────────────────
async function fetchUsers(base44: any, ids: string[]): Promise<any[]> {
  const set = new Set(ids.filter(Boolean));
  if (set.size === 0) return [];
  const out: any[] = [];
  for (const id of set) {
    const u = await base44.asServiceRole.entities.User.get(id).catch(() => null);
    if (u) out.push(u);
  }
  return out;
}

// ─── Lightning Service: process a batch of strikes against all enabled users ─
// Fetches enabled settings + live presence ONCE, then loops strikes with a
// bounding-box quick-reject before Haversine. Used by the scheduled poller
// (live ingestion) and the real-time entity automation (single strike).
export async function processLightningStrikesBatch(base44: any, strikes: Strike[]): Promise<{ processed: number; skipped: number }> {
  const list = (strikes || []).filter((s) => s && s.id && s.latitude && s.longitude);
  if (list.length === 0) return { processed: 0, skipped: 0 };

  const settings = await base44.asServiceRole.entities.LightningAlertSettings
    .filter({ enabled: true }, "-updated_at", 500)
    .catch(() => []);
  if (!settings || settings.length === 0) return { processed: 0, skipped: list.length };

  const userIds = settings.map((s: any) => s.user_id).filter(Boolean);
  const users = await fetchUsers(base44, userIds);
  const userById = new Map(users.map((u) => [u.id, u]));

  const presence = await base44.asServiceRole.entities.ChatPresence.list("-last_active", 500).catch(() => []);
  const now = Date.now();
  const locByUid = new Map<string, any>();
  for (const p of presence || []) {
    if (!p.user_uid || !p.sharing_location || !p.latitude || !p.longitude) continue;
    if (p.location_expires_at && new Date(p.location_expires_at).getTime() < now) continue;
    const key = String(p.user_uid);
    const cur = locByUid.get(key);
    if (!cur || new Date(p.location_updated_at || 0).getTime() > new Date(cur.location_updated_at || 0).getTime()) {
      locByUid.set(key, p);
    }
  }

  // max radius across enabled users → bounding-box half-size in degrees
  let maxRadiusMi = 10;
  for (const s of settings) maxRadiusMi = Math.max(maxRadiusMi, s.radius_miles || 10);
  const maxDeg = maxRadiusMi / 69;

  let delivered = 0;
  let skipped = 0;
  for (const strike of list) {
    for (const s of settings) {
      const user = userById.get(s.user_id);
      if (!user) { skipped++; continue; }
      const key = String(user.mybb_uid || user.id);
      const loc = locByUid.get(key);
      if (!loc) { skipped++; continue; }
      // bounding-box quick reject before Haversine (performance)
      if (Math.abs(loc.latitude - strike.latitude) > maxDeg || Math.abs(loc.longitude - strike.longitude) > maxDeg) {
        skipped++; continue;
      }
      const dist = haversineMiles(loc.latitude, loc.longitude, strike.latitude, strike.longitude);
      const radius = s.radius_miles || 10;
      if (dist > radius) { skipped++; continue; }
      try {
        const r = await deliverLightningAlert(base44, user, loc, strike, dist, s);
        if (r.delivered) delivered++;
      } catch { /* best-effort per user */ }
    }
  }
  return { processed: delivered, skipped };
}

export async function processLightningStrike(base44: any, strike: Strike): Promise<{ processed: number; skipped: number }> {
  return processLightningStrikesBatch(base44, [strike]);
}

// ─── Dev helpers (admin "Lightning" panel — testing only) ─────────────────────
const DEFAULT_CENTER: [number, number] = [25.77, -80.19]; // Miami

async function getCenter(base44: any, user: any): Promise<[number, number]> {
  const uid = String(user?.mybb_uid || user?.id || "");
  if (uid) {
    try {
      const p = await base44.asServiceRole.entities.ChatPresence.filter({ user_uid: uid });
      const rec = p?.[0];
      if (rec && rec.sharing_location && rec.latitude && rec.longitude &&
          (!rec.location_expires_at || new Date(rec.location_expires_at).getTime() > Date.now())) {
        return [+rec.latitude, +rec.longitude];
      }
    } catch { /* fall back to default */ }
  }
  return DEFAULT_CENTER;
}

function offsetMiles(clat: number, clon: number, miles: number, bearing: number): [number, number] {
  const dLat = (miles / 69) * Math.cos(bearing);
  const dLon = (miles / (69 * Math.cos((clat * Math.PI) / 180))) * Math.sin(bearing);
  return [+(clat + dLat).toFixed(6), +(clon + dLon).toFixed(6)];
}

function randStrike(clat: number, clon: number, miles: number, strikeTime: string, source: string) {
  const bearing = Math.random() * 2 * Math.PI;
  const [lat, lon] = offsetMiles(clat, clon, miles, bearing);
  return {
    latitude: lat,
    longitude: lon,
    strike_time: strikeTime,
    provider: "mock",
    intensity: Math.round(20 + Math.random() * 80),
    metadata: JSON.stringify({ source, bearing_deg: Math.round((bearing * 180) / Math.PI) }),
    processed: false,
  };
}

export async function generateRandomStrike(base44: any, user: any): Promise<{ strike: any }> {
  const [clat, clon] = await getCenter(base44, user);
  const miles = 5 + Math.random() * 40;
  const strike = randStrike(clat, clon, miles, new Date().toISOString(), "mock-dev");
  const created = await base44.asServiceRole.entities.LightningStrike.create(strike);
  return { strike: created };
}

export async function generateStorm(base44: any, user: any, count = 12): Promise<{ created: number }> {
  const [clat, clon] = await getCenter(base44, user);
  const rows = [];
  for (let i = 0; i < count; i++) {
    rows.push(randStrike(clat, clon, Math.random() * 15, new Date().toISOString(), "mock-storm"));
  }
  await base44.asServiceRole.entities.LightningStrike.bulkCreate(rows);
  return { created: rows.length };
}

export async function clearStrikes(base44: any): Promise<{ cleared: number }> {
  const res = await base44.asServiceRole.entities.LightningStrike.deleteMany({ provider: "mock" }).catch(() => ({}));
  return { cleared: (res as any)?.deleted ?? 0 };
}

export async function replayLastHour(base44: any, user: any, count = 30): Promise<{ created: number }> {
  await clearStrikes(base44);
  const [clat, clon] = await getCenter(base44, user);
  const now = Date.now();
  const rows = [];
  for (let i = 0; i < count; i++) {
    const t = new Date(now - Math.random() * 60 * 60 * 1000).toISOString();
    rows.push(randStrike(clat, clon, Math.random() * 20, t, "mock-replay"));
  }
  await base44.asServiceRole.entities.LightningStrike.bulkCreate(rows);
  return { created: rows.length };
}