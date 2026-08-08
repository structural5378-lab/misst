// MISST Lighting Engine — Centralized Effect Registry
//
// Single source of truth for every visual lighting effect in MISST. Each effect
// maps to its existing GPU-accelerated CSS class in src/index.css (pbadge-*), so
// the registry is an *abstraction over* the current implementation — not a
// duplicate. Components ask the registry for an effect's metadata; the renderer
// (LightingEffect.jsx) applies the CSS class. This lets future surfaces (chat,
// notifications, profiles, nav, …) reuse the same effects without per-feature
// CSS, while existing PremiumBadge rendering is unchanged.
//
// Adding a new effect = add one entry here + its keyframes in index.css. Nothing
// else in the engine changes.

// ─── Categories ─────────────────────────────────────────────────────────────
export const EFFECT_CATEGORIES = {
  glow: 'Glow',
  electric: 'Electric',
  plasma: 'Plasma',
  energy: 'Energy',
  radar: 'Radar',
  fire: 'Fire',
  ice: 'Ice',
  prism: 'Prism',
  storm: 'Storm',
  neon: 'Neon',
  shadow: 'Shadow',
  cosmic: 'Cosmic',
};

// ─── Surfaces (where an effect can be applied) ──────────────────────────────
export const SURFACES = {
  badge: 'badge',
  avatar: 'avatar',
  profile: 'profile',
  chat: 'chat',
  notification: 'notification',
  banner: 'banner',
  nav: 'nav',
  status: 'status',
  // Geographic / weather-reaction surfaces (reserved for future event-driven
  // integration with the existing weather/lightning pipeline — NOT used yet).
  radioscope: 'radioscope',
  weather: 'weather',
};

// ─── Premium tiers (metadata only — no gating in Phase 1) ───────────────────
export const TIERS = { basic: 'basic', premium: 'premium', elite: 'elite' };

// ─── Effect metadata ────────────────────────────────────────────────────────
// animated:        whether the effect uses CSS keyframes
// supportsAccent:  whether the effect reads --pbadge-accent (true) or uses
//                  its own fixed palette (false)
// reducedMotion:   'subtle' = keep a static glow/opacity (default badge behavior)
//                  'none'   = hide the effect layer entirely under reduced motion
export const LIGHTING_EFFECTS = {
  static_glow: {
    id: 'static_glow', name: 'Static Glow', category: 'glow',
    cssClass: 'pbadge-static-glow', animated: true, supportsAccent: true,
    defaultIntensity: 'normal', tier: TIERS.basic, surfaces: [SURFACES.badge],
    reducedMotion: 'subtle',
  },
  electric_aura: {
    id: 'electric_aura', name: 'Electric Aura', category: 'electric',
    cssClass: 'pbadge-electric-aura', animated: true, supportsAccent: true,
    defaultIntensity: 'normal', tier: TIERS.premium, surfaces: [SURFACES.badge],
    reducedMotion: 'subtle',
  },
  purple_lightning: {
    id: 'purple_lightning', name: 'Purple Lightning', category: 'electric',
    cssClass: 'pbadge-purple-lightning', animated: true, supportsAccent: true,
    defaultIntensity: 'normal', tier: TIERS.premium, surfaces: [SURFACES.badge],
    reducedMotion: 'subtle',
  },
  blue_plasma: {
    id: 'blue_plasma', name: 'Blue Plasma', category: 'plasma',
    cssClass: 'pbadge-blue-plasma', animated: true, supportsAccent: false,
    defaultIntensity: 'normal', tier: TIERS.premium, surfaces: [SURFACES.badge],
    reducedMotion: 'subtle',
  },
  gold_energy_pulse: {
    id: 'gold_energy_pulse', name: 'Gold Energy Pulse', category: 'energy',
    cssClass: 'pbadge-gold-energy-pulse', animated: true, supportsAccent: true,
    defaultIntensity: 'normal', tier: TIERS.premium, surfaces: [SURFACES.badge],
    reducedMotion: 'subtle',
  },
  green_radar_sweep: {
    id: 'green_radar_sweep', name: 'Green Radar Sweep', category: 'radar',
    cssClass: 'pbadge-green-radar-sweep', animated: true, supportsAccent: false,
    defaultIntensity: 'normal', tier: TIERS.premium, surfaces: [SURFACES.badge],
    reducedMotion: 'subtle',
  },
  fire_ember: {
    id: 'fire_ember', name: 'Fire Ember', category: 'fire',
    cssClass: 'pbadge-fire-ember', animated: true, supportsAccent: false,
    defaultIntensity: 'normal', tier: TIERS.premium, surfaces: [SURFACES.badge],
    reducedMotion: 'subtle',
  },
  ice_frost: {
    id: 'ice_frost', name: 'Ice Frost', category: 'ice',
    cssClass: 'pbadge-ice-frost', animated: true, supportsAccent: false,
    defaultIntensity: 'normal', tier: TIERS.premium, surfaces: [SURFACES.badge],
    reducedMotion: 'subtle',
  },
  rainbow_prism: {
    id: 'rainbow_prism', name: 'Rainbow Prism', category: 'prism',
    cssClass: 'pbadge-rainbow-prism', animated: true, supportsAccent: false,
    defaultIntensity: 'normal', tier: TIERS.elite, surfaces: [SURFACES.badge],
    reducedMotion: 'subtle',
  },
  thunder_storm: {
    id: 'thunder_storm', name: 'Thunder Storm', category: 'storm',
    cssClass: 'pbadge-thunder-storm', animated: true, supportsAccent: false,
    defaultIntensity: 'normal', tier: TIERS.elite, surfaces: [SURFACES.badge],
    reducedMotion: 'subtle',
  },
  neon_pulse: {
    id: 'neon_pulse', name: 'Neon Pulse', category: 'neon',
    cssClass: 'pbadge-neon-pulse', animated: true, supportsAccent: true,
    defaultIntensity: 'normal', tier: TIERS.premium, surfaces: [SURFACES.badge],
    reducedMotion: 'subtle',
  },
  electric_sparks: {
    id: 'electric_sparks', name: 'Electric Sparks', category: 'electric',
    cssClass: 'pbadge-electric-sparks', animated: true, supportsAccent: true,
    defaultIntensity: 'normal', tier: TIERS.premium, surfaces: [SURFACES.badge],
    reducedMotion: 'subtle',
  },
  fire_aura: {
    id: 'fire_aura', name: 'Fire Aura', category: 'fire',
    cssClass: 'pbadge-fire-aura', animated: true, supportsAccent: false,
    defaultIntensity: 'normal', tier: TIERS.premium, surfaces: [SURFACES.badge],
    reducedMotion: 'subtle',
  },
  ice_crystal: {
    id: 'ice_crystal', name: 'Ice Crystal', category: 'ice',
    cssClass: 'pbadge-ice-crystal', animated: true, supportsAccent: false,
    defaultIntensity: 'normal', tier: TIERS.premium, surfaces: [SURFACES.badge],
    reducedMotion: 'subtle',
  },
  shadow_mist: {
    id: 'shadow_mist', name: 'Shadow Mist', category: 'shadow',
    cssClass: 'pbadge-shadow-mist', animated: true, supportsAccent: false,
    defaultIntensity: 'normal', tier: TIERS.premium, surfaces: [SURFACES.badge],
    reducedMotion: 'subtle',
  },
  galaxy_swirl: {
    id: 'galaxy_swirl', name: 'Galaxy Swirl', category: 'cosmic',
    cssClass: 'pbadge-galaxy-swirl', animated: true, supportsAccent: false,
    defaultIntensity: 'normal', tier: TIERS.elite, surfaces: [SURFACES.badge],
    reducedMotion: 'subtle',
  },
  cosmic_dust: {
    id: 'cosmic_dust', name: 'Cosmic Dust', category: 'cosmic',
    cssClass: 'pbadge-cosmic-dust', animated: true, supportsAccent: false,
    defaultIntensity: 'normal', tier: TIERS.premium, surfaces: [SURFACES.badge],
    reducedMotion: 'subtle',
  },
  orbit_rings: {
    id: 'orbit_rings', name: 'Orbit Rings', category: 'energy',
    cssClass: 'pbadge-orbit-rings', animated: true, supportsAccent: true,
    defaultIntensity: 'normal', tier: TIERS.premium, surfaces: [SURFACES.badge],
    reducedMotion: 'subtle',
  },
  meteor_trail: {
    id: 'meteor_trail', name: 'Meteor Trail', category: 'cosmic',
    cssClass: 'pbadge-meteor-trail', animated: true, supportsAccent: true,
    defaultIntensity: 'normal', tier: TIERS.premium, surfaces: [SURFACES.badge],
    reducedMotion: 'subtle',
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const FALLBACK = LIGHTING_EFFECTS.static_glow;

export function getEffectMeta(id) {
  return LIGHTING_EFFECTS[id] || FALLBACK;
}

export function getEffectClass(id) {
  return getEffectMeta(id).cssClass;
}

export function listEffects() {
  return Object.values(LIGHTING_EFFECTS);
}

export function listEffectIds() {
  return Object.keys(LIGHTING_EFFECTS);
}

export function effectsByCategory(category) {
  return listEffects().filter((e) => e.category === category);
}

export function isEffectAnimated(id) {
  return getEffectMeta(id).animated;
}

export function effectSupportsAccent(id) {
  return getEffectMeta(id).supportsAccent;
}