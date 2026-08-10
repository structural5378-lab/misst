/**
 * CORS Configuration — Parses CORS_ORIGINS into an array (or '*' wildcard).
 */
import { env } from './env';

export const corsConfig = {
  allowedOrigins:
    env.CORS_ORIGINS === '*'
      ? '*'
      : env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
};