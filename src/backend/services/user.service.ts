/**
 * User Service — Current-user read/update operations.
 * Never returns password_hash.
 */
import { UserRepository, sanitizeUser } from '../repositories/user.repository';
import { getPool } from '../db';
import { AppError } from '../utils/errors';

let _repo: UserRepository | null = null;
function repo(): UserRepository {
  if (!_repo) _repo = new UserRepository(getPool());
  return _repo;
}

const ALLOWED_UPDATES = new Set(['full_name', 'callsign', 'avatar_url', 'community_id']);

export const userService = {
  async getMe(userId: string) {
    const user = await repo().findById(userId);
    if (!user) throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    return sanitizeUser(user);
  },

  async updateMe(userId: string, data: Record<string, unknown>) {
    const user = await repo().findById(userId);
    if (!user) throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    const updates: Record<string, unknown> = {};
    for (const key of Object.keys(data)) {
      if (ALLOWED_UPDATES.has(key)) updates[key] = data[key];
    }
    if (Object.keys(updates).length === 0) return sanitizeUser(user);
    const updated = await repo().update(userId, updates);
    return sanitizeUser(updated);
  },
};