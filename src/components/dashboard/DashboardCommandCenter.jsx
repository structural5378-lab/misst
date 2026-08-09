import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, RadioTower } from 'lucide-react';

// DashboardCommandCenter — the split command panel. Left: a large circular Net
// Control "Push to Talk" button linking to the existing /net-control route.
// Right: a purely decorative radio-tower / storm banner ("You don't just
// monitor. You control.") — NOT wired to the weather/lightning engine.
export default function DashboardCommandCenter() {
  return (
    <div className="mist-module rounded-3xl overflow-hidden grid grid-cols-1 sm:grid-cols-2" style={{ '--mod-glow': 'rgba(139,92,246,0.28)' }}>
      <Link to="/net-control" className="flex flex-col items-center justify-center gap-3 p-6 active:scale-95 transition-transform">
        <div className="mist-command-btn mist-pulse-soft w-20 h-20 rounded-full flex items-center justify-center">
          <Mic className="w-9 h-9 text-violet-100" />
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-white tracking-wide">Net Control</p>
          <p className="text-[11px] text-cyan-300/80 font-medium mt-0.5">Push to Talk</p>
        </div>
      </Link>
      <div className="mist-tower-visual relative flex flex-col items-center justify-center p-6 border-t sm:border-t-0 sm:border-l border-violet-500/15 text-center">
        <RadioTower className="w-12 h-12 text-violet-300/80 mb-3" style={{ filter: 'drop-shadow(0 0 12px rgba(139,92,246,0.7))' }} />
        <p className="text-sm font-bold text-white/85 leading-snug">
          You don&apos;t just monitor.<br />
          <span className="text-violet-300">You control.</span>
        </p>
      </div>
    </div>
  );
}