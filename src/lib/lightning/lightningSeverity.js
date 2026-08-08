// MISST Lightning → Lighting producer (client-side, pure).
//
// Maps a persisted LightningStrike + user context into a LightingEvent for the
// MISST Lighting Engine. This module owns the weather→lighting translation:
// distance (Haversine, miles), severity tier (anchored to the user's existing
// LightningAlertSettings.radius_miles — NO invented thresholds), and the
// LightingEvent payload. It imports NO UI. The only engine touch is calling
// dispatchLightingEvent (the generic transport seam) — the Lighting Engine
// itself stays source-agnostic.
//
// Severity tiers (anchored to the user's alert radius):
//   critical  distance ≤ radiusMiles        (within the user's alert zone)
//   near      distance ≤ radiusMiles × 2     (approaching the alert zone)
//   distant   distance >  radiusMiles × 2    (visible but not threatening)
// High-intensity overlay: intensity ≥ 70 (existing strike.intensity field).

import { dispatchLightingEvent } from '@/lib/lighting/lightingEvents';

const MI_PER_KM = 0.621371;
const EARTH_RADIUS_KM = 6371;

export function milesBetween(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * MI_PER_KM;
}

export function isHighIntensity(intensity) {
  return intensity != null && intensity >= 70;
}

export function severityTier(distance, radiusMiles) {
  const r = radiusMiles || 10;
  if (distance == null) return 'distant';
  if (distance <= r) return 'critical';
  if (distance <= r * 2) return 'near';
  return 'distant';
}

const SEVERITY_EFFECT = {
  critical: 'thunder_storm',
  near: 'electric_aura',
  distant: 'static_glow',
};
const SEVERITY_ACCENT = {
  critical: '#a855f7',
  near: '#3b82f6',
  distant: '#64748b',
};
const SEVERITY_DURATION = { critical: 1800, near: 1200, distant: 800 };

// Build a LightingEvent from a strike + user context. Pure: returns the event
// object (or null). Caller may dispatch it via dispatchLightingEvent.
export function buildLightingEvent({ strike, userPos, radiusMiles, now = Date.now() }) {
  if (!strike || strike.latitude == null || strike.longitude == null || !userPos) return null;
  const distance = milesBetween(userPos[0], userPos[1], strike.latitude, strike.longitude);
  const severity = severityTier(distance, radiusMiles);
  const strikeTime = strike.strike_time || strike.created_date;
  const age = strikeTime ? Math.max(0, now - new Date(strikeTime).getTime()) : 0;
  const intensity = strike.intensity ?? null;
  return {
    id: `lightning-${strike.id}`,
    effect: SEVERITY_EFFECT[severity],
    accent: SEVERITY_ACCENT[severity],
    surface: 'radioscope',
    duration: SEVERITY_DURATION[severity],
    severity,
    distance: +distance.toFixed(2),
    location: { lat: strike.latitude, lon: strike.longitude },
    age,
    source: 'weather',
    metadata: {
      strikeId: strike.id,
      provider: strike.provider || 'mock',
      strikeTime: strikeTime || null,
      intensity,
      highIntensity: isHighIntensity(intensity),
    },
  };
}

// Convenience: build + dispatch in one call (used by the realtime producer).
export function dispatchStrikeLightingEvent(args) {
  const evt = buildLightingEvent(args);
  if (evt) dispatchLightingEvent(evt);
  return evt;
}