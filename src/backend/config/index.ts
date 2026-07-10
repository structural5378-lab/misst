/**
 * Configuration — Exports merged, validated config object.
 */

import { env } from './env';
import { databaseConfig } from './database';
import { corsConfig } from './cors';
import { rateLimitConfig } from './rate-limits';
import { jwtConfig } from './jwt';
import { oauthConfig } from './oauth';
import { pushalertConfig } from './pushalert';
import { weatherConfig } from './weather';
import { mybbConfig } from './mybb';

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  database: databaseConfig,
  cors: corsConfig,
  rateLimits: rateLimitConfig,
  jwt: jwtConfig,
  oauth: oauthConfig,
  pushalert: pushalertConfig,
  weather: weatherConfig,
  mybb: mybbConfig,
} as const;