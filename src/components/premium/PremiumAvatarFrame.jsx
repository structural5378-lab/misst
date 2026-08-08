import React from 'react';
import { useActiveBadge } from '@/hooks/useActiveBadge';
import LightingEffect from '@/lib/lighting/LightingEffect';

// PremiumAvatarFrame — wraps the profile avatar with the user's ACTIVE premium
// badge visual effect via the centralized Lighting Engine. When the user has an
// active premium badge, its configured effect (glow / aura / lightning / plasma /
// etc.) renders as the avatar frame. When no active badge, falls back to the
// existing achievement-tier gradient frame. The effect is strictly localized to
// the avatar — the rest of the profile never animates.
//
// Reuses the existing Lighting Engine only:
//   useActiveBadge  → server-validated active badge (getActiveBadge backend fn)
//   LightingEffect  → the single Lighting Engine renderer (no per-surface CSS)
// Every effect in the registry works here unchanged — no duplicate effect system.
export default function PremiumAvatarFrame({ userId, avatarFrame = 'common', children, className = '' }) {
  const { badge } = useActiveBadge(userId);

  if (!badge) {
    return (
      <div className={`avatar-frame avatar-frame-${avatarFrame || 'common'} ${className}`.trim()}>
        {children}
      </div>
    );
  }

  return (
    <LightingEffect
      effect={badge.effect || 'static_glow'}
      accent={badge.accent_color || '#a855f7'}
      surface="avatar"
      className={`p-[3px] rounded-2xl ${className}`.trim()}
      title={badge.name}
    >
      {children}
    </LightingEffect>
  );
}