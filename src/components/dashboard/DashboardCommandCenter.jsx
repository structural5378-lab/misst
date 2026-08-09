import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, RadioTower } from 'lucide-react';

// DashboardCommandCenter — the large dramatic command panel. Left: a big
// circular Net Control "Push to Talk" button (cyan glow) linking to the
// existing /net-control route. Right: a cinematic radio-tower / storm banner
// ("You don't just monitor. You control.") — decorative atmosphere only, NOT
// wired to the weather/lightning engine.
export default function DashboardCommandCenter() {
  return (
    <div className="mist-module rounded-3xl overflow-hidden grid grid-cols-1 sm:grid-cols-2" style={{ '--mod-glow': 'rgba(139,92,246,0.30)' }}>
      <Link to="/net-control" className="relative z-10 flex flex-col items-center justify-center gap-4 p-8 min-h-[280px] active:scale-95 transition-transform">
        <div className="mist-command-btn mist-pulse-soft w-28 h-28 rounded-full flex items-center justify-center">
          <Mic className="w-12 h-12 text-cyan-100" />
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-white tracking-wide">Net Control</p>
          <p className="text-sm text-cyan-300/80 font-medium mt-1">Push to Talk</p>
        </div>
      </Link>
      <div className="mist-tower-visual relative z-10 flex flex-col items-center justify-center p-8 min-h-[280px] border-t sm:border-t-0 sm:border-l border-violet-500/15 text-center">
        <RadioTower className="relative z-10 w-20 h-20 text-violet-200/85 mb-4" style={{ filter: 'drop-shadow(0 0 18px rgba(139,92,246,0.85))' }} />
        <p className="relative z-10 text-base font-bold text-white/85 leading-snug">
          You don&apos;t just monitor.<br />
          <span className="text-violet-300">You control.</span>
        </p>
      </div>
    </div>
  );
}