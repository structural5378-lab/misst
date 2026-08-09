import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Radio, UserCircle2, ChevronRight } from 'lucide-react';
import { useMistUser } from '@/hooks/useMistUser';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// DashboardMetadata — subtle operator metadata row (Joined / Community /
// License) separated by hairlines — not three cards — plus the "View Full
// Profile" CTA. Reuses the shared stats query.
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
    { icon: Calendar, label: 'Member Since', value: memberSince, color: 'text-violet-300' },
    { icon: Users, label: 'Community', value: club, color: 'text-cyan-300' },
    { icon: Radio, label: 'License', value: 'GMRS Licensed', color: 'text-emerald-300' },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-stretch">
      <div className="flex-1 flex items-center justify-around sm:justify-start sm:gap-6 py-1">
        {cols.map((c, i) => {
          const Icon = c.icon;
          return (
            <React.Fragment key={c.label}>
              {i > 0 && <div className="h-8 w-px bg-white/[0.08] hidden sm:block" />}
              <div className="flex flex-col items-center sm:items-start gap-1 text-center sm:text-left">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${c.color}`} />
                  <span className="text-[9px] font-semibold text-white/40 tracking-widest uppercase">{c.label}</span>
                </div>
                <span className="text-sm font-bold text-white/90 leading-tight truncate max-w-[140px]">{c.value}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <Link
        to="/profile"
        className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-violet-400/30 active:scale-[0.99] transition-all shrink-0"
      >
        <UserCircle2 className="w-4 h-4 text-violet-300" />
        <span className="text-sm font-semibold text-white/90">View Full Profile</span>
        <ChevronRight className="w-4 h-4 text-violet-300" />
      </Link>
    </div>
  );
}