import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Wrench, Activity, Crown } from 'lucide-react';

// DashboardQuickActions — four large, equal command-module tiles (not a tiny
// toolbar). Each tile is a substantial square with a colored glowing border,
// a big icon, a bold title, and a small status subtitle. Chat & Activity carry
// a LIVE pulse. Desktop: 4-up; mobile: 2x2.
const MODULES = [
  { icon: MessageSquare, title: 'Chat', subtitle: 'Conversations', path: '/messages', glow: 'rgba(34,211,238,0.5)', border: 'rgba(34,211,238,0.40)', color: 'text-cyan-300', tint: 'rgba(34,211,238,0.12)', live: true },
  { icon: Wrench, title: 'Tools', subtitle: 'Utilities & gear', path: '/tools', glow: 'rgba(251,146,60,0.5)', border: 'rgba(251,146,60,0.40)', color: 'text-amber-300', tint: 'rgba(251,146,60,0.12)' },
  { icon: Activity, title: 'Activity', subtitle: 'Live operator ops', path: '/alerts', glow: 'rgba(139,92,246,0.5)', border: 'rgba(139,92,246,0.40)', color: 'text-violet-300', tint: 'rgba(139,92,246,0.12)', live: true },
  { icon: Crown, title: 'Rankings', subtitle: 'Leaderboard', path: '/leaderboard', glow: 'rgba(250,204,21,0.5)', border: 'rgba(250,204,21,0.40)', color: 'text-yellow-300', tint: 'rgba(250,204,21,0.12)' },
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
            className="mist-module p-5 flex flex-col items-center justify-center gap-3 min-h-[176px] active:scale-[0.97] transition-transform"
            style={{ '--mod-glow': m.glow, borderColor: m.border, boxShadow: `0 0 28px -10px ${m.glow}` }}
          >
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl" style={{ background: m.tint, boxShadow: `0 0 28px -6px ${m.glow}` }}>
              <Icon className={`w-8 h-8 ${m.color}`} />
              {m.live && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-pulse ring-2 ring-[#0c0716]" />}
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white leading-tight">{m.title}</p>
              <p className="text-xs text-white/45 mt-0.5">{m.subtitle}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}