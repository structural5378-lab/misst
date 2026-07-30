import React from "react";
import { Award, Radio, Flame } from "lucide-react";

// ProfileHeaderStats — compact horizontal stats (Score, Check-ins, Login
// Streak) integrated into the OperatorCard header. Small glassmorphism cards
// with subtle neon glow on hover/touch. Responsive: cards size down on narrow
// phones and the row wraps below the name when space is tight.
const STATS = [
  { icon: Award, label: "Score", key: "achievement_score", color: "text-violet-400", bg: "bg-violet-500/15" },
  { icon: Radio, label: "Check-ins", key: "net_checkins", color: "text-emerald-400", bg: "bg-emerald-500/15" },
  { icon: Flame, label: "Streak", key: "daily_login_streak", color: "text-orange-400", bg: "bg-orange-500/15" },
];

export default function ProfileHeaderStats({ stats = {} }) {
  return (
    <div className="flex gap-1.5 justify-end flex-wrap">
      {STATS.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.key}
            className="flex flex-col items-center justify-center gap-0.5 w-[70px] sm:w-[78px] rounded-xl bg-white/[0.06] border border-white/[0.08] backdrop-blur-md px-1 py-1.5 hover:border-primary/40 hover:shadow-[0_0_14px_rgba(139,92,246,0.35)] active:scale-95 transition-all"
          >
            <div className={`w-6 h-6 rounded-lg ${s.bg} flex items-center justify-center`}>
              <Icon className={`w-3.5 h-3.5 ${s.color}`} />
            </div>
            <span className="text-sm font-black text-foreground leading-none tabular-nums">
              {stats[s.key] ?? 0}
            </span>
            <span className="text-[7px] text-muted-foreground uppercase tracking-wide leading-none">
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}