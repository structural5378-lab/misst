import React from "react";
import { CheckCircle, Clock, Flag, Siren } from "lucide-react";

const METRICS = [
  { key: "total", label: "Check-ins", Icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { key: "late", label: "Late", Icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { key: "priority", label: "Priority", Icon: Flag, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  { key: "emergency", label: "Emergency", Icon: Siren, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
];

export default function MissionMetrics({ values }) {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {METRICS.map((m, i) => (
        <div
          key={m.key}
          className={`mist-fade-up rounded-2xl ${m.bg} ${m.border} border backdrop-blur-md p-3 flex flex-col items-center gap-1`}
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <m.Icon className={`w-4 h-4 ${m.color}`} />
          <span className="text-xl font-black text-foreground tabular-nums leading-none">{values[m.key] ?? 0}</span>
          <span className="text-[9px] text-muted-foreground uppercase tracking-wide">{m.label}</span>
        </div>
      ))}
    </div>
  );
}