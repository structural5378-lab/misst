/**
 * Password Service — Hashes and compares passwords using argon2.
 */

import argon2 from 'argon2';

export const passwordService = {
  async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  },

  async compare(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  },
};