import React from "react";
import { getLevelProgress } from "@/components/achievements/LevelBar";
import { MISST_ASSETS } from "@/lib/misstAssets";
import { ChevronRight } from "lucide-react";

// Cosmetic level→rank title (derived from the actual level, not hardcoded).
const LEVEL_TITLES = [
  { min: 25, title: "Net Commander" },
  { min: 18, title: "Net Controller" },
  { min: 12, title: "Senior Operator" },
  { min: 6, title: "Net Operator" },
  { min: 0, title: "Field Operator" },
];
const titleFor = (lvl) => LEVEL_TITLES.find((t) => lvl >= t.min)?.title || "Field Operator";
const nextTitle = (lvl) => {
  const idx = LEVEL_TITLES.findIndex((t) => lvl >= t.min);
  // next rank is the one above (lower min threshold = higher rank), so reverse
  const sorted = [...LEVEL_TITLES].sort((a, b) => b.min - a.min);
  const cur = sorted.findIndex((t) => lvl >= t.min);
  return cur > 0 ? sorted[cur - 1].title : "Max Rank";
};

// XPLevelCard — three-column progression: shield emblem | level info + XP bar
// | next-rank preview. Sits on the shared environment with a hairline separator
// (no heavy card). Uses the existing XP system (getLevelProgress) unchanged.
export default function XPLevelCard({ xp = 0, level: levelProp }) {
  const { level: calcLevel, progress, remaining, nextStart } = getLevelProgress(xp);
  const level = levelProp || calcLevel;
  const rank = titleFor(level);
  const next = nextTitle(level);

  return (
    <div className="relative">
      <div className="border-t border-white/[0.08] pt-5 mt-5 flex flex-col sm:flex-row sm:items-center gap-5">
        {/* level shield emblem */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 mx-auto sm:mx-0">
          <img src={MISST_ASSETS.MISST_LEVEL_SHIELD.url} alt="" className="w-full h-full object-contain" style={{ mixBlendMode: 'screen' }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className="text-[8px] font-bold text-violet-100 tracking-widest">LVL</span>
            <span className="text-2xl sm:text-3xl font-black text-white">{level}</span>
          </div>
        </div>

        {/* level info + progress bar */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="flex items-baseline justify-center sm:justify-between mb-1 gap-2">
            <span className="text-sm font-bold text-white">Level {level} <span className="text-white/40 font-medium">· {rank}</span></span>
            <span className="text-xs text-white/45 tabular-nums shrink-0 hidden sm:inline">
              {(xp || 0).toLocaleString()} / {nextStart.toLocaleString()} XP
            </span>
          </div>
          <p className="text-[11px] text-white/40 mb-2">Keep earning XP to reach Level {level + 1}</p>
          <div className="h-2.5 rounded-full bg-white/[0.05] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-700"
              style={{ width: `${progress}%`, boxShadow: "0 0 14px rgba(139,92,246,0.7)" }}
            />
          </div>
          <div className="flex items-center justify-center sm:justify-between mt-2 gap-2">
            <span className="text-xs text-white/45 tabular-nums sm:hidden">
              {(xp || 0).toLocaleString()} / {nextStart.toLocaleString()} XP
            </span>
            <p className="text-xs text-white/45 ml-auto">
              {remaining > 0 ? `${remaining.toLocaleString()} XP to next level` : "Max level reached"}
            </p>
          </div>
        </div>

        {/* next-rank preview — desktop */}
        <div className="hidden sm:flex flex-col items-center gap-1 shrink-0 pl-5 border-l border-white/[0.08]">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-white/[0.08] flex items-center justify-center">
            <ChevronRight className="w-5 h-5 text-violet-300" />
          </div>
          <span className="text-[10px] font-bold text-white/70 tracking-wide">{rank}</span>
          <span className="text-[10px] text-white/40">Next: {next}</span>
        </div>
      </div>
    </div>
  );
}