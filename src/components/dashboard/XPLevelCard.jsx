import React from "react";
import { getLevelProgress } from "@/components/achievements/LevelBar";
import { MISST_ASSETS } from "@/lib/misstAssets";

// Cosmetic level→rank title (derived from the actual level, not hardcoded).
const LEVEL_TITLES = [
  { min: 25, title: "Net Commander" },
  { min: 18, title: "Net Controller" },
  { min: 12, title: "Senior Operator" },
  { min: 6, title: "Net Operator" },
  { min: 0, title: "Operator" },
];
const titleFor = (lvl) => LEVEL_TITLES.find((t) => lvl >= t.min)?.title || "Operator";

// XPLevelCard — part of the operator identity system. Sits on the shared
// environment with a hairline separator (no heavy card). The MISST level
// shield is the identity emblem; the XP bar is clean. Uses the existing XP
// system (getLevelProgress) unchanged.
export default function XPLevelCard({ xp = 0, level: levelProp }) {
  const { level: calcLevel, progress, remaining, nextStart } = getLevelProgress(xp);
  const level = levelProp || calcLevel;
  return (
    <div className="relative">
      <div className="border-t border-white/[0.08] pt-5 mt-5 flex items-center gap-5">
        {/* level shield emblem */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
          <img src={MISST_ASSETS.MISST_LEVEL_SHIELD.url} alt="" className="w-full h-full object-contain" style={{ mixBlendMode: 'screen' }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className="text-[8px] font-bold text-violet-100 tracking-widest">LVL</span>
            <span className="text-2xl sm:text-3xl font-black text-white">{level}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-2 gap-2">
            <span className="text-sm font-bold text-white truncate">Level {level} <span className="text-white/40 font-medium">· {titleFor(level)}</span></span>
            <span className="text-xs text-white/45 tabular-nums shrink-0">
              {(xp || 0).toLocaleString()} / {nextStart.toLocaleString()} XP
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-white/[0.05] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-700"
              style={{ width: `${progress}%`, boxShadow: "0 0 14px rgba(139,92,246,0.7)" }}
            />
          </div>
          <p className="text-xs text-white/45 mt-2">
            {remaining > 0 ? `${remaining.toLocaleString()} XP to Level ${level + 1}` : "Max level reached"}
          </p>
        </div>
      </div>
    </div>
  );
}