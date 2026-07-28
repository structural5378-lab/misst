import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// PlatformOnlineNowWidget — Super Administrator live widget showing the
// aggregate number of users online across the entire MIST platform.
//
// Polls getPlatformStats every 15s (Super-Admin-only endpoint). Displays a live
// indicator and a "Updated X seconds ago" label. No per-user data is loaded.
export default function PlatformOnlineNowWidget() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['platform-stats-online'],
    queryFn: async () => (await base44.functions.invoke('getPlatformStats', {})).data,
    refetchInterval: 15000,
    staleTime: 10000,
    retry: false,
  });

  // Tick once per second to refresh the "Updated Xs ago" label.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const count = data?.metrics?.online_now ?? 0;
  const updatedAgo = data?.generated_at
    ? Math.max(0, Math.floor((now - data.generated_at) / 1000))
    : null;

  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-card to-card p-5 overflow-hidden relative">
      <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
      <div className="flex items-start justify-between gap-3 relative">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Platform Online Now</p>
            <p className="text-[11px] text-muted-foreground">Across all communities</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Live
        </span>
      </div>

      <div className="mt-4 flex items-end gap-2 relative">
        {isLoading && !data ? (
          <div className="w-16 h-10 rounded-lg bg-emerald-500/10 animate-pulse" />
        ) : isError ? (
          <span className="text-2xl font-bold text-destructive">—</span>
        ) : (
          <span className="text-4xl font-extrabold text-foreground tabular-nums leading-none">{count}</span>
        )}
        <span className="text-sm font-medium text-muted-foreground mb-1">
          {count === 1 ? 'User' : 'Users'}
        </span>
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground relative">
        {updatedAgo !== null
          ? `Updated ${updatedAgo === 0 ? 'just now' : `${updatedAgo}s ago`}`
          : isLoading
            ? 'Loading…'
            : 'Unavailable'}
      </p>
    </div>
  );
}