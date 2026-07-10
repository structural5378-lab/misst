/**
 * Database — Connection pool initialization.
 */

import { Pool } from 'pg';
import { config } from '../config';
import { logger } from '../logging';

let pool: Pool;

export function initializeDatabase(): Promise<void> {
  pool = new Pool({
    connectionString: config.database.url,
    min: config.database.poolMin,
    max: config.database.poolMax,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    logger.error('Unexpected database pool error', err);
  });

  // Test connection
  return pool.query('SELECT 1').then(() => {
    logger.info('Database pool initialized');
  });
}

export function getPool(): Pool {
  if (!pool) throw new Error('Database not initialized — call initializeDatabase() first');
  return pool;
}

/**
 * Transaction helper — runs a callback within a DB transaction.
 * Automatically commits on success, rolls back on error.
 */
export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

import { PoolClient } from 'pg';