// MISST Dashboard visual asset pack (v2 — solid-black backgrounds).
//
// The transparent-style assets were regenerated with SOLID BLACK backgrounds
// (#000000) instead of alpha transparency, because the image generator baked
// a checkerboard grid into true-transparent PNGs. To composite them over the
// dark UI, components apply `mix-blend-mode: screen` — screen blend drops
// pure black to transparent and keeps the luminous artwork. The two scene
// backgrounds (DASHBOARD_BACKGROUND, COMMAND_ENVIRONMENT) are fully opaque
// and need no blend.
//
// One cohesive visual language: premium, futuristic, tactical, GMRS/radio,
// dark cinematic, electric purple + electric blue + subtle neon green.
//
// This is a REFERENCE MANIFEST only. No dashboard component or index.css is
// modified by this file alone.

export const MISST_ASSETS = {
  // Profile hero — layered identity emblem (use mix-blend-mode: screen)
  MISST_AVATAR_FRAME: {
    url: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/6b4de1bf9_generated_image.png',
    blend: 'screen',
    purpose: 'Circular tactical ring surrounding the user avatar (black center composites via screen)',
  },
  MISST_AVATAR_ENERGY: {
    url: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/d3b48ea94_generated_image.png',
    blend: 'screen',
    purpose: 'Circular energy halo behind the avatar frame',
  },
  MISST_LEVEL_SHIELD: {
    url: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/9028a40b1_generated_image.png',
    blend: 'screen',
    purpose: 'Tactical shield emblem; app renders the level number in the black center',
  },
  MISST_IDENTITY_ENERGY: {
    url: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/21e6f1b21_generated_image.png',
    blend: 'screen',
    purpose: 'Subtle ambient energy behind the avatar/badge area',
  },

  // Quick-action feature tiles (use mix-blend-mode: screen)
  MISST_TILE_CHAT: {
    url: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/5999c6dcc_generated_image.png',
    blend: 'screen',
    purpose: 'Chat feature tile artwork (comms/radio/headset concept)',
  },
  MISST_TILE_TOOLS: {
    url: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/87c92891e_generated_image.png',
    blend: 'screen',
    purpose: 'Tools feature tile artwork (radio tools/utility concept)',
  },
  MISST_TILE_ACTIVITY: {
    url: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/3e4ed4af9_generated_image.png',
    blend: 'screen',
    purpose: 'Activity feature tile artwork (radar/signal/waveform concept)',
  },
  MISST_TILE_RANKINGS: {
    url: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/4f3010efd_generated_image.png',
    blend: 'screen',
    purpose: 'Rankings feature tile artwork (shield/trophy/achievement concept)',
  },

  // Command center
  MISST_COMMAND_OPERATOR: {
    url: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/f6c8dfd14_generated_image.png',
    blend: 'screen',
    purpose: 'Tactical operator/comms workstation art (screen blend over the environment scene)',
  },
  MISST_COMMAND_ENVIRONMENT: {
    url: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/075ecbc90_generated_image.png',
    blend: null,
    purpose: 'Wide cinematic radio-tower/command environment scene (opaque background, no blend)',
  },

  // Dashboard background (opaque, no blend)
  MISST_DASHBOARD_BACKGROUND: {
    url: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/fb4d9d925_generated_image.png',
    blend: null,
    purpose: 'Full-bleed dark atmospheric dashboard background (opaque, no blend)',
  },
};

export default MISST_ASSETS;