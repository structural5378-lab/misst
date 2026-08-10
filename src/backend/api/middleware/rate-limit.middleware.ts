/**
 * Rate Limit Middleware — Returns an express-rate-limit instance per preset.
 */
import rateLimit from 'express-rate-limit';
import { config } from '../../config';

const cache = new Map<string, ReturnType<typeof rateLimit>>();

export function rateLimitMiddleware(preset: string) {
  let limiter = cache.get(preset);
  if (!limiter) {
    const cfg =
      config.rateLimits.presets[preset as keyof typeof config.rateLimits.presets] ||
      { windowMs: 60_000, max: 60 };
    limiter = rateLimit({
      windowMs: cfg.windowMs,
      max: cfg.max,
      standardHeaders: true,
      legacyHeaders: false,
    });
    cache.set(preset, limiter);
  }
  return limiter;
}