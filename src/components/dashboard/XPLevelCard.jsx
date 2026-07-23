import React from "react";
import { getLevelProgress } from "@/components/achievements/LevelBar";

export default function XPLevelCard({ xp = 0 }) {
  const { level, progress, remaining } = getLevelProgress(xp);
  const nextXp = level * level * 100;
  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-violet-950/60 to-indigo-950/40 border border-violet-500/25 p-4 overflow-hidden">
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="relative flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/40 shrink-0">
          <span className="text-white font-black text-2xl leading-none">{level}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-sm font-bold text-foreground">Level {level}</span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {(xp || 0).toLocaleString()} / {nextXp.toLocaleString()} XP
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 ach-bar-fill transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {remaining > 0 ? `${remaining.toLocaleString()} XP until Level ${level + 1}` : "Max level reached"}
          </p>
        </div>
      </div>
    </div>
  );
}