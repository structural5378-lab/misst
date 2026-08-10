/**
 * Profile Repository — Data access for the profiles table.
 */
import { Pool } from 'pg';
import { BaseRepository } from './base.repository';

export interface Profile {
  id: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export class ProfileRepository extends BaseRepository<Profile> {
  constructor(pool: Pool) {
    super(pool, 'profiles');
  }
}