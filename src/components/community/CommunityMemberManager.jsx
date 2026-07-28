import React, { useState } from 'react';
import { useCommunity } from '@/contexts/CommunityContext';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react';
import CommunityMemberRow from './CommunityMemberRow';
import MemberModerationProfile from './MemberModerationProfile';

export default function CommunityMemberManager() {
  const { community } = useCommunity();
  const qc = useQueryClient();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('active');
  const [profileTarget, setProfileTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['community-admin-members', community.id, query],
    queryFn: async () =>
      (await base44.functions.invoke('listCommunityMembers', { community_id: community.id, admin_view: true, query })).data,
    refetchInterval: 30000,
  });

  const counts = data?.counts || {};
  const members = (data?.members || []).filter((m) => (status === 'active' ? m.status === 'active' : m.status === status));

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['community-admin-members', community.id] });
    qc.invalidateQueries({ queryKey: ['community-admin-stats', community.id] });
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, callsign, or email…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary outline-none"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {['active', 'pending', 'suspended', 'banned'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap border transition-colors ${
              status === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/40'
            }`}
          >
            {s} {counts[s] != null && `(${counts[s]})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No {status} members.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <CommunityMemberRow key={m.id} member={m} communityId={community.id} onChanged={invalidate} onOpenProfile={setProfileTarget} />
          ))}
        </div>
      )}

      {profileTarget && (
        <MemberModerationProfile community={community} target={profileTarget} onClose={() => setProfileTarget(null)} onChanged={invalidate} />
      )}
    </div>
  );
}