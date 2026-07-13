import React from 'react';
import { Lock, Pin } from 'lucide-react';
import BadgeArtwork from './BadgeArtwork';
import { getAchievementById } from '@/lib/achievementsData';

export default function TrophyCase({ achievements = [], onBadgeClick, maxDisplay = 8 }) {
  const pinned = achievements.filter(a => a.is_pinned).sort((a, b) => (a.pin_order || 0) - (b.pin_order || 0));
  const display = pinned.slice(0, maxDisplay);

  return (
    <div className="p-4 rounded-xl bg-gradient-to-b from-amber-950/30 to-background border border-amber-500/15">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Pin className="w-4 h-4 text-amber-400" /> Trophy Case
        </h3>
        <span className="text-xs text-muted-foreground">{pinned.length} pinned</span>
      </div>
      {display.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {display.map((ua) => {
            const ach = getAchievementById(ua.achievement_id);
            if (!ach) return null;
            return (
              <button key={ua.id} onClick={() => onBadgeClick?.(ach)} className="shrink-0 flex flex-col items-center gap-1">
                <BadgeArtwork achievement={ach} size="sm" unlocked />
                <span className="text-[9px] text-muted-foreground max-w-[56px] truncate">{ach.name}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center py-6 text-center">
          <Lock className="w-6 h-6 text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground">Pin your favorite achievements to display them here</p>
        </div>
      )}
    </div>
  );
}