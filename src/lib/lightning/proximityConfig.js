// MISST Lightning Proximity Configuration
//
// Single source of truth for lightning distance thresholds. Components import
// from here instead of hard-coding, so MISST can tune the WeatherBug-style
// proximity model in one place. Two separate distance concepts coexist:
//
//   1. PROXIMITY TIERS (this file) — absolute distance bands for UI labeling +
//      activity intelligence (distant / nearby / close / very close). These are
//      the configurable "WeatherBug-style" levels.
//   2. SEVERITY TIERS (lightningSeverity.js) — anchored to the USER's alert radius
//      (LightningAlertSettings.radius_miles) for the Lighting Engine effect
//      intensity. Those stay user-configurable per-alert, not here.
//
// Do not conflate the two: proximity tiers describe how far a strike is in
// absolute terms; severity tiers describe how threatening it is to THIS user.

export const PROXIMITY_CONFIG = {
  // Radius (miles) around the community center that RadioScope renders/monitors.
  // Strikes outside this radius are never shown on the map or counted in the
  // activity strip. Matches the backend getCommunityRadioScopeData filter.
  scopeRadiusMiles: 50,

  // Absolute distance tiers (miles). Ordered nearest → farthest. A strike's
  // tier is the FIRST tier whose maxMiles it falls under.
  tiers: [
    { id: 'very_close', maxMiles: 10,       label: 'Very Close', color: '#ef4444' },
    { id: 'close',      maxMiles: 20,       label: 'Close',      color: '#f97316' },
    { id: 'nearby',     maxMiles: 30,       label: 'Nearby',     color: '#eab308' },
    { id: 'distant',    maxMiles: Infinity, label: 'Distant',   color: '#64748b' },
  ],

  // Default user alert radius (miles) when no LightningAlertSettings record exists.
  defaultAlertRadiusMiles: 10,

  // Window (ms) within which a strike counts as "recent" for activity intelligence.
  recentWindowMs: 5 * 60 * 1000,
};

export const SCOPE_RADIUS_MI = PROXIMITY_CONFIG.scopeRadiusMiles;
export const DEFAULT_RADIUS_MILES = PROXIMITY_CONFIG.defaultAlertRadiusMiles;

// Resolve the proximity tier for an absolute distance (miles).
// Returns the tier object { id, maxMiles, label, color }. Unknown/null → distant.
export function getProximityTier(distance) {
  if (distance == null || distance < 0 || !isFinite(distance)) {
    return PROXIMITY_CONFIG.tiers[PROXIMITY_CONFIG.tiers.length - 1];
  }
  for (const t of PROXIMITY_CONFIG.tiers) {
    if (distance <= t.maxMiles) return t;
  }
  return PROXIMITY_CONFIG.tiers[PROXIMITY_CONFIG.tiers.length - 1];
}