import React from "react";
import { getLevelProgress } from "@/components/achievements/LevelBar";

// Cosmetic level→rank title (derived from the actual level, not hardcoded).
const LEVEL_TITLES = [
  { min: 25, title: "Net Commander" },
  { min: 18, title: "Net Controller" },
  { min: 12, title: "Senior Operator" },
  { min: 6, title: "Net Operator" },
  { min: 0, title: "Operator" },
];
const titleFor = (lvl) => LEVEL_TITLES.find((t) => lvl >= t.min)?.title || "Operator";

// XPLevelCard — level progression with a large level emblem, a derived rank
// title, current/required XP, a glowing violet gradient bar, and XP remaining.
// Uses the existing XP system (getLevelProgress).
export default function XPLevelCard({ xp = 0, level: levelProp }) {
  const { level: calcLevel, progress, remaining, nextStart } = getLevelProgress(xp);
  const level = levelProp || calcLevel;
  return (
    <div className="relative mist-module rounded-2xl p-4 overflow-hidden" style={{ '--mod-glow': 'rgba(139,92,246,0.30)' }}>
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="relative flex items-center gap-3.5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/50 shrink-0 border border-white/15">
          <span className="text-white font-black text-2xl leading-none">{level}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-sm font-bold text-foreground">Level {level} <span className="text-muted-foreground font-medium">· {titleFor(level)}</span></span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {(xp || 0).toLocaleString()} / {nextStart.toLocaleString()} XP
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-secondary overflow-hidden border border-white/[0.04]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 ach-bar-fill transition-all duration-700"
              style={{ width: `${progress}%`, boxShadow: "0 0 14px rgba(139,92,246,0.75)" }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {remaining > 0 ? `${remaining.toLocaleString()} XP to Level ${level + 1}` : "Max level reached"}
          </p>
        </div>
      </div>
    </div>
  );
}