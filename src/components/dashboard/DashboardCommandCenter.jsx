import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, RadioTower } from 'lucide-react';

// DashboardCommandCenter — the dramatic split command panel. Left: a large
// circular Net Control "Push to Talk" button (cyan/blue glow) linking to the
// existing /net-control route. Right: a cinematic radio-tower / storm banner
// ("You don't just monitor. You control.") — decorative atmosphere only, NOT
// wired to the weather/lightning engine.
export default function DashboardCommandCenter() {
  return (
    <div className="mist-module rounded-3xl overflow-hidden grid grid-cols-1 sm:grid-cols-2" style={{ '--mod-glow': 'rgba(139,92,246,0.28)' }}>
      <Link to="/net-control" className="relative z-10 flex flex-col items-center justify-center gap-3 p-6 sm:p-8 min-h-[210px] active:scale-95 transition-transform">
        <div className="mist-command-btn mist-pulse-soft w-24 h-24 rounded-full flex items-center justify-center">
          <Mic className="w-10 h-10 text-cyan-100" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-white tracking-wide">Net Control</p>
          <p className="text-xs text-cyan-300/80 font-medium mt-0.5">Push to Talk</p>
        </div>
      </Link>
      <div className="mist-tower-visual relative z-10 flex flex-col items-center justify-center p-6 sm:p-8 min-h-[210px] border-t sm:border-t-0 sm:border-l border-violet-500/15 text-center">
        <RadioTower className="relative z-10 w-14 h-14 text-violet-200/85 mb-3" style={{ filter: 'drop-shadow(0 0 14px rgba(139,92,246,0.8))' }} />
        <p className="relative z-10 text-sm font-bold text-white/85 leading-snug">
          You don&apos;t just monitor.<br />
          <span className="text-violet-300">You control.</span>
        </p>
      </div>
    </div>
  );
}