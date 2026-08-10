/**
 * OAuth Configuration — Provider credentials (optional, not yet wired).
 */
import { env } from './env';

export const oauthConfig = {
  google: {
    clientId: env.GOOGLE_CLIENT_ID ?? null,
    clientSecret: env.GOOGLE_CLIENT_SECRET ?? null,
  },
  apple: {
    clientId: env.APPLE_CLIENT_ID ?? null,
    teamId: env.APPLE_TEAM_ID ?? null,
  },
};