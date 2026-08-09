import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, RadioTower } from 'lucide-react';

// DashboardCommandCenter — the split command panel from the reference. Left: a
// large circular Net Control "Push to Talk" button linking to the existing
// /net-control (Mission Control) route. Right: a purely visual radio-tower /
// storm banner ("You don't just monitor. You control.") — decorative only, NOT
// wired to the weather/lightning engine.
export default function DashboardCommandCenter() {
  return (
    <div className="mist-quick-tile rounded-3xl overflow-hidden grid grid-cols-2" style={{ '--tile-glow': 'rgba(139,92,246,0.5)' }}>
      <Link to="/net-control" className="flex flex-col items-center justify-center gap-3 p-5 active:scale-95 transition-transform">
        <div className="mist-command-btn mist-pulse-soft w-20 h-20 rounded-full flex items-center justify-center">
          <Mic className="w-9 h-9 text-violet-100" />
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-white tracking-widest">NET CONTROL</p>
          <p className="text-[10px] text-cyan-300 font-semibold tracking-wide mt-0.5">Push to Talk</p>
        </div>
      </Link>
      <div className="mist-tower-visual relative flex flex-col items-center justify-center p-5 border-l border-violet-500/15 text-center">
        <RadioTower className="w-11 h-11 text-violet-300/80 mb-2" style={{ filter: 'drop-shadow(0 0 10px rgba(139,92,246,0.65))' }} />
        <p className="text-[11px] font-bold text-white/80 leading-tight">
          YOU DON'T JUST MONITOR.<br />
          <span className="text-violet-300">YOU CONTROL.</span>
        </p>
      </div>
    </div>
  );
}