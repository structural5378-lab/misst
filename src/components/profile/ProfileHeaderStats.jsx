import React from "react";
import { Award, Radio, Flame } from "lucide-react";

// ProfileHeaderStats — slim inline stat chips (Score, Check-ins, Login Streak)
// that sit beside the name in the OperatorCard header. Compact enough to fit
// on one line on phones; subtle neon glow on hover/touch.
const STATS = [
  { icon: Award, label: "Score", key: "achievement_score", color: "text-violet-400", bg: "bg-violet-500/15" },
  { icon: Radio, label: "Check-ins", key: "net_checkins", color: "text-emerald-400", bg: "bg-emerald-500/15" },
  { icon: Flame, label: "Streak", key: "daily_login_streak", color: "text-orange-400", bg: "bg-orange-500/15" },
];

export default function ProfileHeaderStats({ stats = {} }) {
  return (
    <div className="flex gap-1 shrink-0 self-center">
      {STATS.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.key}
            className="flex flex-col items-center justify-center gap-0.5 w-[58px] rounded-lg bg-white/[0.06] border border-white/[0.08] backdrop-blur-md px-0.5 py-1 hover:border-primary/40 hover:shadow-[0_0_12px_rgba(139,92,246,0.35)] active:scale-95 transition-all"
          >
            <div className={`w-5 h-5 rounded-md ${s.bg} flex items-center justify-center`}>
              <Icon className={`w-3 h-3 ${s.color}`} />
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