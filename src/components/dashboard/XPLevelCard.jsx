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

// XPLevelCard — a substantial level progression card: large shield emblem,
// derived rank title, current/required XP, a glowing violet gradient bar, and
// XP remaining. Uses the existing XP system (getLevelProgress).
export default function XPLevelCard({ xp = 0, level: levelProp }) {
  const { level: calcLevel, progress, remaining, nextStart } = getLevelProgress(xp);
  const level = levelProp || calcLevel;
  return (
    <div className="relative mist-module rounded-2xl p-4 sm:p-5 overflow-hidden" style={{ '--mod-glow': 'rgba(139,92,246,0.32)' }}>
      <div className="absolute -top-14 -right-14 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="relative flex items-center gap-4">
        <div className="mist-level-shield w-16 h-16 flex flex-col items-center justify-center leading-none shrink-0">
          <span className="relative z-10 text-[9px] font-bold text-violet-100 tracking-widest">LVL</span>
          <span className="relative z-10 text-2xl font-black text-white">{level}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-base font-bold text-foreground">Level {level} <span className="text-muted-foreground font-medium">· {titleFor(level)}</span></span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {(xp || 0).toLocaleString()} / {nextStart.toLocaleString()} XP
            </span>
          </div>
          <div className="h-3 rounded-full bg-secondary overflow-hidden border border-white/[0.04]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 ach-bar-fill transition-all duration-700"
              style={{ width: `${progress}%`, boxShadow: "0 0 16px rgba(139,92,246,0.8)" }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {remaining > 0 ? `${remaining.toLocaleString()} XP to Level ${level + 1}` : "Max level reached"}
          </p>
        </div>
      </div>
    </div>
  );
}