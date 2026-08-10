/**
 * Database Configuration — Connection pool settings derived from env.
 */
import { env } from './env';

export const databaseConfig = {
  url: env.DATABASE_URL,
  poolMin: env.DB_POOL_MIN,
  poolMax: env.DB_POOL_MAX,
};