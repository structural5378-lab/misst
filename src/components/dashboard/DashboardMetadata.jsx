import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Radio, UserCircle2, ChevronRight } from 'lucide-react';
import { useMistUser } from '@/hooks/useMistUser';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// DashboardMetadata — compact operator metadata panel (Joined / Community /
// License) plus the "View Full Profile" CTA. Reuses the shared stats query.
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
    <div className="flex flex-col sm:flex-row gap-3 items-stretch">
      {/* compact metadata panel */}
      <div className="flex-1 rounded-2xl bg-card/40 backdrop-blur-md border border-white/[0.06] px-4 py-3 grid grid-cols-3 divide-x divide-white/[0.06]">
        {cols.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="flex flex-col items-center gap-1 text-center px-2">
              <Icon className={`w-4 h-4 ${c.color}`} />
              <span className="text-[9px] font-semibold text-white/45 tracking-widest uppercase">{c.label}</span>
              <span className="text-xs font-bold text-white/90 leading-tight truncate w-full">{c.value}</span>
            </div>
          );
        })}
      </div>
      {/* CTA */}
      <Link
        to="/profile"
        className="rounded-2xl flex items-center justify-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-violet-600/25 to-cyan-500/15 border border-violet-400/30 active:scale-[0.99] transition-transform shrink-0 sm:w-auto w-full"
      >
        <UserCircle2 className="w-5 h-5 text-violet-200" />
        <span className="text-sm font-bold text-white/90">View Full Profile</span>
        <ChevronRight className="w-4 h-4 text-violet-300" />
      </Link>
    </div>
  );
}