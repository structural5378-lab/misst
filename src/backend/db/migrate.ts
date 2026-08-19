/**
 * Migration Runner — Applies pending SQL migrations in order.
 *
 * Tracks applied migrations in the `_migrations` table. Idempotent: safe to
 * re-run; only new migration files are applied.
 *
 * Usage:
 *   npx tsx src/backend/db/migrate.ts
 */
import fs from 'fs';
import path from 'path';
import { initializeDatabase, getPool } from './index';
import { logger } from '../logging';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function main() {
  await initializeDatabase();
  const pool = getPool();

  await pool.query(
    `CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  );

  const applied = new Set((await pool.query('SELECT id FROM _migrations')).rows.map((r: any) => r.id));
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();

  let count = 0;
  for (const f of files) {
    if (applied.has(f)) {
      logger.info(`Migration already applied, skipping: ${f}`);
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf8');
    await pool.query(sql);
    await pool.query('INSERT INTO _migrations (id) VALUES ($1)', [f]);
    logger.info(`Applied migration: ${f}`);
    count++;
  }

  logger.info(`Migrations complete (${count} applied, ${applied.size} already present)`);
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  logger.error('Migration failed', err);
  process.exit(1);
});