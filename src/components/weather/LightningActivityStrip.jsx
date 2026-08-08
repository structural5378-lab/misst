import { useMemo } from 'react';
import { Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useUserCommunities } from '@/hooks/useUserCommunities';
import { usePollingGate } from '@/hooks/usePollingGate';
import { milesBetween } from '@/lib/lightning/lightningSeverity';

// LightningActivityStrip — weather-UI lightning indicator for the Dashboard.
// Uses the EXISTING LightningStrike pipeline (no new weather API) and the
// active community's geographic center to report nearby lightning activity.
// Renders nothing when there is no community location or no recent activity,
// so it never duplicates a weather data source or clutters the UI when idle.
//
// This is a read of the existing LightningStrike entity (the same pipeline
// RadioScope uses), not a second weather API call.
const RADIUS_MI = 50;

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

  const { data: nearest } = useQuery({
    queryKey: ['lightning-activity', community?.id],
    queryFn: async () => {
      if (!center) return null;
      const rows = await base44.entities.LightningStrike.list('-strike_time', 100);
      let best = null;
      for (const s of rows || []) {
        if (s.latitude == null || s.longitude == null) continue;
        const d = milesBetween(center[0], center[1], s.latitude, s.longitude);
        if (d <= RADIUS_MI && (!best || d < best.dist)) best = { dist: d, strike: s };
      }
      return best;
    },
    enabled: !!center,
    staleTime: 30 * 1000,
    refetchInterval: active ? 60 * 1000 : false,
  });

  if (!center || !nearest) return null;

  const dist = nearest.dist;
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
          Live lightning feed · within {RADIUS_MI} mi of {community?.name || 'your community'}
        </p>
      </div>
    </div>
  );
}