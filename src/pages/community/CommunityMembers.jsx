import React from 'react';
import { useCommunity } from '@/contexts/CommunityContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';

const roleBadge = {
  community_owner: { label: 'Owner', color: 'bg-amber-500/20 text-amber-400' },
  community_admin: { label: 'Admin', color: 'bg-violet-500/20 text-violet-400' },
  moderator: { label: 'Mod', color: 'bg-blue-500/20 text-blue-400' },
  trusted_member: { label: 'Trusted', color: 'bg-cyan-500/20 text-cyan-400' },
  member: { label: 'Member', color: 'bg-slate-500/20 text-slate-400' },
  guest: { label: 'Guest', color: 'bg-slate-500/20 text-slate-400' },
};

export default function CommunityMembers() {
  const { community } = useCommunity();

  const { data: members, isLoading } = useQuery({
    queryKey: ['community-members', community.id],
    queryFn: async () => {
      return await base44.entities.CommunityMember.filter(
        { community_id: community.id, is_active: true },
        'joined_date',
        100
      );
    },
  });

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-bold text-foreground mb-2">
        Members {members && `(${members.length})`}
      </h1>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && members?.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No members found.</p>
        </div>
      )}

      {members?.map((member) => {
        const badge = roleBadge[member.role] || roleBadge.member;
        return (
          <div
            key={member.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
          >
            {member.user_avatar ? (
              <img
                src={member.user_avatar}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                {(member.user_name || '?').charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {member.user_name || 'Unknown'}
              </p>
              {member.user_callsign && (
                <p className="text-xs text-muted-foreground">{member.user_callsign}</p>
              )}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
              {badge.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}