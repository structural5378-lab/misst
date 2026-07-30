import React, { useState } from "react";
import { Radio, Play, Pause, Square, Siren, Settings, Maximize2, RefreshCw, Circle, Wifi, Activity } from "lucide-react";
import { fmtRuntime } from "../missionV2/runtime";

// McvCommandBar — the top command bar for the desktop + tablet EOC layout.
// Dense single strip: brand + live status + mission/community, the full
// status ticker (runtime, repeater, freq, tone, NC, asst, participants, signal
// health, connection), and the operator control cluster (Start/Pause/Resume/
// End, Emergency, Record, Settings, Fullscreen, Refresh).
function sigBars(report) { if (!report) return 3; const m = String(report).match(/(\d)/); return m ? Math.min(5, Math.max(0, parseInt(m[1], 10))) : 3; }

export default function McvCommandBar({ v2, onEmergency, onSettings, onEnd, containerRef }) {
  const { net, activeSession, approved, repeater, runtimeMs, isOperator, startNet, pauseNet, resumeNet, refresh } = v2;
  const paused = activeSession?.status === "paused";
  const [recording, setRecording] = useState(false);
  const avg = approved.length ? Math.round(approved.reduce((s, c) => s + sigBars(c.signal_report), 0) / approved.length) : 0;

  const goFullscreen = () => {
    const el = containerRef?.current;
    if (el?.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el?.webkitRequestFullscreen) el.webkitRequestFullscreen();
  };
  const doRefresh = () => refresh?.();

  const Ctrl = ({ onClick, icon: Icon, label, color, disabled }) => (
    <button onClick={onClick} disabled={disabled} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border whitespace-nowrap disabled:opacity-40 ${color}`}>
      <Icon className="w-3.5 h-3.5" /> <span className="hidden xl:inline">{label}</span>
    </button>
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
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${paused ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse"}`}>{paused ? "PAUSED" : "LIVE"}</span>
          <span className="text-sm font-semibold truncate">{net?.name || activeSession?.net_name || "—"}</span>
          <span className="text-[11px] text-muted-foreground truncate hidden md:inline">· {activeSession?.community_name || net?.community_name || ""}</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {isOperator && (activeSession ? (
            <>
              <Ctrl onClick={paused ? resumeNet : pauseNet} icon={paused ? Play : Pause} label={paused ? "Resume" : "Pause"} color="bg-emerald-500/15 text-emerald-300 border-emerald-500/30" />
              <Ctrl onClick={onEnd} icon={Square} label="End" color="bg-rose-500/15 text-rose-300 border-rose-500/30" />
            </>
          ) : (
            <Ctrl onClick={startNet} icon={Play} label="Start Net" color="bg-emerald-500/15 text-emerald-300 border-emerald-500/30" />
          ))}
          <Ctrl onClick={onEmergency} icon={Siren} label="Emergency" color="bg-rose-500/15 text-rose-300 border-rose-500/30" />
          <Ctrl onClick={() => setRecording((r) => !r)} icon={Circle} label={recording ? "Rec ●" : "Record"} color={recording ? "bg-rose-500/25 text-rose-300 border-rose-500/50" : "bg-white/5 text-muted-foreground border-white/10"} />
          <Ctrl onClick={onSettings} icon={Settings} label="Settings" color="bg-white/5 text-muted-foreground border-white/10" />
          <Ctrl onClick={goFullscreen} icon={Maximize2} label="Fullscreen" color="bg-white/5 text-muted-foreground border-white/10" />
          <Ctrl onClick={doRefresh} icon={RefreshCw} label="Refresh" color="bg-white/5 text-muted-foreground border-white/10" />
        </div>
      </div>
      <div className="flex items-center gap-x-4 gap-y-1 px-3 py-1.5 text-[11px] overflow-x-auto scrollbar-hide border-t border-white/[0.04]">
        <Tick label="Runtime" value={fmtRuntime(runtimeMs)} mono />
        <Tick label="Repeater" value={net?.repeater_callsign || activeSession?.repeater_callsign || "—"} />
        <Tick label="Freq" value={net?.frequency ? `${net.frequency} MHz` : "—"} />
        <Tick label="Tone" value={net?.tone || "—"} />
        <Tick label="Net Control" value={activeSession?.net_control || "—"} />
        <Tick label="Asst. NCS" value={net?.assistant_net_control || activeSession?.co_host || "—"} />
        <Tick label="Participants" value={approved.length} />
        <span className="flex items-center gap-1 whitespace-nowrap"><Activity className="w-3 h-3 text-emerald-400" /><span className="text-muted-foreground/60">Signal</span> <span className="font-semibold">{avg}/5</span></span>
        <span className="flex items-center gap-1 whitespace-nowrap"><Wifi className="w-3 h-3 text-emerald-400" /><span className="text-emerald-300 font-semibold">CONNECTED</span></span>
      </div>
    </header>
  );
}

function Tick({ label, value, mono }) {
  return <span className="whitespace-nowrap"><span className="text-muted-foreground/60">{label}</span> <span className={`font-semibold ${mono ? "tabular-nums" : ""}`}>{value}</span></span>;
}