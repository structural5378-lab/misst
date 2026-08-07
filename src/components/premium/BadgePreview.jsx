import React from 'react';
import {
  Dialog, DialogContent, DialogClose,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import PremiumBadge from './PremiumBadge';

const RARITY_LABELS = {
  member: 'Member', supporter: 'Supporter', community: 'Community', rare: 'Rare',
  epic: 'Epic', elite: 'Elite', mythic: 'Mythic', legendary: 'Legendary', administration: 'Admin',
};
const EFFECT_LABELS = {
  static_glow: 'Static Glow', electric_aura: 'Electric Aura', purple_lightning: 'Purple Lightning',
  blue_plasma: 'Blue Plasma', gold_energy_pulse: 'Gold Energy Pulse', green_radar_sweep: 'Green Radar Sweep',
  fire_ember: 'Fire Ember', ice_frost: 'Ice Frost', rainbow_prism: 'Rainbow Prism', thunder_storm: 'Thunder Storm',
  neon_pulse: 'Neon Pulse', electric_sparks: 'Electric Sparks', fire_aura: 'Fire Aura', ice_crystal: 'Ice Crystal',
  shadow_mist: 'Shadow Mist', galaxy_swirl: 'Galaxy Swirl', cosmic_dust: 'Cosmic Dust', orbit_rings: 'Orbit Rings',
  meteor_trail: 'Meteor Trail',
};

// BadgePreview — full-screen preview modal showing a large animated badge with
// its effect, rarity, and price. Lets members see the animation before buying.
export default function BadgePreview({ badge, onClose, onPurchase, onGift, owned, active, onSetActive }) {
  if (!badge) return null;
  const accent = badge.accent_color || '#a855f7';
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm overflow-hidden p-0">
        <button onClick={onClose} className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/40 text-white/80 hover:text-white"><X className="w-4 h-4" /></button>
        <div className="relative flex flex-col items-center text-center px-6 pt-10 pb-6 bg-gradient-to-b from-transparent to-card" style={{ boxShadow: `inset 0 0 60px ${accent}22` }}>
          <div className="my-4"><PremiumBadge badge={badge} size="xl" /></div>
          <h2 className="text-xl font-black uppercase tracking-wide" style={{ color: accent }}>{badge.name}</h2>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">{badge.description}</p>

          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ color: accent, background: `${accent}1a`, border: `1px solid ${accent}40` }}>{RARITY_LABELS[badge.rarity] || badge.rarity}</span>
            <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">{EFFECT_LABELS[badge.effect] || badge.effect}</span>
            {badge.is_founder && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">Founder</span>}
            {badge.edition_size > 0 && <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">Limited · {badge.edition_size}</span>}
          </div>

          <div className="mt-5 w-full">
            {owned ? (
              <button onClick={onSetActive} className={`w-full py-2.5 rounded-full text-sm font-semibold border transition-colors ${active ? 'bg-primary/20 border-primary text-primary' : 'border-white/10 text-foreground hover:border-primary/40'}`}>
                {active ? '✓ Active Badge' : 'Set as Active Badge'}
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => onPurchase(badge)} className="flex-1 py-2.5 rounded-full text-sm font-semibold border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] transition-colors" style={{ color: accent }}>
                  ${Number(badge.price || 0).toFixed(2)} / year
                </button>
                <button onClick={() => onGift(badge)} className="px-3 py-2.5 rounded-full text-sm font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors" title="Gift this badge">
                  Gift
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}