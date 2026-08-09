import React from 'react';
import { Link } from 'react-router-dom';
import { MISST_ASSETS } from '@/lib/misstAssets';

// DashboardQuickActions — four MISST modules. The approved artwork is the
// dominant upper visual of each tile; title + descriptor sit beneath. Dark
// glass with a subtle per-tile accent glow (restrained — no heavy borders).
// Mobile: 2×2. Desktop: 4-column row. Routes unchanged.
const MODULES = [
  { art: MISST_ASSETS.MISST_TILE_CHAT, title: 'Chat', subtitle: 'Conversations', path: '/messages', live: true, glow: 'rgba(6,182,212,0.20)' },
  { art: MISST_ASSETS.MISST_TILE_TOOLS, title: 'Tools', subtitle: 'Utilities & gear', path: '/tools', glow: 'rgba(139,92,246,0.20)' },
  { art: MISST_ASSETS.MISST_TILE_ACTIVITY, title: 'Activity', subtitle: 'Live operator ops', path: '/alerts', live: true, glow: 'rgba(34,197,94,0.20)' },
  { art: MISST_ASSETS.MISST_TILE_RANKINGS, title: 'Rankings', subtitle: 'Leaderboard', path: '/leaderboard', glow: 'rgba(245,158,11,0.20)' },
];

export default function DashboardQuickActions() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {MODULES.map((m) => (
        <Link
          key={m.title}
          to={m.path}
          className="group relative rounded-2xl overflow-hidden bg-black/30 backdrop-blur-md min-h-[208px] flex flex-col active:scale-[0.98] transition-transform border border-white/[0.04]"
        >
          {/* subtle per-tile accent glow */}
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full pointer-events-none opacity-70" style={{ background: `radial-gradient(circle, ${m.glow}, transparent 70%)` }} />
          {/* artwork — dominant upper visual (screen blend over dark glass) */}
          <div className="relative flex-1 flex items-center justify-center p-5 min-h-[132px]">
            <img src={m.art.url} alt="" className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" style={{ mixBlendMode: 'screen' }} />
            {m.live && <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          </div>
          {/* title + descriptor */}
          <div className="relative px-4 pb-4 text-center">
            <p className="text-base font-bold text-white leading-tight">{m.title}</p>
            <p className="text-[11px] text-white/45 mt-0.5">{m.subtitle}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}