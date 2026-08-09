import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, ChevronRight, Shield } from 'lucide-react';
import { MISST_ASSETS } from '@/lib/misstAssets';

// DashboardCommandCenter — the second cinematic centerpiece. The environment
// artwork fills the entire section; the operator artwork is integrated via
// screen blend; the Net Control control is overlaid on the scene. Decorative
// only — NOT wired to weather/lightning. Route unchanged.
export default function DashboardCommandCenter() {
  return (
    <section className="relative rounded-2xl overflow-hidden min-h-[340px] sm:min-h-[400px]">
      {/* environment scene — fills the section */}
      <img src={MISST_ASSETS.MISST_COMMAND_ENVIRONMENT.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
      {/* tactical grid texture */}
      <div className="absolute inset-0 opacity-[0.10] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.4) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 h-full flex flex-col justify-between p-6 sm:p-8 min-h-[340px] sm:min-h-[400px]">
        {/* header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-cyan-300/80 tracking-[0.3em] uppercase">MISST</p>
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1" style={{ textShadow: '0 2px 14px rgba(0,0,0,0.9)' }}>Command Center</p>
            <p className="text-xs text-white/50 mt-1.5 max-w-xs">Mission control for net operations & emergency coordination.</p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-500/10 border border-cyan-400/25 shrink-0">
            <Shield className="w-3.5 h-3.5 text-cyan-300" />
            <span className="text-[10px] font-bold text-cyan-200 tracking-wider uppercase">Net Control</span>
          </div>
        </div>

        {/* operator art + CTA */}
        <div className="flex items-end justify-between gap-4">
          <img src={MISST_ASSETS.MISST_COMMAND_OPERATOR.url} alt="" className="hidden sm:block w-40 h-40 lg:w-48 lg:h-48 object-contain" style={{ mixBlendMode: 'screen', filter: 'drop-shadow(0 0 24px rgba(6,182,212,0.4))' }} />
          <Link to="/net-control" className="group flex flex-col items-end gap-3 active:scale-95 transition-transform">
            <div className="text-right">
              <p className="text-lg font-bold text-white">Net Control</p>
              <p className="text-sm text-cyan-300/80">Start or manage a net</p>
            </div>
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-cyan-500/15 border border-cyan-400/40 group-hover:bg-cyan-500/25 transition-colors" style={{ boxShadow: '0 0 30px rgba(6,182,212,0.25)' }}>
              <Mic className="w-5 h-5 text-cyan-200" />
              <span className="text-sm font-bold text-white tracking-wide">Enter Net Control</span>
              <ChevronRight className="w-4 h-4 text-cyan-200" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}