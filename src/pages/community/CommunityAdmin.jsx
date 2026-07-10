import React from 'react';
import { useCommunity } from '@/contexts/CommunityContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Shield, Users, Settings, Eye } from 'lucide-react';

export default function CommunityAdmin() {
  const { community, settings, permissions, hasPermission } = useCommunity();
  const canManage = hasPermission('community:manage_settings');

  const { data: members } = useQuery({
    queryKey: ['community-admin-members', community.id],
    queryFn: async () => {
      return await base44.entities.CommunityMember.filter(
        { community_id: community.id, is_active: true },
        'joined_date',
        100
      );
    },
    enabled: canManage,
  });

  if (!canManage) {
    return (
      <div className="p-4 text-center py-12">
        <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">You do not have admin access to this community.</p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          Your role: {permissions.community_role || 'guest'}
        </p>
      </div>
    );
  }

  let features = {};
  try {
    features = settings?.features_enabled ? JSON.parse(settings.features_enabled) : {};
  } catch {
    features = {};
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Community Admin</h1>
      </div>

      {/* Community info */}
      <section className="p-4 rounded-xl bg-card border border-border">
        <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1">
          <Settings className="w-4 h-4" /> Community Info
        </h2>
        <dl className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="text-foreground font-medium">{community.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Slug</dt>
            <dd className="text-foreground font-mono">/c/{community.slug}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Visibility</dt>
            <dd className="text-foreground">{community.visibility}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Plan</dt>
            <dd className="text-foreground">{community.plan}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Members</dt>
            <dd className="text-foreground">{community.member_count}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Timezone</dt>
            <dd className="text-foreground">{community.timezone}</dd>
          </div>
        </dl>
      </section>

      {/* Features */}
      <section className="p-4 rounded-xl bg-card border border-border">
        <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1">
          <Eye className="w-4 h-4" /> Feature Toggles
        </h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(features).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-muted-foreground capitalize">{key}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  val ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                }`}
              >
                {val ? 'ON' : 'OFF'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Members management */}
      <section className="p-4 rounded-xl bg-card border border-border">
        <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1">
          <Users className="w-4 h-4" /> Members ({members?.length || 0})
        </h2>
        <div className="space-y-2">
          {members?.map((m) => (
            <div key={m.id} className="flex items-center gap-2 text-xs">
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-medium truncate">{m.user_name}</p>
                <p className="text-muted-foreground truncate">{m.user_email}</p>
              </div>
              <span className="text-muted-foreground capitalize shrink-0">{m.role}</span>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-muted-foreground/60 text-center">
        Full admin controls will be built in a later phase.
      </p>
    </div>
  );
}