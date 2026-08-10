/**
 * OTP Service — Generates and verifies short-lived OTP codes and reset tokens.
 *
 * Codes/tokens are stored HMAC-hashed (SHA-256 with the JWT secret) so the
 * DB never holds the raw secret. Codes are single-use and expire after
 * OTP_TTL_MIN minutes; reset tokens after RESET_TTL_MIN minutes.
 */
import { randomInt, createHmac } from 'crypto';
import { getPool } from '../db';
import { config } from '../config';

const OTP_TTL_MIN = 10;
const RESET_TTL_MIN = 30;

function hmac(value: string): string {
  return createHmac('sha256', config.jwt.secret).update(value).digest('hex');
}

export const otpService = {
  async generate(userId: string): Promise<string> {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60_000);
    await getPool().query(
      `INSERT INTO otp_codes (id, user_id, code_hash, purpose, expires_at, consumed)
       VALUES (gen_random_uuid(), $1, $2, 'verify', $3, false)`,
      [userId, hmac(code), expiresAt],
    );
    return code;
  },

  async verify(userId: string, code: string): Promise<boolean> {
    const pool = getPool();
    const r = await pool.query(
      `SELECT id FROM otp_codes
       WHERE user_id = $1 AND code_hash = $2 AND purpose = 'verify'
         AND consumed = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [userId, hmac(code)],
    );
    if (r.rowCount === 0) return false;
    await pool.query(`UPDATE otp_codes SET consumed = true WHERE id = $1`, [r.rows[0].id]);
    return true;
  },

  async generateResetToken(userId: string): Promise<string> {
    const token = randomInt(0, Number.MAX_SAFE_INTEGER).toString(36) + randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + RESET_TTL_MIN * 60_000);
    await getPool().query(
      `INSERT INTO otp_codes (id, user_id, code_hash, purpose, expires_at, consumed)
       VALUES (gen_random_uuid(), $1, $2, 'reset', $3, false)`,
      [userId, hmac(token), expiresAt],
    );
    return token;
  },

  async verifyResetToken(token: string): Promise<string | null> {
    const pool = getPool();
    const r = await pool.query(
      `SELECT id, user_id FROM otp_codes
       WHERE code_hash = $1 AND purpose = 'reset'
         AND consumed = false AND expires_at > NOW()
       LIMIT 1`,
      [hmac(token)],
    );
    if (r.rowCount === 0) return null;
    await pool.query(`UPDATE otp_codes SET consumed = true WHERE id = $1`, [r.rows[0].id]);
    return r.rows[0].user_id;
  },
};