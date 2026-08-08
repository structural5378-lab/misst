import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

// useLighting — the single hook every lighting-aware component uses to read
// the user's animation-intensity preference and OS reduced-motion setting.
//
// Intensity comes from the existing ThemeContext (animationIntensity), which
// already drives the global body classes `anim-minimal` / `anim-performance`.
// Those classes suppress animations platform-wide via CSS (!important), so
// the hook does NOT re-implement suppression — it only EXPOSES the resolved
// state so components can make per-surface decisions in future phases.
//
// Returns:
//   intensity      'minimal' | 'normal' | 'performance' (current user pref)
//   reducedMotion boolean — OS prefers-reduced-motion is active
//   enabled        false only in performance mode (non-essential effects may
//                  opt to not render at all)
//   minimal        true in minimal mode (effects may reduce duration/opacity)
//
// No CSS, no timers, no JS animation loops — pure state.
export function useLighting() {
  const { animationIntensity } = useTheme();
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const intensity = animationIntensity || 'normal';
  return {
    intensity,
    reducedMotion,
    enabled: intensity !== 'performance',
    minimal: intensity === 'minimal',
  };
}