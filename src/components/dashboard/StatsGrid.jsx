import React from "react";
import { Award, Radio, TrendingUp, Flame } from "lucide-react";

const CARDS = [
  { icon: Award, label: "Score", key: "achievement_score", color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: Radio, label: "Check-ins", key: "net_checkins", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { icon: TrendingUp, label: "Miles", key: "miles_traveled", color: "text-sky-400", bg: "bg-sky-500/10" },
  { icon: Flame, label: "Streak", key: "daily_login_streak", color: "text-orange-400", bg: "bg-orange-500/10" },
];

export default function StatsGrid({ stats = {} }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {CARDS.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="mist-fade-up rounded-2xl bg-card/60 border border-white/[0.06] backdrop-blur-md p-3 flex flex-col items-center justify-center gap-1.5"
            style={{ animationDelay: `${i * 45}ms` }}
          >
            <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${c.color}`} />
            </div>
            <span className="text-lg font-black text-foreground leading-none tabular-nums">
              {stats[c.key] ?? 0}
            </span>
            <span className="text-[8px] text-muted-foreground uppercase tracking-wide">{c.label}</span>
          </div>
        );
      })}
    </div>
  );
}