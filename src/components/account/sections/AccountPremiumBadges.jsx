import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { mist } from '@/api/mist';
import { useMistUser } from '@/hooks/useMistUser';
import { Crown, Sparkles } from 'lucide-react';
import PremiumBadge from '@/components/premium/PremiumBadge';

// AccountPremiumBadges — Settings/Account section that previews the user's
// active premium badge and links to the storefront.
export default function AccountPremiumBadges() {
  const { mistUser } = useMistUser();
  const { data: ownership = [] } = useQuery({
    queryKey: ['premium-badge-ownership'],
    queryFn: () => mist.entities.PremiumBadgeOwnership.filter({ user_id: mistUser?.id, status: 'active' }),
    enabled: !!mistUser?.id,
  });
  const active = ownership.find((o) => o.is_active);

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-purple-600/10 border border-amber-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-foreground">Premium Badges</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Stand out across MISST with animated premium badges next to your name. Support the network and show your status.</p>
        {active ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-card/60 border border-white/[0.06] mb-3">
            <PremiumBadge badge={{ name: active.badge_name, icon: active.badge_icon, artwork_url: active.badge_artwork_url, effect: active.badge_effect, accent_color: active.badge_accent_color }} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{active.badge_name}</p>
              <p className="text-[11px] text-emerald-400">Active badge</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mb-3">You have no active premium badge.</p>
        )}
        <Link to="/premium-badges" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 text-amber-300 text-sm font-medium">
          <Sparkles className="w-4 h-4" /> Browse Premium Badges
        </Link>
      </div>
    </div>
  );
}