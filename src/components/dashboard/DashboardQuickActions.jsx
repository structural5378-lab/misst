import React from 'react';
import { Link } from 'react-router-dom';
import { MISST_ASSETS } from '@/lib/misstAssets';

// DashboardQuickActions — four substantial feature tiles using the MISST
// artwork pack. The artwork is the dominant visual element (not a tiny icon);
// title + short description overlay at the bottom. Mobile: 2x2, desktop: 4-up.
// Navigation routes are unchanged from the previous implementation.
const MODULES = [
  { art: MISST_ASSETS.MISST_TILE_CHAT, title: 'Chat', subtitle: 'Conversations', path: '/messages', live: true },
  { art: MISST_ASSETS.MISST_TILE_TOOLS, title: 'Tools', subtitle: 'Utilities & gear', path: '/tools' },
  { art: MISST_ASSETS.MISST_TILE_ACTIVITY, title: 'Activity', subtitle: 'Live operator ops', path: '/alerts', live: true },
  { art: MISST_ASSETS.MISST_TILE_RANKINGS, title: 'Rankings', subtitle: 'Leaderboard', path: '/leaderboard' },
];

export default function DashboardQuickActions() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {MODULES.map((m) => (
        <Link
          key={m.title}
          to={m.path}
          className="group relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent min-h-[176px] flex items-end p-4 active:scale-[0.97] transition-transform"
        >
          {/* artwork — significant visual element */}
          <img src={m.art.url} alt="" className="absolute inset-0 w-full h-full object-contain p-3 opacity-95 transition-transform duration-300 group-hover:scale-105" />
          {/* readability gradient at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
          {/* live pulse */}
          {m.live && <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-2 ring-black/50" />}
          {/* title + subtitle */}
          <div className="relative z-10 text-center w-full">
            <p className="text-lg font-bold text-white leading-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>{m.title}</p>
            <p className="text-[11px] text-white/65 mt-0.5">{m.subtitle}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}