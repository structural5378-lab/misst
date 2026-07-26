// MIST Lightning Infrastructure — Phase 1
//
// Provider abstraction layer + Lightning Service + Distance Engine + Notification
// Engine. The rest of the application never knows which provider supplies data;
// providers are registered in PROVIDER_REGISTRY and selected via getActiveProvider.
//
// Architecture (dependency injection, one-way):
//   Provider layer  →  Lightning Service  →  Distance Engine  →  Notification Engine  →  Push
//   (getLatestStrikes)   (processLightningStrike)   (haversineMiles)   (deliverLightningAlert)   (NotificationService)
//
// Weather/lightning services NEVER call push directly — they go through the
// Notification Engine below, which owns in-app records, delivery logs, and push.

import { NotificationService } from "./notificationService.ts";

const EARTH_RADIUS_MI = 3958.8;
const ICON_URL = "https://insomniacsgmrs.com/uploads/mist-icon.png";

// ─── Distance Engine (Haversine, in miles) ───────────────────────────────────
export function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_MI * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Strike type ─────────────────────────────────────────────────────────────
export interface Strike {
  id: string;
  latitude: number;
  longitude: number;
  strike_time?: string;
  provider?: string;
  intensity?: number;
  metadata?: string;
  processed?: boolean;
  created_date?: string;
}

// ─── Provider interface ──────────────────────────────────────────────────────
// Every future provider (Vaisala, Earth Networks, Blitzortung, …) must implement
// this interface. The Lightning Service talks only to this interface.
export interface LightningProvider {
  name: string;
  getLatestStrikes(sinceMs: number): Promise<Strike[]>;
  getStrikeHistory(fromMs: number, toMs: number): Promise<Strike[]>;
  healthCheck(): Promise<{ ok: boolean; latencyMs?: number; detail?: string }>;
}

// Mock provider: reads strikes persisted in the LightningStrike entity. Dev actions
// populate the entity; the provider normalizes rows into the Strike shape. A real
// provider would fetch from its external API and persist normalized strikes here.
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

// ─── Provider registry (dependency injection) ────────────────────────────────
// Phase 2: register real providers here (e.g. { vaisala: createVaisalaProvider }).
// Multiple providers can coexist; getActiveProviderName() selects the active one.
const PROVIDER_REGISTRY: Record<string, (base44: any) => LightningProvider> = {
  mock: createMockProvider,
};

export function getActiveProviderName(): string {
  return "mock";
}

export function getProvider(name: string, base44: any): LightningProvider {
  const factory = PROVIDER_REGISTRY[name || "mock"] || createMockProvider;
  return factory(base44);
}

export function listRegisteredProviders(): string[] {
  return Object.keys(PROVIDER_REGISTRY);
}

// ─── Notification Engine (lightning-specific) ─────────────────────────────────
// Owns: dedupe (LightningAlertDelivery), in-app Notification record, push via
// NotificationService, and NotificationDelivery logging. Honors per-user lightning
// channel preferences (push/sound/vibration) from LightningAlertSettings.
async function deliverLightningAlert(
  base44: any,
  user: any,
  strike: Strike,
  distanceMiles: number,
  settings: any
): Promise<{ delivered: boolean; reason?: string }> {
  // Dedupe: one alert per (strike, user)
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
  } catch { /* dedupe race — treat as delivered */ }

  const distStr = distanceMiles.toFixed(1);
  const link = `/radioscope?strike=${strike.id}`;
  const meta = {
    subcategory: "lightning",
    strike_id: strike.id,
    lat: strike.latitude,
    lon: strike.longitude,
    distance_miles: +distanceMiles.toFixed(2),
    intensity: strike.intensity ?? null,
    auto_open_map: !!settings.auto_open_map,
  };

  // 1) In-app Notification record (so it appears in the Notification Center)
  let notifId = "";
  try {
    const notif = await base44.asServiceRole.entities.Notification.create({
      recipient_id: user.id,
      recipient_name: user.full_name || user.email || "",
      sender_id: "",
      sender_name: "Lightning Alert",
      type: "weather_alert",
      title: "⚡ Lightning Nearby",
      message: `Lightning detected ${distStr} miles away.`,
      related_object_id: strike.id,
      related_object_type: "lightning_strike",
      read: false,
      delivered_at: new Date().toISOString(),
      link,
      metadata: JSON.stringify(meta),
    });
    notifId = notif?.id || "";
  } catch { /* in-app record is best-effort */ }

  // 2) Push (if the user enabled it and has device tokens)
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
        notification: { title: "⚡ Lightning Nearby", body: `Lightning detected ${distStr} miles away.` },
        data: {
          link,
          type: "weather_alert",
          tag: "lightning",
          strike_id: strike.id,
          lat: String(strike.latitude),
          lon: String(strike.longitude),
          auto_open_map: settings.auto_open_map ? "1" : "0",
        },
        android: { notification: { icon: ICON_URL, sound: sound ? "default" : undefined, tag: "lightning", color: "#3B82F6" } },
        apns: { payload: { aps: { sound: sound ? "default" : undefined, "mutable-content": 1 } } },
        webpush: {
          notification: { icon: ICON_URL, badge: ICON_URL, tag: "lightning", requireInteraction: false, vibrate },
          fcm_options: { link },
        },
      };
      let res: any = { sent: 0, failed: 0, invalidTokens: [], results: [], errors: [] };
      try { res = await NotificationService.sendPush(tokenList, payload); }
      catch (e) { res.errors = [String(e)]; res.failed = tokenList.length; }

      // purge invalid tokens
      if (Array.isArray(res.invalidTokens) && res.invalidTokens.length) {
        await base44.asServiceRole.entities.DeviceToken
          .updateMany({ token: { $in: res.invalidTokens } }, { $set: { is_active: false } })
          .catch(() => {});
      }

      // delivery log
      const status = res.failed === 0 ? "sent" : res.sent > 0 ? "sent" : "failed";
      try {
        await base44.asServiceRole.entities.NotificationDelivery.create({
          notification_id: notifId,
          recipient_id: user.id,
          type: "weather_alert",
          title: "⚡ Lightning Nearby",
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

// ─── Lightning Service: process one strike against all enabled users ─────────
// Called by the entity automation (real-time) and the scheduled poller (fallback).
export async function processLightningStrike(base44: any, strike: Strike): Promise<{ processed: number; skipped: number }> {
  if (!strike || !strike.id || !strike.latitude || !strike.longitude) {
    return { processed: 0, skipped: 0 };
  }

  // 1) Enabled users
  const settings = await base44.asServiceRole.entities.LightningAlertSettings
    .filter({ enabled: true }, "-updated_at", 200)
    .catch(() => []);
  if (!settings || settings.length === 0) return { processed: 0, skipped: 0 };

  const userIds = settings.map((s: any) => s.user_id).filter(Boolean);
  const users = await fetchUsers(base44, userIds);
  const userById = new Map(users.map((u) => [u.id, u]));

  // 2) Live locations from ChatPresence (freshest per user, TTL-valid)
  const presence = await base44.asServiceRole.entities.ChatPresence
    .list("-last_active", 500)
    .catch(() => []);
  const now = Date.now();
  const locByUid = new Map<string, any>();
  for (const p of presence || []) {
    if (!p.user_uid || !p.sharing_location) continue;
    if (!p.latitude || !p.longitude) continue;
    if (p.location_expires_at && new Date(p.location_expires_at).getTime() < now) continue;
    // keep the freshest
    const cur = locByUid.get(String(p.user_uid));
    if (!cur || new Date(p.location_updated_at || 0).getTime() > new Date(cur.location_updated_at || 0).getTime()) {
      locByUid.set(String(p.user_uid), p);
    }
  }

  let processed = 0;
  let skipped = 0;
  for (const s of settings) {
    const user = userById.get(s.user_id);
    if (!user) { skipped++; continue; }
    const key = String(user.mybb_uid || user.id);
    const loc = locByUid.get(key);
    if (!loc) { skipped++; continue; } // no live location → cannot compute distance
    const dist = haversineMiles(loc.latitude, loc.longitude, strike.latitude, strike.longitude);
    const radius = s.radius_miles || 10;
    if (dist > radius) { skipped++; continue; }
    try {
      await deliverLightningAlert(base44, user, strike, dist, s);
      processed++;
    } catch { /* best-effort per user */ }
  }
  return { processed, skipped };
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