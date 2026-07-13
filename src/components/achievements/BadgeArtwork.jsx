import React from 'react';
import { ICON_MAP } from './iconMap';
import { RARITIES } from '@/lib/rarityConfig';

export default function BadgeArtwork({ achievement, size = "md", unlocked = true, animate = false }) {
  const rarity = RARITIES[achievement.rarity] || RARITIES.common;
  const Icon = ICON_MAP[achievement.icon] || ICON_MAP.Award;
  const pCount = rarity.particleCount || 4;

  return (
    <div
      className={`ach-badge ${animate ? 'ach-glow-pulse' : ''} ${!unlocked ? 'ach-locked' : ''}`}
      data-size={size}
      style={{
        '--ach-border-grad': rarity.borderGradient,
        '--ach-glow': rarity.glow,
        '--ach-glow-color': rarity.colors.glow,
        '--ach-color': rarity.colors.primary,
      }}
    >
      <div className="ach-border" />
      <div className="ach-body" style={{ background: rarity.gradient }}>
        {rarity.holographic && unlocked && <div className="ach-holo" />}
        {rarity.particles && unlocked && (
          <div className="ach-particles">
            {Array.from({ length: pCount }).map((_, i) => (
              <div
                key={i}
                className="ach-particle"
                style={{
                  left: `${15 + i * (70 / pCount)}%`,
                  bottom: '15%',
                  animationDelay: `${i * 0.4}s`,
                  background: rarity.colors.primary,
                }}
              />
            ))}
          </div>
        )}
        <Icon className="ach-icon" style={{ color: rarity.iconColor }} />
      </div>
    </div>
  );
}