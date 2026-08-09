import React from 'react';
import { Link } from 'react-router-dom';
import { Mic } from 'lucide-react';
import { MISST_ASSETS } from '@/lib/misstAssets';

// DashboardCommandCenter — the second hero. The environment artwork establishes
// the scene; the operator artwork is a prominent visible element; the existing
// Net Control CTA is the primary control inside this environment. Decorative
// only — NOT wired to weather/lightning. Route unchanged.
export default function DashboardCommandCenter() {
  return (
    <section className="relative rounded-3xl overflow-hidden border border-violet-500/20 min-h-[340px] sm:min-h-[380px]">
      {/* environment scene */}
      <img src={MISST_ASSETS.MISST_COMMAND_ENVIRONMENT.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
      {/* tactical grid texture (CSS overlay, not faked artwork) */}
      <div className="absolute inset-0 opacity-[0.18] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.18) 1px, transparent 1px)', backgroundSize: '34px 34px' }} />

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 h-full">
        {/* operator art + label */}
        <div className="flex flex-col justify-center items-center gap-4 p-6 sm:p-8 min-h-[240px]">
          <img src={MISST_ASSETS.MISST_COMMAND_OPERATOR.url} alt="" className="w-44 h-44 sm:w-52 sm:h-52 object-contain" style={{ mixBlendMode: 'screen', filter: 'drop-shadow(0 0 28px rgba(139,92,246,0.5))' }} />
          <div className="text-center">
            <p className="text-[10px] font-bold text-cyan-300/80 tracking-[0.3em] uppercase">MISST</p>
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight" style={{ textShadow: '0 2px 14px rgba(0,0,0,0.9)' }}>Command Center</p>
          </div>
        </div>

        {/* net control CTA */}
        <div className="flex flex-col justify-center items-center gap-3 p-6 sm:p-8 sm:border-l border-violet-500/15 min-h-[200px]">
          <Link to="/net-control" className="flex flex-col items-center gap-3 active:scale-95 transition-transform">
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-500/30 to-violet-700/30 border-2 border-cyan-400/50" style={{ boxShadow: '0 0 40px rgba(6,182,212,0.5), inset 0 0 28px rgba(6,182,212,0.25)' }}>
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