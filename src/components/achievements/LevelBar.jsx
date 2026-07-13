import React from 'react';

export function calcLevel(xp) {
  return Math.floor(Math.sqrt((xp || 0) / 100)) + 1;
}

export function getLevelProgress(xp) {
  const level = calcLevel(xp);
  const currentStart = (level - 1) ** 2 * 100;
  const nextStart = level ** 2 * 100;
  const progress = nextStart > currentStart ? Math.min(100, ((xp - currentStart) / (nextStart - currentStart)) * 100) : 100;
  return { level, currentStart, nextStart, progress, remaining: Math.max(0, Math.ceil(nextStart - xp)) };
}

export default function LevelBar({ xp = 0 }) {
  const { level, progress, remaining } = getLevelProgress(xp);
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-violet-900/30 to-indigo-900/20 border border-violet-500/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-900/40">
            <span className="text-white font-bold text-sm">{level}</span>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Level</p>
            <p className="text-sm font-bold text-foreground">{(xp || 0).toLocaleString()} XP</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Next Level</p>
          <p className="text-sm font-semibold text-violet-400">{remaining > 0 ? `${remaining.toLocaleString()} XP` : 'MAX'}</p>
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 ach-bar-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}