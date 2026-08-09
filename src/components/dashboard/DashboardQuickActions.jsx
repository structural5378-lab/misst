import React from 'react';
import { Link } from 'react-router-dom';
import { MISST_ASSETS } from '@/lib/misstAssets';

// DashboardQuickActions — four substantial MISST modules. The approved artwork
// is the dominant upper visual of each tile; title + descriptor sit beneath.
// Mobile: 2×2 grid. Desktop: strong 4-column row. Routes unchanged.
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
          className="group relative rounded-2xl overflow-hidden border border-white/[0.08] bg-card/40 backdrop-blur-md min-h-[196px] flex flex-col active:scale-[0.97] transition-transform"
        >
          {/* artwork — dominant upper visual (screen blend over the glass tile) */}
          <div className="relative flex-1 flex items-center justify-center p-4">
            <img src={m.art.url} alt="" className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" style={{ mixBlendMode: 'screen' }} />
            {m.live && <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-2 ring-black/50" />}
          </div>
          {/* title + descriptor */}
          <div className="relative px-4 pb-4 pt-1 text-center">
            <p className="text-base font-bold text-white leading-tight">{m.title}</p>
            <p className="text-[11px] text-white/55 mt-0.5">{m.subtitle}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}