import React, { useState } from 'react';
import { useCommunity } from '@/contexts/CommunityContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Users, Shield } from 'lucide-react';
import LicenseBadge from '@/components/profile/LicenseBadge';
import MemberRoleManager from '@/components/community/MemberRoleManager';
import { communityRoleLabel } from '@/lib/communityPermissions';

const roleBadge = {
  community_owner: { label: 'Owner', color: 'bg-amber-500/20 text-amber-400' },
  community_admin: { label: 'Admin', color: 'bg-violet-500/20 text-violet-400' },
  net_control: { label: 'Net Control', color: 'bg-cyan-500/20 text-cyan-400' },
  moderator: { label: 'Mod', color: 'bg-blue-500/20 text-blue-400' },
  trusted_member: { label: 'Trusted', color: 'bg-cyan-500/20 text-cyan-400' },
  member: { label: 'Member', color: 'bg-slate-500/20 text-slate-400' },
  guest: { label: 'Guest', color: 'bg-slate-500/20 text-slate-400' },
};

export default function CommunityMembers() {
  const { community } = useCommunity();
  const [selected, setSelected] = useState(null);

  // Membership-validated, community-scoped roster (server enforces isolation).
  // The function denies access if the caller is not an active member of this
  // community, and never reads the global User table — so users from other
  // communities can never appear here.
  const { data, isLoading, isError } = useQuery({
    queryKey: ['community-members', community.id],
    queryFn: async () =>
      (await base44.functions.invoke('listCommunityMembers', { community_id: community.id })).data,
    enabled: !!community?.id,
  });
  const members = data?.members || [];
  const counts = data?.counts;

  // Resolve the current user's community role so only owners/admins see the
  // per-member role manager (server still enforces the actual write).
  const { data: myPerms } = useQuery({
    queryKey: ['community-perms-me', community.id],
    queryFn: async () => (await base44.functions.invoke('resolvePermissions', { community_id: community.id })).data,
  });
  const canManage = !!myPerms?.is_community_owner || !!myPerms?.is_community_admin;

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-bold text-foreground mb-2">
        Members {counts ? `(${counts.total})` : ''}
      </h1>

      {isError && (
        <div className="text-center py-12">
          <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Access Denied</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Join this community to view its members.</p>
        </div>
      )}

      {!isError && isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {!isError && !isLoading && members?.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No members found.</p>
        </div>
      )}

      {members?.map((member) => {
        const badge = roleBadge[member.role] || roleBadge.member;
        return (
          <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
            {member.user_avatar ? (
              <img src={member.user_avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                {(member.user_name || '?').charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{member.user_name || 'Unknown'}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <LicenseBadge callsign={member.user_callsign} size="sm" showCallsign={false} className="!py-0.5 !px-2" />
                {member.user_callsign && (
                  <span className="text-[11px] font-semibold text-primary tracking-wider">{member.user_callsign}</span>
                )}
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>{badge.label}</span>
            {canManage && (
              <button
                onClick={() => setSelected(member)}
                className="ml-1 p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                title="Manage role"
              >
                <Shield className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}

      {selected && (
        <MemberRoleManager
          member={selected}
          onClose={() => setSelected(null)}
          onSaved={(updated) => {
            setSelected(null);
            // Optimistically reflect the new role label in the list
            if (members) {
              const idx = members.findIndex((m) => m.id === updated.id);
              if (idx >= 0) members[idx].role = updated.role;
            }
          }}
        />
      )}
    </div>
  );
}