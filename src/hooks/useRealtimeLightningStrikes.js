import { useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { milesBetween } from '@/lib/lightning/lightningSeverity';
import { SCOPE_RADIUS_MI } from '@/lib/lightning/proximityConfig';

// useRealtimeLightningStrikes — REALTIME-FIRST lightning delivery.
//
// Subscribes to LightningStrike create events and merges new strikes into local
// state IMMEDIATELY, so a new strike's marker renders without waiting for the
// next getCommunityRadioScopeData refetch. The database query (passed as
// baseStrikes) remains the source of truth for the historical/initial set;
// realtime is the PRIMARY path for NEW strikes. Polling/refetch is
// reconciliation only and never blocks the live path.
//
// One subscription, two behaviors:
//   1. Adds the strike to local state → persistent marker renders at once.
//   2. Invokes onNewStrike(strike) → caller dispatches the transient
//      LightingEvent for the flash overlay (RadioScope) or updates activity
//      intelligence (dashboard strip).
//
// Scope filter: only strikes within `scopeRadiusMiles` of `center` are kept, so
// distant global strikes never clutter the map or trigger local reactions.
// State is cleared on community/scope change so stale strikes from a previous
// community don't bleed in.
//
// Returns: merged strike list (realtime ∪ base, deduped by id, realtime-first).
export function useRealtimeLightningStrikes({
  baseStrikes = [],
  center = null,
  scopeRadiusMiles = SCOPE_RADIUS_MI,
  onNewStrike = null,
}) {
  const [realtimeStrikes, setRealtimeStrikes] = useState([]);
  // Keep the latest callback in a ref so the subscription never re-subscribes
  // on every render (the callback closure captures live userPosition/radius).
  const onNewRef = useRef(onNewStrike);
  onNewRef.current = onNewStrike;

  useEffect(() => {
    // Clear realtime cache on community / scope change.
    setRealtimeStrikes([]);
    const unsub = base44.entities.LightningStrike.subscribe((evt) => {
      if (!evt || evt.type !== 'create' || !evt.data) return;
      const s = evt.data;
      if (s.latitude == null || s.longitude == null) return;
      // Scope filter: only strikes within the community's rendered range.
      if (center) {
        const d = milesBetween(center[0], center[1], s.latitude, s.longitude);
        if (d > scopeRadiusMiles) return;
      }
      setRealtimeStrikes((prev) => {
        if (prev.some((x) => x.id === s.id)) return prev; // dedupe
        return [s, ...prev].slice(0, 300);
      });
      if (onNewRef.current) onNewRef.current(s);
    });
    return unsub;
    // center is [lat, lon] or null; depend on its coordinates only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.[0], center?.[1], scopeRadiusMiles]);

  // Merge: realtime first (newest), then base/historical, deduped by id.
  const merged = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const s of realtimeStrikes) {
      if (s && !seen.has(s.id)) { seen.add(s.id); out.push(s); }
    }
    for (const s of baseStrikes) {
      if (s && !seen.has(s.id)) { seen.add(s.id); out.push(s); }
    }
    return out;
  }, [realtimeStrikes, baseStrikes]);

  return merged;
}