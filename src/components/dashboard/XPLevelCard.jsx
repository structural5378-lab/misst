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

// XPLevelCard — level progression using the MISST level shield as a visual
// identity emblem (not a small icon). The level number is rendered dynamically
// in HTML on top of the (black-center) shield via screen blend. Uses the
// existing XP system (getLevelProgress) unchanged.
export default function XPLevelCard({ xp = 0, level: levelProp }) {
  const { level: calcLevel, progress, remaining, nextStart } = getLevelProgress(xp);
  const level = levelProp || calcLevel;
  return (
    <div className="relative rounded-2xl overflow-hidden border border-violet-500/20 bg-card/40 backdrop-blur-md p-4 sm:p-5">
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="relative flex items-center gap-5">
        {/* level shield emblem */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
          <img src={MISST_ASSETS.MISST_LEVEL_SHIELD.url} alt="" className="w-full h-full object-contain" style={{ mixBlendMode: 'screen' }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className="text-[8px] font-bold text-violet-100 tracking-widest">LVL</span>
            <span className="text-2xl sm:text-3xl font-black text-white">{level}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-1.5 gap-2">
            <span className="text-base font-bold text-white truncate">Level {level} <span className="text-white/50 font-medium">· {titleFor(level)}</span></span>
            <span className="text-xs text-white/50 tabular-nums shrink-0">
              {(xp || 0).toLocaleString()} / {nextStart.toLocaleString()} XP
            </span>
          </div>
          <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden border border-white/[0.05]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-700"
              style={{ width: `${progress}%`, boxShadow: "0 0 16px rgba(139,92,246,0.8)" }}
            />
          </div>
          <p className="text-xs text-white/50 mt-2">
            {remaining > 0 ? `${remaining.toLocaleString()} XP to Level ${level + 1}` : "Max level reached"}
          </p>
        </div>
      </div>
    </div>
  );
}