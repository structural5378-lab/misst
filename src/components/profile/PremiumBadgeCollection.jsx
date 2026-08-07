import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useMistUser } from '@/hooks/useMistUser';
import { useToast } from '@/components/ui/use-toast';
import { Crown, Gift, Check, Sparkles, Star, Heart } from 'lucide-react';
import PremiumBadge from '@/components/premium/PremiumBadge';

const RARITY_LABELS = {
  member: 'Member', supporter: 'Supporter', community: 'Community', rare: 'Rare',
  epic: 'Epic', elite: 'Elite', mythic: 'Mythic', legendary: 'Legendary', administration: 'Admin',
};
const MAX_FAVORITES = 6;

// PremiumBadgeCollection — profile section showing every badge the user owns,
// separated into Premium (purchased) and Earned collections. The user chooses
// one active badge to display app-wide and stars up to six favorites to
// showcase. Shows rarity, acquisition date, edition number, and gift info.
export default function PremiumBadgeCollection() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { mistUser } = useMistUser();

  const { data: ownership = [], isLoading } = useQuery({
    queryKey: ['premium-badge-ownership'],
    queryFn: () => base44.entities.PremiumBadgeOwnership.filter({ user_id: mistUser?.id, status: 'active' }),
    enabled: !!mistUser?.id,
  });

  const purchased = ownership.filter((o) => !o.is_earned);
  const earned = ownership.filter((o) => o.is_earned);
  const activeId = ownership.find((o) => o.is_active)?.badge_id;
  const favorites = ownership.filter((o) => o.is_favorite);

  const setActive = async (own) => {
    try {
      for (const o of ownership) if (o.is_active) await base44.entities.PremiumBadgeOwnership.update(o.id, { is_active: false });
      await base44.entities.PremiumBadgeOwnership.update(own.id, { is_active: true });
      qc.invalidateQueries({ queryKey: ['premium-badge-ownership'] });
      qc.invalidateQueries({ queryKey: ['active-badge'] });
      toast({ title: 'Active badge updated' });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const toggleFavorite = async (own) => {
    const nextFav = !own.is_favorite;
    if (nextFav && favorites.length >= MAX_FAVORITES && !own.is_favorite) {
      toast({ title: `You can showcase up to ${MAX_FAVORITES} favorites`, variant: 'destructive' });
      return;
    }
    try {
      await base44.entities.PremiumBadgeOwnership.update(own.id, { is_favorite: nextFav });
      qc.invalidateQueries({ queryKey: ['premium-badge-ownership'] });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const renderRow = (o) => {
    const badge = {
      name: o.badge_name, icon: o.badge_icon, artwork_url: o.badge_artwork_url,
      effect: o.badge_effect, accent_color: o.badge_accent_color,
    };
    const isActive = o.is_active;
    const acquired = o.purchased_at ? new Date(o.purchased_at).toLocaleDateString() : (o.created_date ? new Date(o.created_date).toLocaleDateString() : null);
    return (
      <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl bg-card/60 border border-white/[0.06] backdrop-blur-md">
        <PremiumBadge badge={badge} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground truncate">{o.badge_name}</p>
            {o.is_gift && <Gift className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            {o.is_upgrade && <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
          </div>
          <p className="text-[11px] text-muted-foreground capitalize">
            {RARITY_LABELS[o.badge_rarity] || o.badge_rarity} · {o.is_earned ? 'Earned' : o.is_upgrade ? 'Upgraded' : 'Purchased'}
            {o.edition_number > 0 && o.badge_edition_size > 0 && ` · #${o.edition_number} of ${o.badge_edition_size}`}
            {acquired && ` · ${acquired}`}
          </p>
          {o.is_gift && o.gift_message && (
            <p className="text-[10px] text-emerald-400/80 italic mt-0.5 truncate">"{o.gift_message}"{!o.is_anonymous_gift && o.gifted_by_name ? ` — ${o.gifted_by_name}` : ' — Anonymous'}</p>
          )}
          {o.expires_at && !o.is_earned && <p className="text-[10px] text-muted-foreground/70">Renews {new Date(o.expires_at).toLocaleDateString()}</p>}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button
            onClick={() => setActive(o)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${isActive ? 'bg-primary/20 border-primary text-primary' : 'border-white/10 text-foreground hover:border-primary/40'}`}
          >
            {isActive ? (<span className="inline-flex items-center gap-1"><Check className="w-3 h-3" /> Active</span>) : 'Set Active'}
          </button>
          <button
            onClick={() => toggleFavorite(o)}
            className={`p-1 rounded-full transition-colors ${o.is_favorite ? 'text-amber-400' : 'text-muted-foreground/60 hover:text-foreground'}`}
            title={o.is_favorite ? 'Remove from showcase' : 'Add to showcase'}
          >
            <Star className={`w-3.5 h-3.5 ${o.is_favorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-4 rounded-xl bg-card border border-border/60 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-400" /> Premium Badge Collection
        </h3>
        <Link to="/premium-badges" className="text-xs text-primary font-medium hover:text-primary/80 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Browse Badges
        </Link>
      </div>

      {/* Showcase strip */}
      {favorites.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1"><Heart className="w-3 h-3" /> Showcase ({favorites.length}/{MAX_FAVORITES})</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {favorites.map((o) => (
              <div key={o.id} className="shrink-0 flex flex-col items-center gap-1">
                <PremiumBadge badge={{ name: o.badge_name, icon: o.badge_icon, artwork_url: o.badge_artwork_url, effect: o.badge_effect, accent_color: o.badge_accent_color }} size="md" />
                <span className="text-[9px] text-muted-foreground max-w-[64px] truncate">{o.badge_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {ownership.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-3">You don't own any premium badges yet.</p>
          <Link to="/premium-badges" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 text-violet-300 text-sm font-medium">
            <Crown className="w-4 h-4" /> Explore Premium Badges
          </Link>
        </div>
      ) : (
        <>
          {purchased.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Premium ({purchased.length})</p>
              {purchased.map(renderRow)}
            </div>
          )}
          {earned.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Earned ({earned.length})</p>
              {earned.map(renderRow)}
            </div>
          )}
        </>
      )}
    </div>
  );
}