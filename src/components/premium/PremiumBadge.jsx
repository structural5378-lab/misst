import React from 'react';
import {
  Award, Crown, Shield, Diamond, Sparkles, Radio, Wifi, Mountain, Radar, Wrench,
  MessageSquare, Star, User, Zap, Siren, Gem, Flame, Snowflake, Trophy, Medal,
  Bolt, SatelliteDish, SignalHigh, Cpu, Heart, Anchor, Plane, Rocket,
} from 'lucide-react';

// Curated icon map — admins pick from these lucide icons for badge artwork.
export const PREMIUM_ICON_MAP = {
  Award, Crown, Shield, Diamond, Sparkles, Radio, Wifi, Mountain, Radar, Wrench,
  MessageSquare, Star, User, Zap, Siren, Gem, Flame, Snowflake, Trophy, Medal,
  Bolt, SatelliteDish, SignalHigh, Cpu, Heart, Anchor, Plane, Rocket,
};

const SIZES = { '3xs': 'w-3.5 h-3.5', '2xs': 'w-4 h-4', xs: 'w-5 h-5', sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16', xl: 'w-24 h-24' };
const ICON_SIZES = { '3xs': 8, '2xs': 10, xs: 12, sm: 16, md: 22, lg: 30, xl: 46 };

// PremiumBadge — reusable renderer for a premium badge with its GPU-accelerated
// visual effect. Used in the storefront, profile collection, admin, and
// app-wide surfaces (chat, leaderboards, avatars, etc.).
export default function PremiumBadge({ badge = {}, size = 'md', className = '', style = {} }) {
  const Icon = PREMIUM_ICON_MAP[badge.icon] || Award;
  const accent = badge.accent_color || '#a855f7';
  const fx = `pbadge-${badge.effect || 'static_glow'}`;
  const sz = SIZES[size] || SIZES.md;
  return (
    <div
      className={`pbadge ${fx} ${sz} rounded-2xl ${className}`}
      style={{ '--pbadge-accent': accent, ...style }}
      title={badge.name}
    >
      <div className="pbadge-fx" />
      <div className="pbadge-body">
        {badge.artwork_url ? (
          <img src={badge.artwork_url} alt={badge.name} className="w-full h-full object-contain rounded-2xl" />
        ) : (
          <Icon size={ICON_SIZES[size] || 22} strokeWidth={2} style={{ filter: `drop-shadow(0 0 6px ${accent})` }} />
        )}
      </div>
    </div>
  );
}