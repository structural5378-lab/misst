import React from "react";
import { Users, Radio, UserCheck, Signal, ListOrdered, TrendingUp, Timer, Siren, Gauge, HeartPulse } from "lucide-react";
import { fmtRuntime } from "../missionV2/runtime";

// McvAnalytics — live KPI card strip for the desktop bottom section (row) or
// mobile overview (grid). All values derive from the live session data.
function sigBars(r) { if (!r) return 3; const m = String(r).match(/(\d)/); return m ? Math.min(5, Math.max(0, parseInt(m[1], 10))) : 3; }

export default function McvAnalytics({ v2, variant = "row" }) {
  const { approved, activeQueue, repeater, runtimeMs, metrics, incidents } = v2;
  const avg = approved.length ? Math.round(approved.reduce((s, c) => s + sigBars(c.signal_report), 0) / approved.length) : 0;
  const emergency = incidents.filter((i) => i.category === "emergency").length;
  const cards = [
    { label: "Online", value: approved.length, icon: Users, color: "text-emerald-400" },
    { label: "Check-ins", value: metrics.total, icon: UserCheck, color: "text-violet-300" },
    { label: "Queue", value: activeQueue.length, icon: ListOrdered, color: "text-amber-300" },
    { label: "Avg Signal", value: `${avg}/5`, icon: Signal, color: "text-cyan-300" },
    { label: "Repeaters", value: repeater ? 1 : 0, icon: Radio, color: "text-fuchsia-300" },
    { label: "Peak", value: metrics.total, icon: TrendingUp, color: "text-blue-300" },
    { label: "Duration", value: fmtRuntime(runtimeMs), icon: Timer, color: "text-sky-300", mono: true },
    { label: "Emergency", value: emergency, icon: Siren, color: "text-rose-300" },
    { label: "Coverage", value: "—", icon: Gauge, color: "text-teal-300" },
    { label: "Health", value: "Nominal", icon: HeartPulse, color: "text-emerald-300" },
  ];
  const cols = variant === "grid" ? "grid-cols-2 sm:grid-cols-3" : "grid-flow-col auto-cols-fr";
  return (
    <div className={`grid ${cols} gap-2 h-full`}>
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-2.5 py-2 flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide"><c.icon className={`w-3 h-3 ${c.color}`} />{c.label}</div>
          <p className={`text-lg font-extrabold leading-tight ${c.color} ${c.mono ? "tabular-nums" : ""} truncate`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}