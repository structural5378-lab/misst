import React from 'react';
import { ICON_MAP } from '@/components/achievements/iconMap';
import { RARITIES } from '@/lib/rarityConfig';

export default function BadgeShowcase({ badges = [], onBadgeClick }) {
  if (badges.length === 0) return null;
  return (
    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-1 py-1">
      {badges.map(badge => {
        const rarity = RARITIES[badge.rarity] || RARITIES.common;
        const Icon = ICON_MAP[badge.icon] || ICON_MAP.Award;
        return (
          <button
            key={badge.id}
            onClick={() => onBadgeClick?.(badge)}
            className="prestige-badge"
          >
            <div
              className={`prestige-badge-icon prestige-badge-glow-${badge.rarity}`}
              style={{ background: rarity.gradient, color: rarity.iconColor }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="prestige-badge-label" style={{ color: rarity.colors.primary }}>
              {badge.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}