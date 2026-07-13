import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Share2 } from 'lucide-react';
import BadgeArtwork from './BadgeArtwork';
import { RARITIES } from '@/lib/rarityConfig';
import { getAchievementById } from '@/lib/achievementsData';

function playUnlockSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'triangle';
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.6);
    });
  } catch {}
}

export default function UnlockCelebration({ achievementId, onClose, onShare }) {
  const achievement = getAchievementById(achievementId);
  const rarity = achievement ? RARITIES[achievement.rarity] : null;

  useEffect(() => {
    if (!achievement) return;
    playUnlockSound();
    const colors = [rarity.colors.primary, rarity.colors.secondary, '#ffffff'];
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 }, colors, disableForReducedMotion: true });
    const t = setTimeout(() => confetti({ particleCount: 50, spread: 100, origin: { y: 0.7 }, colors, disableForReducedMotion: true }), 350);
    return () => clearTimeout(t);
  }, [achievementId]);

  if (!achievement || !rarity) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md px-6"
      style={{ paddingTop: 'calc(2rem + env(safe-area-inset-top))', paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
      <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/60 hover:text-white z-10">
        <X className="w-6 h-6" />
      </button>
      <p className="text-[10px] font-bold tracking-[0.3em] uppercase mb-6 ach-shine-text" style={{ '--ach-color': rarity.colors.primary }}>Achievement Unlocked</p>
      <div className="ach-unlock-zoom">
        <BadgeArtwork achievement={achievement} size="xl" unlocked animate />
      </div>
      <h2 className="text-2xl font-bold text-white mt-6 text-center">{achievement.name}</h2>
      <p className="text-sm text-white/70 mt-2 text-center max-w-xs">{achievement.flavor}</p>
      <div className="flex items-center gap-1.5 mt-4 px-4 py-1.5 rounded-full" style={{ background: rarity.gradient }}>
        <span className="text-xs font-bold text-white">+{achievement.xp} XP</span>
      </div>
      <div className="flex gap-3 mt-8">
        <button onClick={onShare} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors">
          <Share2 className="w-4 h-4" /> Share
        </button>
        <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-black" style={{ background: rarity.colors.primary }}>
          Continue
        </button>
      </div>
    </div>
  );
}