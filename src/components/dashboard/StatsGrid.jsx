import React from "react";
import { Award, Radio, Server, MapPin, TrendingUp, Siren, Calendar, Flame } from "lucide-react";

const CARDS = [
  { icon: Award, label: "Score", key: "achievement_score", color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: Radio, label: "Check-ins", key: "net_checkins", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { icon: Server, label: "Net Control", key: "net_control_sessions", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { icon: MapPin, label: "Repeaters", key: "repeaters_visited", color: "text-amber-400", bg: "bg-amber-500/10" },
  { icon: TrendingUp, label: "Miles", key: "miles_traveled", color: "text-sky-400", bg: "bg-sky-500/10" },
  { icon: Siren, label: "Emergency", key: "emergency_activations", color: "text-rose-400", bg: "bg-rose-500/10" },
  { icon: Calendar, label: "Years", key: "years_active", color: "text-indigo-400", bg: "bg-indigo-500/10" },
  { icon: Flame, label: "Streak", key: "daily_login_streak", color: "text-orange-400", bg: "bg-orange-500/10" },
];

export default function StatsGrid({ stats = {} }) {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {CARDS.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="mist-fade-up rounded-2xl bg-card/60 border border-white/[0.06] backdrop-blur-md p-3 flex flex-col items-center gap-1.5"
            style={{ animationDelay: `${i * 45}ms` }}
          >
            <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <span className="text-lg font-black text-foreground leading-none tabular-nums">
              {stats[c.key] ?? 0}
            </span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wide">{c.label}</span>
          </div>
        );
      })}
    </div>
  );
}