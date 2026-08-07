import React from 'react';
import PremiumBadge from './PremiumBadge';
import { Check, Heart, Gift, Lock, Crown, Sparkles, Calendar } from 'lucide-react';

// PremiumBadgeCard — storefront card for one badge. Shows the animated badge,
// name, description, limited-edition numbering, wishlist toggle, gift button,
// sold-out state, and either a price pill (purchase) or owned/active state.
export default function PremiumBadgeCard({
  badge, owned, active, ownershipId, ownedEdition,
  onPurchase, onSetActive, onGift, onPreview, onWishlist, isWishlisted, soldOut,
}) {
  const accent = badge.accent_color || '#a855f7';
  const edition = badge.edition_size > 0;
  const sold = badge.purchases_count || 0;
  const remaining = edition ? Math.max(0, badge.edition_size - sold) : 0;

  return (
    <div
      className="relative rounded-2xl bg-card/70 border border-white/[0.06] backdrop-blur-md p-4 flex flex-col items-center text-center overflow-hidden transition-transform active:scale-[0.98]"
      style={{ boxShadow: `0 0 18px ${accent}22` }}
    >
      {/* Ribbons */}
      {badge.is_best_value && (
        <span className="absolute top-2 right-2 z-10 text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-[0_0_10px_rgba(251,191,36,0.6)]">Best Value</span>
      )}
      {badge.is_featured && (
        <span className="absolute top-2 left-2 z-10 text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" />Featured</span>
      )}

      {/* Wishlist heart */}
      <button
        onClick={() => onWishlist?.(badge.id)}
        className={`absolute top-2 z-10 p-1 rounded-full transition-colors ${badge.is_featured ? 'right-12' : 'right-2'} ${isWishlisted ? 'text-rose-400' : 'text-muted-foreground/60 hover:text-foreground'}`}
        title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-400' : ''}`} />
      </button>

      {/* Badge (click to preview) */}
      <button onClick={() => onPreview?.(badge)} className="my-2 active:scale-95 transition-transform" title="Preview">
        <PremiumBadge badge={badge} size="xl" />
      </button>

      <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: accent }}>{badge.name}</h3>
      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 min-h-[28px]">{badge.description}</p>

      {/* Edition / limited info */}
      <div className="flex flex-wrap items-center justify-center gap-1 mt-1.5">
        {badge.is_founder && <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-0.5"><Crown className="w-2.5 h-2.5" />Founder</span>}
        {badge.is_seasonal && <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />Seasonal</span>}
        {edition && (
          <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
            {owned && ownedEdition ? `#${ownedEdition} of ${badge.edition_size}` : `${remaining} left`}
          </span>
        )}
      </div>

      <div className="mt-3 w-full">
        {soldOut ? (
          <div className="w-full py-2 rounded-full text-xs font-semibold border border-white/10 text-muted-foreground flex items-center justify-center gap-1"><Lock className="w-3 h-3" /> Sold Out</div>
        ) : owned ? (
          <button
            onClick={() => onSetActive && onSetActive(ownershipId)}
            className={`w-full py-2 rounded-full text-xs font-semibold border transition-colors ${active ? 'bg-primary/20 border-primary text-primary' : 'border-white/10 text-foreground hover:border-primary/40'}`}
          >
            {active ? (<span className="inline-flex items-center gap-1"><Check className="w-3 h-3" /> Active</span>) : 'Set Active'}
          </button>
        ) : (
          <div className="flex gap-1.5">
            <button
              onClick={() => onPurchase && onPurchase(badge)}
              className="flex-1 py-2 rounded-full text-xs font-semibold border border-white/15 bg-white/[0.04] hover:bg-white/[0.1] transition-colors"
              style={{ color: accent }}
            >
              ${Number(badge.price || 0).toFixed(2)}/yr
            </button>
            <button
              onClick={() => onGift && onGift(badge)}
              className="px-2.5 py-2 rounded-full text-xs font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors"
              title="Gift this badge"
            >
              <Gift className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}