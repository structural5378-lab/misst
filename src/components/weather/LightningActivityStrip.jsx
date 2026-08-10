import { useMemo } from 'react';
import { Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { mist } from '@/api/mist';
import { useUserCommunities } from '@/hooks/useUserCommunities';
import { usePollingGate } from '@/hooks/usePollingGate';
import { useRealtimeLightningStrikes } from '@/hooks/useRealtimeLightningStrikes';
import { computeLightningActivity } from '@/lib/lightning/activityIntelligence';
import { SCOPE_RADIUS_MI } from '@/lib/lightning/proximityConfig';

// LightningActivityStrip — weather-UI lightning indicator for the Dashboard.
//
// REALTIME-FIRST: new strikes arrive through the LightningStrike realtime
// subscription (useRealtimeLightningStrikes) and update the nearest-strike
// metric immediately — no waiting for a poll. The initial/historical set comes
// from a single entity read with a SLOW reconciliation refetch (fallback only);
// realtime is the primary live path. Uses the centralized activity intelligence
// module + configurable proximity tiers (no hard-coded thresholds).
//
// This reads the EXISTING LightningStrike pipeline (the same one RadioScope
// uses) — not a second weather API. Renders nothing when idle (no community
// location or no recent activity) so it never clutters the dashboard.

const RECONCILE_MS = 2 * 60 * 1000; // slow reconciliation fallback (realtime is primary)

export default function LightningActivityStrip() {
  const active = usePollingGate();
  const { data: communities = [] } = useUserCommunities();
  const activeId =
    typeof window !== 'undefined' ? localStorage.getItem('selected_community_id') : null;
  const community = useMemo(
    () => communities.find((c) => c.id === activeId) || communities[0] || null,
    [communities, activeId]
  );
  const hasCenter =
    community?.location_lat != null && community?.location_lon != null;
  const center = hasCenter
    ? [community.location_lat, community.location_lon]
    : null;

  // Historical/initial strike set — reconciliation fallback ONLY. Realtime
  // (useRealtimeLightningStrikes) is the primary path for new strikes.
  const { data: baseStrikes = [] } = useQuery({
    queryKey: ['lightning-activity-base', community?.id],
    queryFn: async () => {
      if (!center) return [];
      const rows = await mist.entities.LightningStrike.list('-strike_time', 100);
      return (rows || []).filter((s) => s.latitude != null && s.longitude != null);
    },
    enabled: !!center,
    staleTime: RECONCILE_MS,
    refetchInterval: active ? RECONCILE_MS : false, // reconciliation only
  });

  // Realtime-first: new strikes merge in immediately via the subscription.
  const strikes = useRealtimeLightningStrikes({
    baseStrikes,
    center,
    scopeRadiusMiles: SCOPE_RADIUS_MI,
  });

  const activity = useMemo(
    () => computeLightningActivity(strikes, { now: Date.now(), center }),
    [strikes, center]
  );

  if (!center || !activity.hasActivity || !activity.closest) return null;

  const dist = activity.closest.dist;
  const tier = activity.closest.tier;
  const label =
    dist <= 10
      ? 'Lightning detected very nearby'
      : `Lightning detected ${dist.toFixed(0)} miles away`;

  return (
    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
        <Zap className="w-5 h-5 text-amber-400" />
      </div>
      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-amber-400" /> {label}
        </h4>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Live lightning feed · {tier.label.toLowerCase()} · within {SCOPE_RADIUS_MI} mi of {community?.name || 'your community'}
        </p>
      </div>
    </div>
  );
}