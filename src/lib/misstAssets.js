// MISST Dashboard visual asset pack.
//
// One cohesive visual language: premium, futuristic, tactical, GMRS/radio,
// dark cinematic, electric purple + electric blue + subtle neon green,
// black/dark graphite, high-end game-command-center aesthetic.
//
// These are PURPOSE-BUILT artwork assets (not CSS approximations). They are
// stored as platform-hosted PNGs. Transparency is per-asset (see below).
//
// This file is a REFERENCE MANIFEST only — it does NOT import or render
// anything. Dashboard components will consume these URLs during the
// authorized implementation phase. No dashboard component or index.css has
// been modified to add these assets.

export const MISST_ASSETS = {
  // Profile hero — layered identity emblem
  MISST_AVATAR_FRAME: {
    url: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/b8fcce9f2_generated_image.png',
    transparent: true,
    purpose: 'Circular tactical ring surrounding the user avatar (center transparent)',
  },
  MISST_AVATAR_ENERGY: {
    url: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/b4bbdab0b_generated_image.png',
    transparent: true,
    purpose: 'Circular energy halo behind the avatar frame',
  },
  MISST_LEVEL_SHIELD: {
    url: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/f725af67f_generated_image.png',
    transparent: true,
    purpose: 'Tactical shield emblem; app renders the level number in the empty center',
  },
  MISST_IDENTITY_ENERGY: {
    url: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/3335b2ad6_generated_image.png',
    transparent: true,
    purpose: 'Subtle ambient energy behind the avatar/badge area',
  },

  // Quick-action feature tiles
  MISST_TILE_CHAT: {
    url: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/47c8c785d_generated_image.png',
    transparent: true,
    purpose: 'Chat feature tile artwork (comms/radio/headset concept)',
  },
  MISST_TILE_TOOLS: {
    url: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/39fb6ff8d_generated_image.png',
    transparent: true,
    purpose: 'Tools feature tile artwork (radio tools/utility concept)',
  },
  MISST_TILE_ACTIVITY: {
    url: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/0c1344fc4_generated_image.png',
    transparent: true,
    purpose: 'Activity feature tile artwork (radar/signal/waveform concept)',
  },
  MISST_TILE_RANKINGS: {
    url: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/3e970f09d_generated_image.png',
    transparent: true,
    purpose: 'Rankings feature tile artwork (shield/trophy/achievement concept)',
  },

  // Command center
  MISST_COMMAND_OPERATOR: {
    url: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/48be6066e_generated_image.png',
    transparent: true,
    purpose: 'Tactical operator/comms workstation art for one side of the command card',
  },
  MISST_COMMAND_ENVIRONMENT: {
    url: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/8d8c5b0d3_generated_image.png',
    transparent: false,
    purpose: 'Wide cinematic radio-tower/command environment scene (background/scene)',
  },

  // Dashboard background
  MISST_DASHBOARD_BACKGROUND: {
    url: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/e95594275_generated_image.png',
    transparent: false,
    purpose: 'Full-bleed dark atmospheric dashboard background (decorative only, NOT wired to weather/lightning)',
  },
};

export default MISST_ASSETS;