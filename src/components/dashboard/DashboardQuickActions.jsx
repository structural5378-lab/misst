import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Wrench, Activity, Crown } from 'lucide-react';

// DashboardQuickActions — four distinct MISST command modules (not identical
// cards). Each has its own atmospheric tint, restrained glow, larger icon, and
// a subtitle that signals its role (communication / equipment / live ops /
// progression). Chat & Activity carry a subtle LIVE indicator. Desktop: 4-up;
// mobile: 2x2.
const MODULES = [
  { icon: MessageSquare, title: 'Chat', subtitle: 'Conversations', path: '/messages', glow: 'rgba(34,211,238,0.30)', color: 'text-cyan-300', tint: 'rgba(34,211,238,0.10)', live: true },
  { icon: Wrench, title: 'Tools', subtitle: 'Utilities & gear', path: '/tools', glow: 'rgba(251,146,60,0.28)', color: 'text-amber-300', tint: 'rgba(251,146,60,0.10)' },
  { icon: Activity, title: 'Activity', subtitle: 'Live operator ops', path: '/alerts', glow: 'rgba(139,92,246,0.30)', color: 'text-violet-300', tint: 'rgba(139,92,246,0.10)', live: true },
  { icon: Crown, title: 'Rankings', subtitle: 'Leaderboard', path: '/leaderboard', glow: 'rgba(250,204,21,0.28)', color: 'text-yellow-300', tint: 'rgba(250,204,21,0.10)' },
];

export default function DashboardQuickActions() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {MODULES.map((m) => {
        const Icon = m.icon;
        return (
          <Link key={m.title} to={m.path} className="mist-module p-4 flex flex-col gap-3 active:scale-[0.97] transition-transform" style={{ '--mod-glow': m.glow }}>
            <div className="relative flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: m.tint, boxShadow: `0 0 24px -6px ${m.glow}` }}>
                <Icon className={`w-6 h-6 ${m.color}`} />
              </div>
              {m.live && (
                <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-300/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
                </span>
              )}
            </div>
            <div>
              <p className="text-base font-bold text-white leading-tight">{m.title}</p>
              <p className="text-[11px] text-white/40 mt-0.5">{m.subtitle}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}