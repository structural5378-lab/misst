import React from 'react';
import { Link } from 'react-router-dom';
import { useCommunity } from '@/contexts/CommunityContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useCommunityOnlineMembers } from '@/hooks/useCommunityOnlineMembers';
import { usePollingGate } from '@/hooks/usePollingGate';
import { Users, Wifi, Inbox, Radio, Calendar, TrendingUp, Activity } from 'lucide-react';
import { format } from 'date-fns';

function formatAction(action) {
  if (action && action.startsWith('set_role:')) return 'set role to ' + action.split(':')[1] + ' for';
  const map = {
    approve: 'approved', reject: 'rejected', ban: 'banned', unban: 'unbanned',
    suspend: 'suspended', unsuspend: 'unsuspended', mute: 'muted', unmute: 'unmuted',
    kick: 'removed',
  };
  return map[action] || action;
}

export default function CommunityAdminOverview() {
  const { community } = useCommunity();
  const active = usePollingGate();
  const { data: onlineData } = useCommunityOnlineMembers(community.id);
  const onlineCount = onlineData?.online?.length || 0;

  const { data, isLoading } = useQuery({
    queryKey: ['community-admin-stats', community.id],
    queryFn: async () => (await base44.functions.invoke('getCommunityAdminStats', { community_id: community.id })).data,
    refetchInterval: active ? 30000 : false,
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const c = data.counts || {};
  const stats = [
    { icon: Users, label: 'Total Members', value: c.total ?? 0, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { icon: Wifi, label: 'Online Now', value: onlineCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { icon: Inbox, label: 'Pending Requests', value: c.pending ?? 0, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { icon: Radio, label: 'Active Nets', value: (data.active_nets || []).length, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { icon: Calendar, label: 'Upcoming Events', value: (data.upcoming_events || []).length, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { icon: TrendingUp, label: 'New This Week', value: c.joined_this_week ?? 0, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="p-3 rounded-xl bg-card border border-border">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      {(c.pending ?? 0) > 0 && (
        <Link
          to={`/c/${community.slug}/admin/requests`}
          className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/50 transition-colors"
        >
          <Inbox className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{c.pending} pending join request{c.pending > 1 ? 's' : ''}</p>
            <p className="text-xs text-muted-foreground">Tap to review</p>
          </div>
        </Link>
      )}

      <section className="p-4 rounded-xl bg-card border border-border">
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> Recent Activity
        </h2>
        {(data.recent_activity || []).length === 0 ? (
          <p className="text-xs text-muted-foreground">No recent admin activity.</p>
        ) : (
          <div className="space-y-2.5">
            {data.recent_activity.map((a) => (
              <div key={a.id} className="flex items-start gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground">
                    <span className="font-medium">{a.admin_name || 'Admin'}</span>{' '}
                    <span className="text-muted-foreground">{formatAction(a.action)}</span>
                    {a.target_user_name ? <> <span className="font-medium">{a.target_user_name}</span></> : null}
                  </p>
                  {a.reason && <p className="text-muted-foreground/70">Reason: {a.reason}</p>}
                  <p className="text-[10px] text-muted-foreground/60">{a.created_date && format(new Date(a.created_date), "MMM d 'at' h:mm a")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}