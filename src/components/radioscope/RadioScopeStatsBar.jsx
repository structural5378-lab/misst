import React from "react";
import { Users, Circle, MapPin, Radio, Wifi, AlertTriangle, Cloud } from "lucide-react";

// RadioScopeStatsBar — live community-scoped statistics strip at the top of
// RadioScope. All counts reflect the active community only.
const CHIPS = [
  { key: "total_members", label: "Members", icon: Users, color: "text-cyan-300" },
  { key: "online", label: "Online", icon: Circle, color: "text-emerald-400" },
  { key: "sharing_location", label: "Sharing", icon: MapPin, color: "text-blue-400" },
  { key: "active_repeaters", label: "Repeaters", icon: Radio, color: "text-violet-400" },
  { key: "live_nets", label: "Live Nets", icon: Wifi, color: "text-amber-400" },
  { key: "emergency_alerts", label: "Emergency", icon: AlertTriangle, color: "text-rose-400" },
  { key: "weather_alerts", label: "Weather", icon: Cloud, color: "text-sky-400" },
];

export default function RadioScopeStatsBar({ stats, loading }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-md border-b border-cyan-500/10 overflow-x-auto scrollbar-hide">
      {CHIPS.map((chip) => {
        const Icon = chip.icon;
        const val = loading ? "—" : (stats?.[chip.key] ?? 0);
        return (
          <div key={chip.key} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] shrink-0">
            <Icon className={`w-3.5 h-3.5 ${chip.color}`} />
            <span className="text-xs font-bold text-foreground tabular-nums">{val}</span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wide whitespace-nowrap">{chip.label}</span>
          </div>
        );
      })}
    </div>
  );
}