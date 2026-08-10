import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommunity } from '@/contexts/CommunityContext';
import { mist } from '@/api/mist';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Crown, Shield, Radio, Star, Users } from 'lucide-react';
import { format } from 'date-fns';

const GROUPS = [
  { role: 'community_owner', title: 'Community Owner', icon: Crown, color: 'text-amber-400', badge: 'Owner' },
  { role: 'community_admin', title: 'Administrators', icon: Shield, color: 'text-violet-400', badge: 'Admin' },
  { role: 'moderator', title: 'Moderators', icon: Shield, color: 'text-cyan-400', badge: 'Moderator' },
  { role: 'net_control', title: 'Net Control Operators', icon: Radio, color: 'text-emerald-400', badge: 'Net Control' },
  { role: 'trusted_member', title: 'Trusted Members', icon: Star, color: 'text-sky-400', badge: 'Trusted' },
];

export default function CommunityStaff() {
  const { community } = useCommunity();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['community-staff', community.id],
    queryFn: async () => (await mist.functions.invoke('listCommunityStaff', { community_id: community.id })).data,
  });

  const grouped = data?.grouped || {};
  const anyStaff = Object.values(grouped).some((a) => a.length > 0);

  return (
    <div className="p-4 space-y-4 pb-10">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(`/c/${community.slug}`)} className="p-1 -ml-1 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <Users className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-bold text-foreground">Community Staff</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : !anyStaff ? (
        <p className="text-center text-sm text-muted-foreground py-8">No staff members yet.</p>
      ) : (
        <div className="space-y-6">
          {GROUPS.map((g) => {
            const list = grouped[g.role] || [];
            if (list.length === 0) return null;
            const Icon = g.icon;
            return (
              <section key={g.role}>
                <h2 className="flex items-center gap-2 text-sm font-bold text-foreground mb-2">
                  <Icon className={`w-4 h-4 ${g.color}`} />
                  {g.title}
                  <span className="text-muted-foreground font-normal">({list.length})</span>
                </h2>
                <div className="space-y-2">
                  {list.map((m) => <StaffCard key={m.user_id} m={m} badge={g.badge} color={g.color} />)}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StaffCard({ m, badge, color }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
      {m.user_avatar ? (
        <img src={m.user_avatar} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-base font-bold text-primary shrink-0">
          {(m.user_name || '?')[0]}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground truncate">{m.user_name}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded bg-secondary font-medium ${color}`}>{badge}</span>
        </div>
        {m.user_callsign && <p className="text-xs text-primary">{m.user_callsign}</p>}
        {m.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.bio}</p>}
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          {m.last_active ? `Active ${format(new Date(m.last_active), 'MMM d')}` : 'Recently joined'}
        </p>
      </div>
    </div>
  );
}