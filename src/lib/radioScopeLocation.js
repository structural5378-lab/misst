// Shared live-GPS constants & helpers for RadioScope.
// Used by the page, the debug panel, and the user sheet so expiration logic is identical everywhere.

export const LOCATION_TTL_MS = 60 * 1000; // a fix older than this is not "live"
export const MAX_ACCURACY_M = 100; // ignore fixes worse than this (unless none better exists)
export const GPS_UPDATE_THROTTLE_MS = 5000; // min interval between server updates
export const GPS_WATCH_OPTS = { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 };

// Infer the fix source from accuracy when the platform doesn't expose it directly.
export function classifySource(accuracy) {
  if (accuracy == null || !isFinite(accuracy)) return "unknown";
  if (accuracy <= 25) return "gps";
  if (accuracy <= 75) return "network";
  return "low";
}

// Age in ms since the presence's last validated GPS fix. Infinity if missing/invalid.
export function getLocationAgeMs(presence, now = Date.now()) {
  if (!presence?.location_updated_at) return Infinity;
  const t = new Date(presence.location_updated_at).getTime();
  if (isNaN(t)) return Infinity;
  return now - t;
}

// A presence is "live" only if sharing is on, coords are non-null, and the fix is within TTL.
export function isLocationLive(presence, now = Date.now(), ttl = LOCATION_TTL_MS) {
  if (!presence) return false;
  if (!presence.sharing_location) return false;
  if (presence.latitude == null || presence.longitude == null) return false;
  if (presence.latitude === 0 && presence.longitude === 0) return false;
  return getLocationAgeMs(presence, now) < ttl;
}

export function isAccuracyAcceptable(presence, max = MAX_ACCURACY_M) {
  if (presence?.gps_accuracy == null) return true; // unknown accuracy — trust server validation
  return presence.gps_accuracy <= max;
}

// Filter a presence list to only users who should currently appear on the map.
export function getLiveUsers(presences, { now = Date.now(), ttl = LOCATION_TTL_MS, maxAccuracy = MAX_ACCURACY_M, excludeUid } = {}) {
  if (!Array.isArray(presences)) return [];
  return presences.filter((p) => {
    if (excludeUid && p.user_uid === excludeUid) return false;
    if (p.status === "offline") return false;
    if (!isLocationLive(p, now, ttl)) return false;
    if (!isAccuracyAcceptable(p, maxAccuracy)) return false;
    return true;
  });
}

export function formatAge(ms) {
  if (!isFinite(ms) || ms < 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return s + "s ago";
  const m = Math.floor(s / 60);
  return m + "m " + (s % 60) + "s ago";
}

export function formatSpeed(ms) {
  if (ms == null || !isFinite(ms)) return "—";
  const mph = ms * 2.23694;
  if (mph < 0.2) return "stopped";
  return mph.toFixed(1) + " mph";
}

export function formatHeading(deg) {
  if (deg == null || !isFinite(deg)) return "—";
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8] + ` (${Math.round(deg)}°)`;
}