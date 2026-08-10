/**
 * Session Repository — Refresh-token session storage.
 *
 * Tokens are stored hashed (SHA-256) so a DB leak does not expose valid
 * refresh tokens. Each issued token maps to one row; revocation is a flag.
 */
import { Pool } from 'pg';
import { createHash, randomBytes } from 'crypto';
import { config } from '../config';

export interface Session {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  is_revoked: boolean;
  expires_at: Date;
  last_used_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function parseDurationToMs(s: string): number {
  const m = /^(\d+)([smhd])$/.exec(s);
  if (!m) return 30 * 24 * 3600 * 1000;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  const mult: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * mult[unit];
}

export class SessionRepository {
  constructor(private pool: Pool) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async create(userId: string): Promise<string> {
    const token = randomBytes(48).toString('base64url');
    const hash = this.hash(token);
    const expiresAt = new Date(Date.now() + parseDurationToMs(config.jwt.refreshExpiresIn));
    await this.pool.query(
      `INSERT INTO sessions (id, user_id, refresh_token_hash, is_revoked, expires_at)
       VALUES (gen_random_uuid(), $1, $2, false, $3)`,
      [userId, hash, expiresAt],
    );
    return token;
  }

  async findByToken(token: string): Promise<Session | null> {
    const r = await this.pool.query(
      `SELECT * FROM sessions WHERE refresh_token_hash = $1`,
      [this.hash(token)],
    );
    return r.rows[0] || null;
  }

  async updateLastUsed(id: string): Promise<void> {
    await this.pool.query(`UPDATE sessions SET last_used_at = NOW() WHERE id = $1`, [id]);
  }

  async revoke(token: string): Promise<void> {
    await this.pool.query(
      `UPDATE sessions SET is_revoked = true WHERE refresh_token_hash = $1`,
      [this.hash(token)],
    );
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.pool.query(`UPDATE sessions SET is_revoked = true WHERE user_id = $1`, [userId]);
  }
}