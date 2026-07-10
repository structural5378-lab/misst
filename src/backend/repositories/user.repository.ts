/**
 * User Repository — Data access for the users table.
 * Extends BaseRepository with user-specific queries.
 */

import { Pool } from 'pg';
import { BaseRepository } from './base.repository';

export interface User {
  id: string;
  email: string;
  full_name: string;
  callsign: string | null;
  role: string;
  status: string;
  avatar_url: string | null;
  community_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export class UserRepository extends BaseRepository<User> {
  constructor(pool: Pool) {
    super(pool, 'users');
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email],
    );
    return result.rows[0] || null;
  }

  async findByCallsign(callsign: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE callsign = $1',
      [callsign],
    );
    return result.rows[0] || null;
  }

  async search(query: string, limit = 50, offset = 0): Promise<User[]> {
    const result = await this.pool.query(
      `SELECT * FROM users
       WHERE full_name ILIKE $1 OR callsign ILIKE $1
       ORDER BY full_name ASC LIMIT $2 OFFSET $3`,
      [`%${query}%`, limit, offset],
    );
    return result.rows;
  }

  async findOnline(activeAfter: Date): Promise<User[]> {
    const result = await this.pool.query(
      `SELECT * FROM users WHERE last_active_at > $1 AND status = 'active' ORDER BY last_active_at DESC`,
      [activeAfter],
    );
    return result.rows;
  }

  async updateLastActive(userId: string): Promise<void> {
    await this.pool.query(
      'UPDATE users SET last_active_at = NOW() WHERE id = $1',
      [userId],
    );
  }
}