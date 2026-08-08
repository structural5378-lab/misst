import React from 'react';
import { useActiveBadge } from '@/hooks/useActiveBadge';
import PremiumBadge from './PremiumBadge';

// ActiveBadge — renders a user's active premium badge (with its animated effect)
// next to their name/avatar. The single reusable component every page uses to
// display the active badge. Lazy via the react-query cache in useActiveBadge.
//
// size: 'inline' (16px, default for name rows) | 'sm' (20px) | 'md' (32px) | 'lg' (48px)
const PB_SIZE = { inline: '2xs', sm: 'xs', md: 'sm', lg: 'md', xl: 'lg' };

export default function ActiveBadge({ userId, size = 'inline', className = '', showName = false }) {
  const { badge } = useActiveBadge(userId);
  if (!badge) return null;
  return (
    <span className={`inline-flex items-center gap-1 align-middle ${className}`} title={badge.name}>
      <PremiumBadge badge={badge} size={PB_SIZE[size] || '2xs'} />
      {showName && (
        <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: badge.accent_color }}>
          {badge.name}
        </span>
      )}
    </span>
  );
}

// ActiveBadgeView — presentational variant that takes a pre-fetched badge
// object (for batch-fetched lists using useActiveBadges) instead of fetching.
export function ActiveBadgeView({ badge, size = 'inline', className = '', showName = false }) {
  if (!badge) return null;
  return (
    <span className={`inline-flex items-center gap-1 align-middle ${className}`} title={badge.name}>
      <PremiumBadge badge={badge} size={PB_SIZE[size] || '2xs'} />
      {showName && (
        <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: badge.accent_color }}>
          {badge.name}
        </span>
      )}
    </span>
  );
}