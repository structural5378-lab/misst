// MISST Lightning Activity Intelligence
//
// Pure module: computes activity metrics from a list of strikes + user/center
// context. No UI, no side effects, no subscriptions. Builds the data
// model/interface so MISST can distinguish "one distant strike" from "lightning
// activity rapidly increasing nearby" — without a complex prediction system
// yet. Designed to expand (trend, frequency, intensity distribution, direction
// of movement) without changing the call surface.
//
// The ALERT SYSTEM stays independent: this module NEVER decides whether a
// notification should be sent. It only describes activity. Alert eligibility is
// computed elsewhere (base44/shared/lightning.ts deliverLightningAlert) using the
// user's LightningAlertSettings + the Notification Engine.
//
// Consumed by: LightningActivityStrip (dashboard), and available for a future
// RadioScope activity panel. Reuses the existing Haversine engine
// (lightningSeverity.milesBetween) and the configurable proximity tiers
// (proximityConfig.getProximityTier).

import { milesBetween } from './lightningSeverity';
import { getProximityTier, PROXIMITY_CONFIG } from './proximityConfig';

const EMPTY = {
  hasActivity: false,
  closest: null,
  newest: null,
  recentCount: 0,
  frequencyPerMin: 0,
  intensityAvg: null,
  trend: 'none',          // 'increasing' | 'decreasing' | 'steady' | 'none'
  trendConfidence: 0,    // 0–1 (fraction of recent window with data)
  nearestRepeater: null,
  tierDistribution: {},   // { very_close: n, close: n, nearby: n, distant: n }
  totalStrikes: 0,
};

// Compute lightning activity metrics for a strike set.
//   strikes  — LightningStrike[] (any subset; already scope-filtered by caller)
//   opts.now        — reference time (ms). Defaults to Date.now().
//   opts.userPos    — [lat, lon] of the user (preferred origin for "closest")
//   opts.center     — [lat, lon] of the community center (fallback origin)
//   opts.repeaters — Repeater[] for nearest-repeater-to-closest-strike
// Returns a plain activity object (see EMPTY). Stable shape for future fields.
export function computeLightningActivity(strikes, opts = {}) {
  const { now = Date.now(), userPos = null, center = null, repeaters = [] } = opts;
  const list = (strikes || []).filter(
    (s) => s && s.latitude != null && s.longitude != null
  );
  if (!list.length) return { ...EMPTY };

  const origin = userPos || center;
  let closest = null;
  let newest = null;
  let recentCount = 0;
  let intensitySum = 0;
  let intensityN = 0;
  const tierDistribution = {};
  const window = PROXIMITY_CONFIG.recentWindowMs;
  const half = window / 2;
  let firstHalf = 0;
  let secondHalf = 0;
  let inWindow = 0;

  for (const s of list) {
    const t = new Date(s.strike_time || s.created_date).getTime();
    const hasT = isFinite(t);

    // closest by distance to origin (user preferred, else community center)
    if (origin) {
      const d = milesBetween(origin[0], origin[1], s.latitude, s.longitude);
      if (!closest || d < closest.dist) {
        closest = { strike: s, dist: +d.toFixed(2), tier: getProximityTier(d) };
      }
      const tier = getProximityTier(d);
      tierDistribution[tier.id] = (tierDistribution[tier.id] || 0) + 1;
    }

    // newest by strike_time
    if (hasT && (!newest || t > newest.t)) newest = { strike: s, t };

    // recent count + trend halves
    if (hasT) {
      const age = now - t;
      if (age >= 0 && age <= window) {
        recentCount++;
        inWindow++;
        if (age <= half) secondHalf++;
        else firstHalf++;
      }
    }

    // intensity average
    if (s.intensity != null && isFinite(s.intensity)) {
      intensitySum += s.intensity;
      intensityN++;
    }
  }

  const frequencyPerMin = +(recentCount / (window / 60000)).toFixed(2);
  const intensityAvg = intensityN ? Math.round(intensitySum / intensityN) : null;

  // trend: compare newer half vs older half of the recent window.
  // 'increasing' if the recent half has notably more strikes; 'decreasing' if
  // the older half did. Requires enough data to be meaningful.
  let trend = 'none';
  let trendConfidence = 0;
  if (inWindow >= 3) {
    trendConfidence = +Math.min(1, inWindow / 6).toFixed(2);
    if (secondHalf > firstHalf * 1.5 && secondHalf >= 2) trend = 'increasing';
    else if (firstHalf > secondHalf * 1.5 && firstHalf >= 2) trend = 'decreasing';
    else if (inWindow >= 4) trend = 'steady';
  }

  // nearest repeater to the closest strike (existing lat/lon data supports it)
  let nearestRepeater = null;
  if (closest && repeaters && repeaters.length) {
    for (const r of repeaters) {
      if (r.latitude == null || r.longitude == null) continue;
      const d = milesBetween(
        closest.strike.latitude, closest.strike.longitude,
        r.latitude, r.longitude
      );
      if (!nearestRepeater || d < nearestRepeater.dist) {
        nearestRepeater = { repeater: r, dist: +d.toFixed(2) };
      }
    }
  }

  return {
    hasActivity: true,
    closest,
    newest,
    recentCount,
    frequencyPerMin,
    intensityAvg,
    trend,
    trendConfidence,
    nearestRepeater,
    tierDistribution,
    totalStrikes: list.length,
  };
}