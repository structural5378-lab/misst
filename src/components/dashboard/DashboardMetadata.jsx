import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Radio, UserCircle2, ChevronRight } from 'lucide-react';
import { useMistUser } from '@/hooks/useMistUser';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// DashboardMetadata — the three info columns (Joined / Community / License) plus
// the full-width "View Full Profile" button from the reference. Reuses the shared
// 'operator-card-stats' query (deduped with OperatorCard) so no extra fetch.
export default function DashboardMetadata() {
  const { mybbUser, mistUser } = useMistUser();
  const { data: syncData } = useQuery({
    queryKey: ['operator-card-stats'],
    queryFn: async () => {
      const res = await base44.functions.invoke('syncUserStats', { uid: mybbUser?.uid || mistUser?.id });
      return res.data;
    },
    enabled: !!mybbUser?.uid || !!mistUser?.id,
    staleTime: 30000,
  });
  const stats = syncData?.stats || {};
  const memberSince = mistUser?.memberSince
    ? new Date(mistUser.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : (mistUser?.created_date ? new Date(mistUser.created_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—');
  const club = stats?.club_membership || 'Insomniacs GMRS';

  const cols = [
    { icon: Calendar, label: 'Joined', value: memberSince, color: 'text-violet-300' },
    { icon: Users, label: 'Community', value: club, color: 'text-cyan-300' },
    { icon: Radio, label: 'License', value: 'GMRS Licensed', color: 'text-emerald-300' },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2.5">
        {cols.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="mist-stat-card rounded-2xl px-2 py-3 flex flex-col items-center gap-1.5 text-center">
              <Icon className={`w-4 h-4 ${c.color}`} />
              <span className="text-[8px] font-semibold text-white/45 uppercase tracking-widest">{c.label}</span>
              <span className="text-[11px] font-bold text-white/90 leading-tight truncate w-full">{c.value}</span>
            </div>
          );
        })}
      </div>
      <Link
        to="/profile"
        className="mist-quick-tile rounded-2xl flex items-center justify-between px-4 py-3.5 active:scale-[0.98] transition-transform"
        style={{ '--tile-glow': 'rgba(139,92,246,0.42)' }}
      >
        <span className="flex items-center gap-2.5 text-sm font-bold text-white/90 tracking-wide">
          <UserCircle2 className="w-5 h-5 text-violet-300" /> View Full Profile
        </span>
        <ChevronRight className="w-5 h-5 text-violet-300" />
      </Link>
    </div>
  );
}