/**
 * Audit Service — Centralized platform + community audit logging.
 *
 * Every privileged mutation in the backend writes an audit record here. Audit
 * logging is NEVER client-controlled: the backend derives the actor from the
 * authenticated request (req.user), never from a request body field. Best-
 * effort by default — a failed audit write logs an error but never blocks the
 * operation.
 *
 * Tables: platform_audit_log, community_audit_log (both in 002_entities.sql).
 */
import { getPool } from '../db';
import { logger } from '../logging';
import type { AuthUser } from '../entities/authorization';

// ─── Platform audit ─────────────────────────────────────────────────────────
export interface PlatformAuditEntry {
  actor: AuthUser;
  action: string;
  target_type?: string;
  target_id?: string;
  target_name?: string;
  community_id?: string;
  community_name?: string;
  previous_value?: unknown;
  new_value?: unknown;
  ip_address?: string;
  notes?: string;
}

async function logPlatformAudit(entry: PlatformAuditEntry): Promise<void> {
  try {
    const pool = getPool();
    const prev = entry.previous_value != null ? JSON.stringify(entry.previous_value) : '';
    const next = entry.new_value != null ? JSON.stringify(entry.new_value) : '';
    await pool.query(
      `INSERT INTO platform_audit_log
        (admin_id, admin_email, action, target_type, target_id, target_name,
         community_id, community_name, previous_value, new_value, ip_address, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        entry.actor.id,
        entry.actor.email || '',
        entry.action,
        entry.target_type || '',
        entry.target_id || '',
        entry.target_name || '',
        entry.community_id || '',
        entry.community_name || '',
        prev,
        next,
        entry.ip_address || '',
        entry.notes || '',
      ],
    );
  } catch (e) {
    logger.error({ err: e }, '[audit.service] platform audit write failed');
  }
}

// ─── Community audit ────────────────────────────────────────────────────────
export interface CommunityAuditEntry {
  actor: AuthUser;
  actor_name?: string;
  community_id: string;
  community_name?: string;
  action: string;
  action_category?: string;
  target_user_id?: string;
  target_user_name?: string;
  target_message_id?: string;
  room_id?: string;
  room_name?: string;
  reason?: string;
  duration?: string;
  previous_state?: string;
  new_state?: string;
  ip_address?: string;
  device_info?: string;
}

async function logCommunityAudit(entry: CommunityAuditEntry): Promise<void> {
  try {
    const pool = getPool();
    await pool.query(
      `INSERT INTO community_audit_log
        (community_id, community_name, admin_id, admin_name, action, action_category,
         target_user_id, target_user_name, target_message_id, room_id, room_name,
         reason, duration, previous_state, new_state, ip_address, device_info)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        entry.community_id,
        entry.community_name || '',
        entry.actor.id,
        entry.actor_name || entry.actor.email || '',
        entry.action,
        entry.action_category || 'moderation',
        entry.target_user_id || '',
        entry.target_user_name || '',
        entry.target_message_id || '',
        entry.room_id || '',
        entry.room_name || '',
        entry.reason || '',
        entry.duration || '',
        entry.previous_state || '',
        entry.new_state || '',
        entry.ip_address || '',
        entry.device_info || '',
      ],
    );
  } catch (e) {
    logger.error({ err: e }, '[audit.service] community audit write failed');
  }
}

// ─── Actor + IP helpers ─────────────────────────────────────────────────────
/**
 * Extract the caller IP from an Express request. Falls back through the
 * common proxy headers. Never trusts a client-supplied actor field.
 */
export function callerIp(req: { headers: Record<string, string | string[] | undefined> }): string {
  try {
    const xff = req.headers['x-forwarded-for'];
    const raw = Array.isArray(xff) ? xff[0] : xff;
    if (raw) return raw.split(',')[0].trim();
    const real = req.headers['x-real-ip'];
    if (Array.isArray(real) ? real[0] : real) return (Array.isArray(real) ? real[0] : real) || '';
    const cf = req.headers['cf-connecting-ip'];
    if (Array.isArray(cf) ? cf[0] : cf) return (Array.isArray(cf) ? cf[0] : cf) || '';
  } catch {
    /* ignore */
  }
  return '';
}

export function deviceInfo(req: { headers: Record<string, string | string[] | undefined> }): string {
  const ua = req.headers['user-agent'];
  const raw = Array.isArray(ua) ? ua[0] : ua;
  return (raw || '').slice(0, 200);
}

export const auditService = {
  logPlatformAudit,
  logCommunityAudit,
  callerIp,
  deviceInfo,
};

export default auditService;