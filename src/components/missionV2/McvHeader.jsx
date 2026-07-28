import React from "react";
import { Radio, RefreshCw, Settings as SettingsIcon, Siren } from "lucide-react";
import { fmtRuntime } from "./runtime";

// McvHeader — top command bar: MIST/MISSION CONTROL brand, LIVE NET badge +
// net name, status ticker (runtime, repeater, freq, tone, NC, asst, community,
// participants, online), and Emergency/Settings controls.
export default function McvHeader({ v2, onEmergency, onSettings }) {
  const { net, activeSession, approved, runtimeMs } = v2;
  const paused = activeSession?.status === "paused";
  return (
    <header className="sticky top-0 z-40 bg-[#0b0e11]/90 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center"><Radio className="w-4 h-4 text-white" /></div>
          <span className="font-extrabold tracking-tight">MIST</span>
          <span className="text-[11px] font-bold tracking-[0.2em] text-violet-300/80 hidden md:inline">MISSION CONTROL</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${paused ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"} ${!paused ? "animate-pulse" : ""}`}>{paused ? "PAUSED" : "LIVE NET"}</span>
          <span className="text-sm font-semibold truncate">{net?.name || activeSession?.net_name || "—"}</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <button onClick={onEmergency} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-bold"><Siren className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Emergency</span></button>
          <button className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground" title="Refresh"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={onSettings} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground" title="Settings"><SettingsIcon className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="flex items-center gap-x-4 gap-y-1 px-3 sm:px-4 py-1.5 text-[11px] overflow-x-auto scrollbar-hide border-t border-white/[0.04]">
        <Tick label="Runtime" value={fmtRuntime(runtimeMs)} mono />
        <Tick label="Repeater" value={net?.repeater_callsign || activeSession?.repeater_callsign || "—"} />
        <Tick label="Freq" value={net?.frequency ? `${net.frequency} MHz` : "—"} />
        <Tick label="Tone" value={net?.tone || "—"} />
        <Tick label="Net Control" value={activeSession?.net_control || "—"} />
        <Tick label="Asst. NCS" value={net?.assistant_net_control || activeSession?.co_host || "—"} />
        <Tick label="Community" value={activeSession?.community_name || net?.community_name || "—"} />
        <Tick label="Participants" value={approved.length} />
        <Tick label="Online" value={approved.length} />
        <Tick label="Weather" value={v2.weather?.current ? `${Math.round(v2.weather.current.temp)}° ${v2.weather.current.condition || ""}` : "—"} />
      </div>
    </header>
  );
}

function Tick({ label, value, mono }) {
  return (
    <span className="whitespace-nowrap">
      <span className="text-muted-foreground/60">{label}</span>{" "}
      <span className={`text-foreground font-semibold ${mono ? "tabular-nums" : ""}`}>{value}</span>
    </span>
  );
}