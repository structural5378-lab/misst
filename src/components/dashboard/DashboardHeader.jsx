import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Radio } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useMistUser } from '@/hooks/useMistUser';

// DashboardHeader — compact top bar: brand mark, notification bell, profile avatar.
// Presentation only; reuses existing auth identity + alert query. No new logic.
export default function DashboardHeader() {
  const { mistUser } = useMistUser();

  const { data: alerts = [] } = useQuery({
    queryKey: ['dashboard-header-alerts'],
    queryFn: async () => {
      const all = await base44.entities.Alert.list('-created_date', 12);
      return all.filter((a) => !a.title?.startsWith('__') && !a.is_read);
    },
    staleTime: 30000,
  });
  const unread = alerts.length;

  const avatar = mistUser?.avatarUrl;

  return (
    <header className="flex items-center justify-between gap-3 py-1">
      <Link to="/" className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/[0.04] border border-white/[0.08]">
          <Radio className="w-4 h-4 text-violet-300" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-white tracking-[0.15em] leading-none">MISST</p>
          <p className="text-[8px] font-semibold text-white/35 tracking-[0.25em] uppercase leading-none mt-0.5">Command</p>
        </div>
      </Link>

      <div className="flex items-center gap-1.5 shrink-0">
        <Link to="/notifications" className="relative p-2 rounded-lg text-white/55 hover:text-white transition-colors" aria-label="Notifications">
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] flex items-center justify-center rounded-full bg-rose-500 text-white text-[8px] font-bold px-1">{unread > 9 ? '9+' : unread}</span>
          )}
        </Link>
        <Link to="/profile" className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0 bg-violet-950/50" aria-label="Profile">
          {avatar ? (
            <img src={avatar} alt="profile" className="w-full h-full object-cover" onError={(e) => { e.target.style.opacity = 0; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-violet-300 text-xs font-bold">M</div>
          )}
        </Link>
      </div>
    </header>
  );
}