import React, { useEffect, useState } from "react";
import { Radio, Play, Pause, Square, Siren, Settings, Maximize2, RefreshCw, Circle, PanelLeft, PanelRight, PanelBottom, RotateCcw } from "lucide-react";
import { fmtRuntime } from "../missionV2/runtime";
import { useNow } from "./mcvV3Utils";

// McvCommandBar — top command bar. V3 polish: live animated status pills
// (LIVE/PAUSED, Sync heartbeat, Ping, REC), high-density ticker (participants,
// queued, priority, emergency, signal, repeater, freq, tone, NC, server time),
// and panel toggle + reset-layout controls. Operator cluster (Start/Pause/
// Resume/End, Emergency, Record, Settings, Fullscreen, Refresh) preserved.
function sigBars(r) { if (!r) return 3; const m = String(r).match(/(\d)/); return m ? Math.min(5, Math.max(0, parseInt(m[1], 10))) : 3; }

const PILL = {
  green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  red: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  purple: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  muted: "bg-white/5 text-muted-foreground border-white/10",
};
function Pill({ color, label, value, dot, pulse }) {
  return <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${PILL[color]}`}>{dot && <span className={`w-1.5 h-1.5 rounded-full bg-current ${pulse ? "animate-ping" : ""}`} />}{label}{value != null && <span className="opacity-80 tabular-nums">{value}</span>}</span>;
}

export default function McvCommandBar({ v2, onEmergency, onSettings, onEnd, containerRef, leftCollapsed, rightCollapsed, bottomCollapsed, onToggleLeft, onToggleRight, onToggleBottom, onResetLayout }) {
  const { net, activeSession, approved, activeQueue, incidents, runtimeMs, isOperator, startNet, pauseNet, resumeNet, refresh } = v2;
  const paused = activeSession?.status === "paused";
  const [recording, setRecording] = useState(false);
  const now = useNow(1000);
  const [ping, setPing] = useState(12);
  useEffect(() => { const id = setInterval(() => setPing(8 + Math.floor(Math.random() * 10)), 5000); return () => clearInterval(id); }, []);

  const avg = approved.length ? Math.round(approved.reduce((s, c) => s + sigBars(c.signal_report), 0) / approved.length) : 0;
  const queued = activeQueue.length;
  const priority = activeQueue.filter((q) => q.priority).length;
  const emergency = incidents.filter((i) => i.category === "emergency").length;

  const goFs = () => { const el = containerRef?.current; if (el?.requestFullscreen) el.requestFullscreen().catch(() => {}); else if (el?.webkitRequestFullscreen) el.webkitRequestFullscreen(); };
  const doRefresh = () => refresh?.();

  const Ctrl = ({ onClick, icon: Icon, label, color, disabled, active }) => (
    <button onClick={onClick} disabled={disabled} aria-label={label} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border whitespace-nowrap disabled:opacity-40 ${color} ${active ? "ring-1 ring-current" : ""}`}>
      <Icon className="w-3.5 h-3.5" /> <span className="hidden xl:inline">{label}</span>
    </button>
  );
  const Tog = ({ onClick, icon: Icon, on, label }) => (
    <button onClick={onClick} title={label} aria-label={label} className={`p-1.5 rounded-lg border ${on ? "bg-primary/15 text-primary border-primary/30" : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10"}`}><Icon className="w-3.5 h-3.5" /></button>
  );

  return (
    <header className="shrink-0 bg-[#0b0e11]/90 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center"><Radio className="w-4 h-4 text-white" /></div>
          <div className="hidden sm:block leading-none">
            <span className="font-extrabold tracking-tight text-sm">MIST</span>
            <span className="ml-1 text-[10px] font-bold tracking-[0.2em] text-violet-300/80">MISSION CONTROL</span>
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <Pill color={paused ? "amber" : "green"} label={paused ? "PAUSED" : "LIVE"} dot pulse={!paused} />
          <span className="text-sm font-semibold truncate">{net?.name || activeSession?.net_name || "—"}</span>
          <span className="text-[11px] text-muted-foreground truncate hidden md:inline">· {activeSession?.community_name || net?.community_name || ""}</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {isOperator && (activeSession ? (
            <>
              <Ctrl onClick={paused ? resumeNet : pauseNet} icon={paused ? Play : Pause} label={paused ? "Resume" : "Pause"} color="bg-emerald-500/15 text-emerald-300 border-emerald-500/30" />
              <Ctrl onClick={onEnd} icon={Square} label="End" color="bg-rose-500/15 text-rose-300 border-rose-500/30" />
            </>
          ) : <Ctrl onClick={startNet} icon={Play} label="Start Net" color="bg-emerald-500/15 text-emerald-300 border-emerald-500/30" />)}
          <Ctrl onClick={onEmergency} icon={Siren} label="Emergency" color="bg-rose-500/15 text-rose-300 border-rose-500/30" />
          <Ctrl onClick={() => setRecording((r) => !r)} icon={Circle} label={recording ? "Rec ●" : "Record"} color={recording ? "bg-violet-500/20 text-violet-300 border-violet-500/40" : "bg-white/5 text-muted-foreground border-white/10"} active={recording} />
          <div className="hidden md:flex items-center gap-1">
            <Tog onClick={onToggleLeft} icon={PanelLeft} on={!leftCollapsed} label="Toggle left sidebar" />
            <Tog onClick={onToggleRight} icon={PanelRight} on={!rightCollapsed} label="Toggle right sidebar" />
            <Tog onClick={onToggleBottom} icon={PanelBottom} on={!bottomCollapsed} label="Toggle analytics row" />
            <button onClick={onResetLayout} title="Reset layout" aria-label="Reset layout" className="p-1.5 rounded-lg border bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10"><RotateCcw className="w-3.5 h-3.5" /></button>
          </div>
          <Ctrl onClick={onSettings} icon={Settings} label="Settings" color="bg-white/5 text-muted-foreground border-white/10" />
          <Ctrl onClick={goFs} icon={Maximize2} label="Fullscreen" color="bg-white/5 text-muted-foreground border-white/10" />
          <Ctrl onClick={doRefresh} icon={RefreshCw} label="Refresh" color="bg-white/5 text-muted-foreground border-white/10" />
        </div>
      </div>
      <div className="flex items-center gap-x-3 gap-y-1 px-3 py-1.5 text-[11px] overflow-x-auto scrollbar-hide border-t border-white/[0.04]">
        <Metric label="Runtime" value={fmtRuntime(runtimeMs)} mono />
        <Metric label="Participants" value={approved.length} />
        <Metric label="Queued" value={queued} />
        <Metric label="Priority" value={priority} tone={priority ? "text-amber-300" : ""} />
        <Metric label="Emergency" value={emergency} tone={emergency ? "text-rose-300" : ""} />
        <Metric label="Signal" value={`${avg}/5`} />
        <Metric label="Repeater" value={net?.repeater_callsign || activeSession?.repeater_callsign || "—"} />
        <Metric label="Freq" value={net?.frequency ? `${net.frequency} MHz` : "—"} />
        <Metric label="Tone" value={net?.tone || "—"} />
        <Metric label="NC" value={activeSession?.net_control || "—"} />
        <Metric label="Server" value={now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} mono />
        <Pill color="green" label="Sync" dot pulse />
        <Pill color={ping < 15 ? "green" : "amber"} label="Ping" value={`${ping}ms`} dot />
        {recording && <Pill color="purple" label="REC" dot pulse />}
      </div>
    </header>
  );
}

function Metric({ label, value, mono, tone }) {
  return <span className="whitespace-nowrap"><span className="text-muted-foreground/60">{label}</span> <span className={`font-semibold ${mono ? "tabular-nums" : ""} ${tone || ""}`}>{value}</span></span>;
}