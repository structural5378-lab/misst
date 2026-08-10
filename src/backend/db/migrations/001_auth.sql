-- MISST Core — Migration 001: Auth/User foundation
-- Tables required for authentication/users (Phase 1).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users — compatible with the existing MISST User entity (id, email, full_name, role)
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  full_name       TEXT NOT NULL DEFAULT '',
  callsign        TEXT UNIQUE,
  role            TEXT NOT NULL DEFAULT 'member',
  status          TEXT NOT NULL DEFAULT 'unverified',
  email_verified  BOOLEAN NOT NULL DEFAULT false,
  avatar_url      TEXT,
  community_id    UUID,
  last_active_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles — created at registration, extended in later phases
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sessions — refresh tokens (hashed) for session/refresh handling
CREATE TABLE IF NOT EXISTS sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash  TEXT UNIQUE NOT NULL,
  is_revoked          BOOLEAN NOT NULL DEFAULT false,
  expires_at          TIMESTAMPTZ NOT NULL,
  last_used_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OTP codes — verification + password-reset tokens (hashed)
CREATE TABLE IF NOT EXISTS otp_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash   TEXT NOT NULL,
  purpose     TEXT NOT NULL DEFAULT 'verify',
  consumed    BOOLEAN NOT NULL DEFAULT false,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_user       ON otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Migration tracking table (used by the migrate.ts runner)
CREATE TABLE IF NOT EXISTS _migrations (
  id          TEXT PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);