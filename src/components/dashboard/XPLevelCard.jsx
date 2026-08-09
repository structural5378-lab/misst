import React from "react";
import { getLevelProgress } from "@/components/achievements/LevelBar";

// XPLevelCard — the level progression card from the reference. Electric-violet
// gradient bar with controlled glow, level emblem, current/required XP, and XP
// remaining to the next level. Uses the existing XP system (getLevelProgress).
export default function XPLevelCard({ xp = 0, level: levelProp }) {
  const { level: calcLevel, progress, remaining, nextStart } = getLevelProgress(xp);
  const level = levelProp || calcLevel;
  return (
    <div className="relative rounded-2xl mist-quick-tile p-3.5 overflow-hidden" style={{ '--tile-glow': 'rgba(139,92,246,0.45)' }}>
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="relative flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/50 shrink-0 border border-white/15">
          <span className="text-white font-black text-xl leading-none">{level}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-sm font-bold text-foreground">Level {level}</span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {(xp || 0).toLocaleString()} / {nextStart.toLocaleString()} XP
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-secondary overflow-hidden border border-white/[0.04]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 ach-bar-fill transition-all duration-700"
              style={{ width: `${progress}%`, boxShadow: "0 0 12px rgba(139,92,246,0.7)" }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {remaining > 0 ? `${remaining.toLocaleString()} XP to Level ${level + 1}` : "Max level reached"}
          </p>
        </div>
      </div>
    </div>
  );
}