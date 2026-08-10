/**
 * RBAC Service — Centralized permission resolution for MISST Core.
 *
 * Ports the permission semantics from base44/shared/rbac.ts to the Core
 * PostgreSQL tables (role, user_role, rbac_audit_log). This is the single
 * source of truth for platform-level permissions inside the Core backend.
 *
 * Community-scoped permissions are a separate axis (community-access.service)
 * and are intentionally NOT resolved here.
 *
 * The browser never calls this directly — it is consumed by Core services and
 * the rbac middleware. Permission values supplied by the client are never
 * trusted; the backend resolves everything from the database.
 */
import { getPool } from '../db';
import { logger } from '../logging';
import type { AuthUser } from '../entities/authorization';

// ─── Permission catalog (mirrors base44/shared/rbac.ts) ─────────────────────
// Kept in code so the catalog is stable and queryable, but resolution always
// reads the granted permission keys from the role rows in the database.
export const PERMISSIONS = [
  { key: 'community.manage', label: 'Manage Community', category: 'Community' },
  { key: 'community.settings.manage', label: 'Manage Community Settings', category: 'Community' },
  { key: 'community.invite', label: 'Invite Members', category: 'Community' },
  { key: 'members.manage', label: 'Manage Members', category: 'Members' },
  { key: 'members.remove', label: 'Remove Members', category: 'Members' },
  { key: 'members.warn', label: 'Warn Members', category: 'Members' },
  { key: 'members.mute', label: 'Mute Members', category: 'Members' },
  { key: 'members.suspend', label: 'Suspend Members', category: 'Members' },
  { key: 'members.ban', label: 'Ban Members', category: 'Members' },
  { key: 'repeaters.view', label: 'View Repeaters', category: 'Repeaters' },
  { key: 'repeaters.manage', label: 'Manage Repeaters', category: 'Repeaters' },
  { key: 'nets.view', label: 'View Nets & Mission Control', category: 'Nets' },
  { key: 'nets.create', label: 'Create Scheduled Nets', category: 'Nets' },
  { key: 'nets.edit', label: 'Edit Scheduled Nets', category: 'Nets' },
  { key: 'nets.delete', label: 'Delete Scheduled Nets', category: 'Nets' },
  { key: 'nets.start', label: 'Start Live Net', category: 'Nets' },
  { key: 'nets.pause', label: 'Pause Net', category: 'Nets' },
  { key: 'nets.resume', label: 'Resume Net', category: 'Nets' },
  { key: 'nets.end', label: 'End Net', category: 'Nets' },
  { key: 'nets.broadcast', label: 'Broadcast Net Announcements', category: 'Nets' },
  { key: 'nets.logs.view', label: 'View Net Logs', category: 'Nets' },
  { key: 'nets.logs.export', label: 'Export Net Logs', category: 'Nets' },
  { key: 'chat.moderate', label: 'Moderate Chat', category: 'Chat' },
  { key: 'chat.remove_messages', label: 'Remove Messages', category: 'Chat' },
  { key: 'events.manage', label: 'Manage Events', category: 'Events' },
  { key: 'gallery.manage', label: 'Manage Gallery', category: 'Gallery' },
  { key: 'shopping.manage', label: 'Manage Marketplace', category: 'Marketplace' },
  { key: 'marketplace.list', label: 'List Marketplace Items', category: 'Marketplace' },
  { key: 'marketplace.manage', label: 'Manage Marketplace (legacy)', category: 'Marketplace' },
  { key: 'notifications.send', label: 'Send Notifications', category: 'Notifications' },
  { key: 'notifications.broadcast', label: 'Broadcast Platform Alerts', category: 'Notifications' },
  { key: 'audit.view', label: 'View Audit Logs', category: 'Audit' },
  { key: 'reports.review', label: 'Review Reports', category: 'Audit' },
  { key: 'forum.view', label: 'View Forum', category: 'Forum' },
  { key: 'forum.create_thread', label: 'Create Threads', category: 'Forum' },
  { key: 'forum.reply', label: 'Reply', category: 'Forum' },
  { key: 'forum.edit_own_post', label: 'Edit Own Posts', category: 'Forum' },
  { key: 'forum.delete_own_post', label: 'Delete Own Posts', category: 'Forum' },
  { key: 'forum.delete_any_post', label: 'Delete Any Posts', category: 'Forum' },
  { key: 'forum.pin_thread', label: 'Pin Threads', category: 'Forum' },
  { key: 'forum.lock_thread', label: 'Lock Threads', category: 'Forum' },
  { key: 'forum.move_thread', label: 'Move Threads', category: 'Forum' },
  { key: 'forum.merge_thread', label: 'Merge Threads', category: 'Forum' },
  { key: 'forum.approve_post', label: 'Approve Posts', category: 'Forum' },
  { key: 'forum.moderate_reports', label: 'Moderate Reports', category: 'Forum' },
  { key: 'users.manage', label: 'Manage Users', category: 'Administration' },
  { key: 'roles.manage', label: 'Manage Roles', category: 'Administration' },
  { key: 'clubs.manage', label: 'Manage Clubs', category: 'Administration' },
  { key: 'news.manage', label: 'Manage News', category: 'Administration' },
  { key: 'themes.manage', label: 'Manage Themes', category: 'Administration' },
  { key: 'badges.manage', label: 'Manage Badges', category: 'Administration' },
  { key: 'achievements.manage', label: 'Manage Achievements', category: 'Administration' },
  { key: 'admin.access', label: 'Access Admin Panel', category: 'Administration' },
  { key: 'analytics.view', label: 'View Analytics', category: 'Administration' },
  { key: 'developer.tools', label: 'Developer Tools', category: 'System' },
  { key: 'system.settings', label: 'System Settings', category: 'System' },
  { key: 'database.maintenance', label: 'Database Maintenance', category: 'System' },
  { key: 'api.manage', label: 'API Management', category: 'System' },
  { key: 'voice_chat.use', label: 'Use Voice Chat', category: 'Future' },
  { key: 'live_radio.manage', label: 'Manage Live Radio', category: 'Future' },
  { key: 'plugins.manage', label: 'Manage Plugins', category: 'Future' },
  { key: 'third_party.manage', label: 'Third-Party Integrations', category: 'Future' },
] as const;

export const ALL_PERMISSION_KEYS: string[] = PERMISSIONS.map((p) => p.key);

// Permissions granted to a built-in admin (user.role === 'admin') that has no
// UserRole rows yet, so the platform owner can never be locked out.
const OWNER_PERMISSIONS = ALL_PERMISSION_KEYS;

// ─── JSON helpers ────────────────────────────────────────────────────────────
function safeParseJson(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as string[];
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── Role / assignment shapes (from the role + user_role tables) ─────────────
interface RoleRow {
  id: string;
  slug: string;
  name: string;
  parent_role_id: string | null;
  permissions: string | string[] | null;
  denied_permissions: string | string[] | null;
  is_system: boolean;
  priority: number;
}

interface UserRoleRow {
  id: string;
  user_id: string;
  role_id: string | null;
  role_slug: string;
  role_name: string;
  is_active: boolean;
  scope: string;
}

export interface ResolvedPermissions {
  perms: string[];
  slugs: string[];
  legacy: string[];
  assignments: UserRoleRow[];
}

// ─── Permission inheritance ─────────────────────────────────────────────────
// Compute a single role's effective permissions, walking the parent_role_id
// tree. Child inherits parent permissions unless explicitly denied.
export function resolveEffectivePermissions(
  role: RoleRow,
  rolesById: Map<string, RoleRow>,
  visited = new Set<string>(),
): string[] {
  if (!role || visited.has(role.id)) return [];
  visited.add(role.id);

  let result = new Set<string>();
  const own = safeParseJson(role.permissions);
  if (own.includes('*')) {
    result = new Set(ALL_PERMISSION_KEYS);
  } else {
    for (const p of own) result.add(p);
  }

  if (role.parent_role_id) {
    const parent = rolesById.get(role.parent_role_id);
    if (parent) {
      const inherited = resolveEffectivePermissions(parent, rolesById, visited);
      for (const p of inherited) result.add(p);
    }
  }

  const denied = safeParseJson(role.denied_permissions);
  if (denied.includes('*')) return [];
  for (const p of denied) result.delete(p);

  return Array.from(result);
}

// Union of effective permissions across a user's active platform roles.
export function resolveUserPermissions(
  userRoles: UserRoleRow[],
  rolesById: Map<string, RoleRow>,
): string[] {
  const perms = new Set<string>();
  for (const ur of userRoles) {
    if (ur.is_active === false) continue;
    if (ur.scope && ur.scope !== 'platform') continue;
    if (!ur.role_id) continue;
    const role = rolesById.get(ur.role_id);
    if (!role) continue;
    const effective = resolveEffectivePermissions(role, rolesById);
    for (const p of effective) perms.add(p);
  }
  return Array.from(perms);
}

// Map RBAC role slugs → legacy platform role flags so existing admin gating
// (PlatformAdminRoute, useAdminAccess) keeps working unchanged.
export function mapToLegacyPlatformRoles(slugs: string[], perms: string[]): string[] {
  const out: string[] = [];
  if (slugs.includes('owner')) out.push('platform_owner');
  if (
    ['administrator', 'developer', 'senior_moderator', 'moderator'].some((s) => slugs.includes(s)) ||
    (perms && perms.includes('admin.access'))
  ) {
    out.push('platform_admin');
  }
  return out;
}

// ─── In-memory TTL cache (per-process, invalidated on mutations) ────────────
const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { data: ResolvedPermissions; ts: number }>();

export function invalidateRbacCache(): void {
  cache.clear();
}

// ─── Core resolver ───────────────────────────────────────────────────────────
/**
 * Resolve the caller's effective platform permissions from the database.
 * Returns { perms, slugs, legacy, assignments }. A built-in admin
 * (user.role === 'admin') with no UserRole rows is treated as Owner so the
 * platform owner can never be locked out during migration.
 */
export async function resolveCallerPerms(user: AuthUser): Promise<ResolvedPermissions> {
  const cached = cache.get(user.id);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  const pool = getPool();
  const [userRolesRes, rolesRes] = await Promise.all([
    pool.query<UserRoleRow>(
      `SELECT id, user_id, role_id, role_slug, role_name, is_active, scope
       FROM user_role
       WHERE user_id = $1`,
      [user.id],
    ),
    pool.query<RoleRow>(
      `SELECT id, slug, name, parent_role_id, permissions, denied_permissions, is_system, priority
       FROM role
       ORDER BY priority ASC`,
    ),
  ]);

  const rolesById = new Map<string, RoleRow>();
  for (const r of rolesRes.rows) rolesById.set(r.id, r);

  const active = userRolesRes.rows.filter((ur) => ur.is_active !== false && (!ur.scope || ur.scope === 'platform'));
  let slugs = active.map((ur) => ur.role_slug).filter(Boolean);
  let perms = resolveUserPermissions(active, rolesById);
  let legacy = mapToLegacyPlatformRoles(slugs, perms);

  // Owner fallback: a built-in admin with no platform UserRole rows yet.
  if (active.length === 0 && user.role === 'admin') {
    slugs = ['owner'];
    perms = OWNER_PERMISSIONS;
    legacy = ['platform_owner'];
  }

  const result: ResolvedPermissions = { perms, slugs, legacy, assignments: active };
  cache.set(user.id, { data: result, ts: Date.now() });
  return result;
}

// ─── Enforcement ─────────────────────────────────────────────────────────────
/**
 * Enforce a permission for a protected operation. Returns { ok, perms, slugs }.
 * On denial, writes a permission_denied audit record. The caller returns 403.
 */
export async function requirePermission(
  user: AuthUser,
  permission: string,
  endpoint = '',
): Promise<{ ok: boolean; perms: string[]; slugs: string[] }> {
  const { perms, slugs } = await resolveCallerPerms(user);
  const ok = perms.includes('*') || perms.includes(permission);
  if (!ok) {
    await logRbacAudit({
      admin_id: user.id,
      admin_email: user.email || '',
      action: 'permission_denied',
      endpoint,
      permission_required: permission,
      permission_granted: perms.join(',') || '(none)',
      reason: `Missing "${permission}"`,
    }).catch(() => {
      /* audit is best-effort; never block on audit failure */
    });
  }
  return { ok, perms, slugs };
}

// ─── RBAC audit log ─────────────────────────────────────────────────────────
export interface RbacAuditEntry {
  admin_id?: string;
  admin_email?: string;
  action: string;
  target_user_id?: string;
  target_user_email?: string;
  role_id?: string;
  role_name?: string;
  endpoint?: string;
  permission_required?: string;
  permission_granted?: string;
  old_value?: string;
  new_value?: string;
  changed_permissions?: string;
  reason?: string;
  ip_address?: string;
}

export async function logRbacAudit(entry: RbacAuditEntry): Promise<void> {
  try {
    const pool = getPool();
    await pool.query(
      `INSERT INTO rbac_audit_log
        (admin_id, admin_email, action, target_user_id, target_user_email,
         role_id, role_name, endpoint, permission_required, permission_granted,
         old_value, new_value, changed_permissions, reason, ip_address)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        entry.admin_id || '',
        entry.admin_email || '',
        entry.action,
        entry.target_user_id || '',
        entry.target_user_email || '',
        entry.role_id || '',
        entry.role_name || '',
        entry.endpoint || '',
        entry.permission_required || '',
        entry.permission_granted || '',
        entry.old_value || '',
        entry.new_value || '',
        entry.changed_permissions || '',
        entry.reason || '',
        entry.ip_address || '',
      ],
    );
  } catch (e) {
    logger.error({ err: e }, '[rbac.service] audit log write failed');
  }
}

export const rbacService = {
  resolveCallerPerms,
  resolveUserPermissions,
  resolveEffectivePermissions,
  requirePermission,
  mapToLegacyPlatformRoles,
  logRbacAudit,
  invalidateRbacCache,
  ALL_PERMISSION_KEYS,
  PERMISSIONS,
};

export default rbacService;