/**
 * Rate Limit Configuration — Global + per-route presets.
 */
export const rateLimitConfig = {
  global: 300,
  presets: {
    register: { windowMs: 60_000, max: 5 },
    login: { windowMs: 60_000, max: 10 },
    verifyOtp: { windowMs: 60_000, max: 10 },
    resendOtp: { windowMs: 60_000, max: 3 },
    refresh: { windowMs: 60_000, max: 30 },
    resetRequest: { windowMs: 60_000, max: 3 },
    reset: { windowMs: 60_000, max: 5 },
  },
};

export type RateLimitPreset = keyof typeof rateLimitConfig.presets;