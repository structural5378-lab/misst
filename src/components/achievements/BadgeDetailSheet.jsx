import React from 'react';
import { X, Pin, Share2, Lock } from 'lucide-react';
import BadgeArtwork from './BadgeArtwork';
import { RARITIES } from '@/lib/rarityConfig';
import { getAchievementProgress } from '@/lib/achievementsData';

export default function BadgeDetailSheet({ achievement, isUnlocked, isPinned, stats, onClose, onTogglePin, onShare }) {
  const rarity = RARITIES[achievement.rarity] || RARITIES.common;
  const isSecret = achievement.secret || achievement.collection === 'secret';
  const displayName = isUnlocked ? achievement.name : '???';
  const displayDesc = isUnlocked ? achievement.flavor : (isSecret ? 'Hidden achievement — unlock to reveal.' : achievement.description);
  const { current, target, pct } = getAchievementProgress(achievement, stats);

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-card border border-border rounded-t-2xl overflow-hidden ach-sheet-up relative"
        onClick={e => e.stopPropagation()} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-border" /></div>
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary text-muted-foreground z-10">
          <X className="w-5 h-5" />
        </button>
        <div className="px-6 pb-6">
          <div className="flex flex-col items-center text-center py-4">
            <BadgeArtwork achievement={achievement} size="lg" unlocked={isUnlocked} animate={isUnlocked} />
            <span className="mt-3 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full"
              style={{ color: rarity.colors.primary, background: `${rarity.colors.primary}15`, border: `1px solid ${rarity.colors.primary}30` }}>
              {rarity.label}
            </span>
            <h2 className="text-xl font-bold text-foreground mt-2">{displayName}</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">{displayDesc}</p>
          </div>
          {!isUnlocked && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Progress</span><span>{current.toLocaleString()} / {target.toLocaleString()}</span>
              </div>
              <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
          <div className="flex items-center justify-center gap-2 mt-4">
            {isUnlocked ? (
              <>
                <button onClick={onTogglePin}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isPinned ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-secondary text-foreground border border-border'}`}>
                  <Pin className="w-4 h-4" /> {isPinned ? 'Unpin' : 'Pin to Profile'}
                </button>
                <button onClick={onShare} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-500">
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="w-3.5 h-3.5" /> {achievement.xp} XP on unlock
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}