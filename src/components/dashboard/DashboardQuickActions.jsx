import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { MISST_ASSETS } from '@/lib/misstAssets';

// DashboardQuickActions — four MISST feature modules. The approved artwork is
// the dominant upper visual of each tile; title + descriptor sit beneath; a
// subtle status indicator and arrow affordance complete the portal feel.
// Dark glass with a subtle per-tile accent glow (restrained — no heavy borders).
// Mobile: 2×2. Desktop: 4-column row. Routes unchanged.
const MODULES = [
  { art: MISST_ASSETS.MISST_TILE_CHAT, title: 'Chat', subtitle: 'Conversations', path: '/messages', live: true, status: '2 Unread', glow: 'rgba(139,92,246,0.22)', ring: 'rgba(139,92,246,0.35)' },
  { art: MISST_ASSETS.MISST_TILE_TOOLS, title: 'Tools', subtitle: 'Utilities & gear', path: '/tools', status: 'Active', glow: 'rgba(6,182,212,0.20)', ring: 'rgba(6,182,212,0.30)' },
  { art: MISST_ASSETS.MISST_TILE_ACTIVITY, title: 'Activity', subtitle: 'Live operator ops', path: '/alerts', live: true, status: 'Live', glow: 'rgba(34,197,94,0.20)', ring: 'rgba(34,197,94,0.30)' },
  { art: MISST_ASSETS.MISST_TILE_RANKINGS, title: 'Rankings', subtitle: 'Leaderboard', path: '/leaderboard', status: 'Top 25%', glow: 'rgba(245,158,11,0.20)', ring: 'rgba(245,158,11,0.30)' },
];

export default function DashboardQuickActions() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {MODULES.map((m) => (
        <Link
          key={m.title}
          to={m.path}
          className="group relative rounded-2xl overflow-hidden bg-black/30 backdrop-blur-md min-h-[220px] flex flex-col active:scale-[0.98] transition-transform border border-white/[0.04] hover:border-white/[0.10]"
        >
          {/* subtle per-tile accent glow */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none opacity-80" style={{ background: `radial-gradient(circle, ${m.glow}, transparent 70%)` }} />
          {/* status indicator — top-right */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/[0.08] backdrop-blur-sm">
            {m.live && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            <span className="text-[9px] font-bold text-white/70 tracking-wider uppercase">{m.status}</span>
          </div>
          {/* artwork — dominant upper visual (screen blend over dark glass) */}
          <div className="relative flex-1 flex items-center justify-center p-5 min-h-[130px]">
            <img src={m.art.url} alt="" className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" style={{ mixBlendMode: 'screen' }} />
          </div>
          {/* title + descriptor + arrow */}
          <div className="relative px-4 pb-4 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-base font-bold text-white leading-tight">{m.title}</p>
              <p className="text-[11px] text-white/45 mt-0.5">{m.subtitle}</p>
            </div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-colors" style={{ borderColor: m.ring, background: `${m.glow.replace(/0\.\d+/, '0.08')}` }}>
              <ChevronRight className="w-3.5 h-3.5 text-white/70 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}