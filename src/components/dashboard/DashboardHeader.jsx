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
    <header className="flex items-center justify-between gap-3 px-1 pt-1">
      <Link to="/" className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600/30 to-cyan-500/20 border border-violet-400/30 flex items-center justify-center shrink-0" style={{ boxShadow: '0 0 18px -4px rgba(139,92,246,0.5)' }}>
          <Radio className="w-5 h-5 text-violet-200" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-white tracking-wider leading-none truncate">MISST</p>
          <p className="text-[9px] font-semibold text-violet-300/70 tracking-[0.2em] uppercase leading-none mt-0.5">Command</p>
        </div>
      </Link>

      <div className="flex items-center gap-2 shrink-0">
        <Link to="/notifications" className="relative p-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/70 hover:text-white hover:border-violet-400/30 transition-colors" aria-label="Notifications">
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-1">{unread > 9 ? '9+' : unread}</span>
          )}
        </Link>
        <Link to="/profile" className="w-9 h-9 rounded-full overflow-hidden border border-violet-400/30 shrink-0 bg-violet-950/50" aria-label="Profile">
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