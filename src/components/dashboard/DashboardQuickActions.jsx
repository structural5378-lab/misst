import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Wrench, Activity, Crown } from 'lucide-react';

// DashboardQuickActions — four prominent command-module tiles (not tiny
// toolbar icons). Each tile is a large square with a colored glowing border,
// a big icon, a bold title, and a small status subtitle. Chat & Activity carry
// a LIVE pulse. Desktop: 4-up; mobile: 2x2.
const MODULES = [
  { icon: MessageSquare, title: 'Chat', subtitle: 'Conversations', path: '/messages', glow: 'rgba(34,211,238,0.5)', border: 'rgba(34,211,238,0.38)', color: 'text-cyan-300', tint: 'rgba(34,211,238,0.12)', live: true },
  { icon: Wrench, title: 'Tools', subtitle: 'Utilities & gear', path: '/tools', glow: 'rgba(251,146,60,0.5)', border: 'rgba(251,146,60,0.38)', color: 'text-amber-300', tint: 'rgba(251,146,60,0.12)' },
  { icon: Activity, title: 'Activity', subtitle: 'Live operator ops', path: '/alerts', glow: 'rgba(139,92,246,0.5)', border: 'rgba(139,92,246,0.38)', color: 'text-violet-300', tint: 'rgba(139,92,246,0.12)', live: true },
  { icon: Crown, title: 'Rankings', subtitle: 'Leaderboard', path: '/leaderboard', glow: 'rgba(250,204,21,0.5)', border: 'rgba(250,204,21,0.38)', color: 'text-yellow-300', tint: 'rgba(250,204,21,0.12)' },
];

export default function DashboardQuickActions() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {MODULES.map((m) => {
        const Icon = m.icon;
        return (
          <Link
            key={m.title}
            to={m.path}
            className="mist-module p-5 flex flex-col items-center justify-center gap-3 min-h-[150px] active:scale-[0.97] transition-transform"
            style={{ '--mod-glow': m.glow, borderColor: m.border, boxShadow: `0 0 26px -10px ${m.glow}` }}
          >
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl" style={{ background: m.tint, boxShadow: `0 0 26px -6px ${m.glow}` }}>
              <Icon className={`w-7 h-7 ${m.color}`} />
              {m.live && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />}
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white leading-tight">{m.title}</p>
              <p className="text-[11px] text-white/45 mt-0.5">{m.subtitle}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}