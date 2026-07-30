import React from "react";
import { Flame, X, Calendar, Trophy, TrendingUp } from "lucide-react";
import { format } from "date-fns";

const MILESTONES = [
  { days: 7, name: "Weekly Warrior", xp: 100 },
  { days: 30, name: "Monthly Master", xp: 500 },
  { days: 100, name: "Centurion", xp: 2000 },
  { days: 365, name: "Yearly Legend", xp: 10000 },
];

export default function LoginStreakModal({ stats = {}, onClose }) {
  const current = stats.daily_login_streak ?? 0;
  const longest = stats.longest_login_streak ?? current;
  const lastLogin = stats.last_login_date;

  const nextMilestone = MILESTONES.find((m) => m.days > current) || MILESTONES[MILESTONES.length - 1];
  const prevDays = MILESTONES.filter((m) => m.days <= current).reduce((max, m) => Math.max(max, m.days), 0);
  const span = Math.max(1, nextMilestone.days - prevDays);
  const progress = Math.min(100, Math.round(((current - prevDays) / span) * 100));

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center fade-in" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm bg-card border border-border rounded-t-3xl sm:rounded-3xl p-5 sheet-up max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <h2 className="text-base font-bold">Login Streak</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current streak hero */}
        <div className="rounded-2xl bg-gradient-to-br from-orange-500/15 to-amber-500/5 border border-orange-500/20 p-4 text-center mb-4">
          <div className="text-4xl font-black text-orange-400 tabular-nums leading-none">{current}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1.5">Consecutive Days</div>
        </div>

        {/* Longest + Last login */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-xl bg-background/40 border border-border p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wide mb-1">
              <TrendingUp className="w-3 h-3" /> Longest
            </div>
            <div className="text-lg font-bold tabular-nums">
              {longest} <span className="text-xs font-normal text-muted-foreground">days</span>
            </div>
          </div>
          <div className="rounded-xl bg-background/40 border border-border p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wide mb-1">
              <Calendar className="w-3 h-3" /> Last Login
            </div>
            <div className="text-sm font-semibold">
              {lastLogin ? format(new Date(lastLogin), "MMM d, yyyy") : "Today"}
            </div>
          </div>
        </div>

        {/* Next milestone progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Next Milestone</span>
            <span className="text-xs font-bold text-orange-400">{nextMilestone.name} · {nextMilestone.days} days</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">{current} / {nextMilestone.days} days</div>
        </div>

        {/* Milestone rewards */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
            <Trophy className="w-3.5 h-3.5" /> Milestone Rewards
          </div>
          <div className="space-y-1.5">
            {MILESTONES.map((m) => {
              const unlocked = current >= m.days;
              return (
                <div
                  key={m.days}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                    unlocked ? "bg-orange-500/10 border-orange-500/30" : "bg-background/40 border-border"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${unlocked ? "bg-orange-500/20 text-orange-400" : "bg-muted/40 text-muted-foreground"}`}>
                    <Flame className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{m.name}</div>
                    <div className="text-[10px] text-muted-foreground">{m.days} days · +{m.xp} XP</div>
                  </div>
                  {unlocked ? (
                    <span className="text-[10px] font-bold text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded-full">EARNED</span>
                  ) : (
                    <span className="text-[10px] font-medium text-muted-foreground">{Math.max(0, m.days - current)}d to go</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}