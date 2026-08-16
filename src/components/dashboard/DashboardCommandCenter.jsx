import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, ChevronRight, ShieldCheck, Radio, Activity } from 'lucide-react';
import { MISST_ASSETS } from '@/lib/misstAssets';

// DashboardCommandCenter — compact cinematic command bar. Environment art is
// framed as a contained tactical viewport on the left; the right panel carries
// identity, access status, and the Net Control CTA. Decorative only — NOT wired
// to weather/lightning. Route unchanged (/net-control).
export default function DashboardCommandCenter() {
  return (
    <section className="relative rounded-2xl overflow-hidden border border-white/[0.06] min-h-[200px] sm:min-h-[224px] flex">
      {/* ── Left: contained environment viewport ── */}
      <div className="relative w-[38%] sm:w-[42%] shrink-0 overflow-hidden">
        <img src={MISST_ASSETS.MISST_COMMAND_ENVIRONMENT.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-[#0a0612]" />
        {/* tactical grid */}
        <div className="absolute inset-0 opacity-[0.12] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.5) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        {/* corner reticle */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mist-pulse-soft" />
          <span className="text-[8px] font-bold text-cyan-300/80 tracking-[0.25em] uppercase">Live</span>
        </div>
        {/* operator art — blended into the viewport */}
        
      </div>

      {/* ── Right: command panel ── */}
      <div className="relative flex-1 flex flex-col justify-between p-4 sm:p-5 pb-14 bg-gradient-to-br from-[#0c0716]/95 to-[#060309]/98">
        {/* header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[9px] font-bold text-cyan-300/80 tracking-[0.3em] uppercase">MISST</p>
              <span className="h-3 w-px bg-white/15" />
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-400/25">
                <ShieldCheck className="w-3 h-3 text-emerald-300" />
                <span className="text-[8px] font-bold text-emerald-200 tracking-wider uppercase">Net Control</span>
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1.5 leading-none" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}>Command Center</p>
            <p className="text-[11px] text-white/50 mt-1 truncate">Take control. Run the net. Lead the mission.</p>
          </div>
          <Activity className="w-4 h-4 text-cyan-300/40 shrink-0 mt-0.5" />
        </div>

        {/* Net Control label */}
        <div className="mt-3 flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-cyan-300" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">Net Control</p>
            <p className="text-[10px] text-cyan-300/70">Start or manage a net</p>
          </div>
        </div>
      </div>

      {/* Enter button — full-width bottom bar */}
      <Link to="/net-control" className="group absolute bottom-0 right-0 left-[38%] sm:left-[42%] flex items-center justify-center gap-2 py-3 bg-cyan-500/15 border-t border-cyan-400/40 group-hover:bg-cyan-500/25 transition-colors active:scale-[0.99]" style={{ boxShadow: '0 0 24px rgba(6,182,212,0.22)' }}>
        <Mic className="w-4 h-4 text-cyan-200" />
        <span className="text-xs font-bold text-white tracking-wide">Enter</span>
        <ChevronRight className="w-3.5 h-3.5 text-cyan-200" />
      </Link>
    </section>);

}