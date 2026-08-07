import React from 'react';
import PremiumBadge from './PremiumBadge';
import { Check } from 'lucide-react';

// PremiumBadgeCard — storefront card for one badge. Shows the animated badge,
// name, description, and either a price pill (purchase) or owned/active state.
export default function PremiumBadgeCard({ badge, owned, active, ownershipId, onPurchase, onSetActive }) {
  const accent = badge.accent_color || '#a855f7';
  return (
    <div
      className="relative rounded-2xl bg-card/70 border border-white/[0.06] backdrop-blur-md p-4 flex flex-col items-center text-center overflow-hidden transition-transform active:scale-[0.98]"
      style={{ boxShadow: `0 0 18px ${accent}22` }}
    >
      {badge.is_best_value && (
        <span className="absolute top-2 right-2 z-10 text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-[0_0_10px_rgba(251,191,36,0.6)]">
          Best Value
        </span>
      )}
      <div className="my-2">
        <PremiumBadge badge={badge} size="xl" />
      </div>
      <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: accent }}>{badge.name}</h3>
      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 min-h-[28px]">{badge.description}</p>
      <div className="mt-3 w-full">
        {owned ? (
          <button
            onClick={() => onSetActive && onSetActive(ownershipId)}
            className={`w-full py-2 rounded-full text-xs font-semibold border transition-colors ${active ? 'bg-primary/20 border-primary text-primary' : 'border-white/10 text-foreground hover:border-primary/40'}`}
          >
            {active ? (<span className="inline-flex items-center gap-1"><Check className="w-3 h-3" /> Active</span>) : 'Set Active'}
          </button>
        ) : (
          <button
            onClick={() => onPurchase && onPurchase(badge)}
            className="w-full py-2 rounded-full text-xs font-semibold border border-white/15 bg-white/[0.04] hover:bg-white/[0.1] transition-colors"
            style={{ color: accent }}
          >
            ${Number(badge.price || 0).toFixed(2)} / year
          </button>
        )}
      </div>
    </div>
  );
}