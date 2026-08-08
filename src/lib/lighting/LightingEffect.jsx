import React from 'react';
import { getEffectMeta } from '@/lib/lighting/effectRegistry';
import { useLighting } from '@/hooks/useLighting';

// LightingEffect — the reusable renderer for any MISST visual lighting effect.
//
// This is the single component every future surface (badges, avatars, chat,
// notifications, profiles, nav, …) will use to render a glow/animation. It
// produces the EXACT same DOM as the original PremiumBadge renderer
// (`.pbadge .pbadge-<effect>` + `.pbadge-fx` + `.pbadge-body`), so every
// existing `.pbadge-*` keyframe in src/index.css applies unchanged — zero
// visual regression for badges today, and a clean extension point for
// non-badge surfaces tomorrow (pass no `size` and control sizing via the
// parent / className).
//
// Props:
//   effect   effect id (defaults to 'static_glow'; unknown ids fall back)
//   accent   hex color injected as --pbadge-accent (effects that read it glow
//            in this color; effects with their own palette ignore it)
//   size     optional badge size key ('3xs'…'xl'); omit for non-badge surfaces
//   surface  logical surface ('badge' | 'avatar' | 'chat' | …) — metadata only,
//            recorded as a data attribute for future per-surface CSS/JS
//   className/style/title  forwarded to the wrapper
//   children the visible content (icon, image, text, …) placed in .pbadge-body
//
// Intensity + reduced-motion are read via useLighting and recorded as data
// attributes. The actual animation suppression is handled by the existing
// global CSS (body.anim-minimal / body.anim-performance / @media reduced-motion
// on .pbadge-fx), so this component never fights the platform-wide controls.

const SIZES = {
  '3xs': 'w-3.5 h-3.5',
  '2xs': 'w-4 h-4',
  xs: 'w-5 h-5',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

export default function LightingEffect({
  effect = 'static_glow',
  accent = '#a855f7',
  size,
  surface = 'badge',
  className = '',
  style = {},
  title,
  children,
  ...rest
}) {
  const { intensity, reducedMotion } = useLighting();
  const meta = getEffectMeta(effect);
  const sizeClass = size ? SIZES[size] || '' : '';
  // Preserve the exact badge wrapper shape: pbadge + effect + size + rounded-2xl.
  // Non-badge surfaces (no size) get no rounding — the parent controls shape.
  const rounding = size ? 'rounded-2xl' : '';

  return (
    <div
      className={`pbadge ${meta.cssClass} ${sizeClass} ${rounding} ${className}`.replace(/\s+/g, ' ').trim()}
      style={{ '--pbadge-accent': accent, ...style }}
      title={title}
      data-lighting={meta.id}
      data-lighting-surface={surface}
      data-lighting-intensity={intensity}
      data-lighting-reduced={reducedMotion ? '1' : '0'}
      {...rest}
    >
      <div className="pbadge-fx" />
      <div className="pbadge-body">{children}</div>
    </div>
  );
}