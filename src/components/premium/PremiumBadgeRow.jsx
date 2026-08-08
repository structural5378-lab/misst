import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PremiumBadge from './PremiumBadge';

// PremiumBadgeRow — displays ALL of a user's active premium badges in a single
// horizontal row (max 6, no wrap). Replaces the single-active-badge display so
// every awarded badge is visible at once. Reads the user's own
// PremiumBadgeOwnership rows (RLS permits self + admin).
export default function PremiumBadgeRow({ userId, max = 6, size = 'md' }) {
  const { data: ownerships = [] } = useQuery({
    queryKey: ['premium-badge-row', userId],
    queryFn: async () => {
      if (!userId) return [];
      return await base44.entities.PremiumBadgeOwnership.filter({
        user_id: userId,
        status: 'active',
      });
    },
    enabled: !!userId,
    staleTime: 30000,
  });

  if (!ownerships.length) return null;

  const badges = ownerships.slice(0, max).map((o) => ({
    name: o.badge_name,
    icon: o.badge_icon,
    artwork_url: o.badge_artwork_url,
    effect: o.badge_effect,
    accent_color: o.badge_accent_color,
  }));

  return (
    <div className="flex items-center gap-2 flex-nowrap overflow-x-auto scrollbar-hide">
      {badges.map((b, i) => (
        <div key={i} className="shrink-0 drop-shadow-md">
          <PremiumBadge badge={b} size={size} />
        </div>
      ))}
    </div>
  );
}