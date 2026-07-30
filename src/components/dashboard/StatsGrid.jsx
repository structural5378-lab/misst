import React, { useState } from "react";
import { Award, Radio, Flame } from "lucide-react";
import LoginStreakModal from "./LoginStreakModal";

const MILESTONES = [7, 30, 100, 365];

const SIMPLE_CARDS = [
  { icon: Award, label: "Score", key: "achievement_score", color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: Radio, label: "Check-ins", key: "net_checkins", color: "text-emerald-400", bg: "bg-emerald-500/10" },
];

export default function StatsGrid({ stats = {} }) {
  const [showStreak, setShowStreak] = useState(false);
  const streak = stats.daily_login_streak ?? 0;
  const isMilestone = MILESTONES.includes(streak);

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {SIMPLE_CARDS.map((c, i) => {
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

        {/* Login Streak — tappable, milestone glow */}
        <button
          onClick={() => setShowStreak(true)}
          className={`mist-fade-up rounded-2xl bg-card/60 border backdrop-blur-md p-3 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[0.97] hover:border-orange-500/40 ${
            isMilestone ? "streak-milestone border-orange-500/40" : "border-white/[0.06]"
          }`}
          style={{ animationDelay: "90ms" }}
          aria-label="Login streak details"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Flame className={`w-5 h-5 text-orange-400 ${isMilestone ? "mist-nav-pulse" : ""}`} />
          </div>
          <span key={streak} className="streak-pop text-lg font-black text-foreground leading-none tabular-nums">
            {streak}
          </span>
          <span className="text-[8px] text-muted-foreground uppercase tracking-wide">Login Streak</span>
        </button>
      </div>

      {showStreak && <LoginStreakModal stats={stats} onClose={() => setShowStreak(false)} />}
    </>
  );
}