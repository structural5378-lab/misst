import React from "react";
import { Radio } from "lucide-react";
import DurationTimer from "./DurationTimer";

export default function MissionHeader({ net, session }) {
  const status = session?.status || "idle";
  const isLive = status === "active";
  const isPaused = status === "paused";
  const badge = isLive
    ? { label: "LIVE", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40" }
    : isPaused
    ? { label: "PAUSED", cls: "bg-amber-500/20 text-amber-300 border-amber-400/40" }
    : { label: "STANDBY", cls: "bg-violet-500/20 text-violet-300 border-violet-400/40" };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950/50 via-card to-card border border-violet-500/20 p-5 mist-fade-up">
      <div className="absolute -top-16 -right-10 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="relative flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-violet-400" />
          <span className="text-[11px] font-bold tracking-[0.3em] text-violet-300/80 uppercase">Mission Control</span>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badge.cls} flex items-center gap-1.5`}>
          {(isLive || isPaused) && <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />}
          {badge.label}
        </span>
      </div>

      <h1 className="relative text-2xl font-black text-foreground leading-tight">{net?.name || "No Net Selected"}</h1>
      <p className="relative text-xs text-muted-foreground mt-1">
        {net ? `${net.frequency ? `${net.frequency} MHz` : ""}${net.day_of_week ? ` · ${net.day_of_week}` : ""}${net.time ? ` · ${net.time}` : ""}` : "Select a net to begin"}
      </p>

      {session && (
        <div className="relative mt-4 flex items-end justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Net Duration</p>
            <p className="text-3xl font-black text-foreground mt-0.5">
              <DurationTimer startedAt={session.started_at} pausedAt={session.paused_at} pausedTotal={session.paused_total} status={session.status} />
            </p>
          </div>
          <Waveform active={isLive} />
        </div>
      )}
    </div>
  );
}

function Waveform({ active }) {
  const bars = [18, 30, 12, 38, 22, 14, 30, 10, 26, 16];
  return (
    <div className="flex items-end gap-0.5 h-10">
      {bars.map((h, i) => (
        <span
          key={i}
          className={`w-1 rounded-full bg-gradient-to-t from-violet-500 to-fuchsia-400 mist-wave-bar ${active ? "" : "opacity-30"}`}
          style={{ height: h, animationDelay: `${i * 0.08}s`, animationPlayState: active ? "running" : "paused" }}
        />
      ))}
    </div>
  );
}