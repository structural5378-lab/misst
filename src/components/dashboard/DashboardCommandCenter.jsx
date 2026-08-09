import React from 'react';
import { Link } from 'react-router-dom';
import { Mic } from 'lucide-react';
import { MISST_ASSETS } from '@/lib/misstAssets';

// DashboardCommandCenter — large cinematic command panel. The environment
// artwork is the scene background; the operator artwork is a prominent visual
// on the left; the existing Net Control CTA lives on the right. Decorative only
// — NOT wired to the weather/lightning engine. Net Control route unchanged.
export default function DashboardCommandCenter() {
  return (
    <section className="relative rounded-3xl overflow-hidden border border-violet-500/20 min-h-[300px] sm:min-h-[340px]">
      {/* environment scene background */}
      <img src={MISST_ASSETS.MISST_COMMAND_ENVIRONMENT.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
      {/* readability overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 h-full">
        {/* operator art + label */}
        <div className="relative flex flex-col items-center justify-center gap-3 p-6 min-h-[220px]">
          <img src={MISST_ASSETS.MISST_COMMAND_OPERATOR.url} alt="" className="w-40 h-40 sm:w-48 sm:h-48 object-contain" style={{ filter: 'drop-shadow(0 0 24px rgba(139,92,246,0.45))' }} />
          <div className="text-center">
            <p className="text-[10px] font-bold text-cyan-300/80 tracking-[0.25em] uppercase">MISST</p>
            <p className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight" style={{ textShadow: '0 2px 14px rgba(0,0,0,0.9)' }}>Command Center</p>
          </div>
        </div>

        {/* net control CTA */}
        <div className="relative flex flex-col items-center justify-center gap-4 p-6 min-h-[220px] sm:border-l border-violet-500/15">
          <Link to="/net-control" className="relative flex flex-col items-center gap-3 active:scale-95 transition-transform">
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-500/30 to-violet-700/30 border-2 border-cyan-400/50" style={{ boxShadow: '0 0 36px rgba(6,182,212,0.45), inset 0 0 24px rgba(6,182,212,0.2)' }}>
              <Mic className="w-10 h-10 text-cyan-100" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white tracking-wide">Net Control</p>
              <p className="text-sm text-cyan-300/80 font-medium mt-0.5">Push to Talk</p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}