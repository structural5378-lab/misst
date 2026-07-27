// Centralized RBAC engine — the single source of truth for MIST permissions.
// Consumed by resolveRbac, rbacManage, getPlatformRoles (compat shim), and the
// PHP bridge (via SSO token roles). Future modules read permissions from here.

export const PERMISSIONS = [
  // Community
  { key: "community.manage", label: "Manage Community", category: "Community" },
  { key: "community.settings.manage", label: "Manage Community Settings", category: "Community" },
  { key: "community.invite", label: "Invite Members", category: "Community" },
  // Members
  { key: "members.manage", label: "Manage Members", category: "Members" },
  { key: "members.remove", label: "Remove Members", category: "Members" },
  { key: "members.warn", label: "Warn Members", category: "Members" },
  { key: "members.mute", label: "Mute Members", category: "Members" },
  { key: "members.suspend", label: "Suspend Members", category: "Members" },
  { key: "members.ban", label: "Ban Members", category: "Members" },
  // Repeaters
  { key: "repeaters.view", label: "View Repeaters", category: "Repeaters" },
  { key: "repeaters.manage", label: "Manage Repeaters", category: "Repeaters" },
  // Nets
  { key: "nets.view", label: "View Nets & Mission Control", category: "Nets" },
  { key: "nets.create", label: "Create Scheduled Nets", category: "Nets" },
  { key: "nets.edit", label: "Edit Scheduled Nets", category: "Nets" },
  { key: "nets.delete", label: "Delete Scheduled Nets", category: "Nets" },
  { key: "nets.start", label: "Start Live Net", category: "Nets" },
  { key: "nets.pause", label: "Pause Net", category: "Nets" },
  { key: "nets.resume", label: "Resume Net", category: "Nets" },
  { key: "nets.end", label: "End Net", category: "Nets" },
  { key: "nets.broadcast", label: "Broadcast Net Announcements", category: "Nets" },
  { key: "nets.logs.view", label: "View Net Logs", category: "Nets" },
  { key: "nets.logs.export", label: "Export Net Logs", category: "Nets" },
  // Chat
  { key: "chat.moderate", label: "Moderate Chat", category: "Chat" },
  { key: "chat.remove_messages", label: "Remove Messages", category: "Chat" },
  // Events
  { key: "events.manage", label: "Manage Events", category: "Events" },
  // Gallery
  { key: "gallery.manage", label: "Manage Gallery", category: "Gallery" },
  // Marketplace
  { key: "shopping.manage", label: "Manage Marketplace", category: "Marketplace" },
  { key: "marketplace.list", label: "List Marketplace Items", category: "Marketplace" },
  { key: "marketplace.manage", label: "Manage Marketplace (legacy)", category: "Marketplace" },
  // Notifications
  { key: "notifications.send", label: "Send Notifications", category: "Notifications" },
  { key: "notifications.broadcast", label: "Broadcast Platform Alerts", category: "Notifications" },
  // Audit & Reports
  { key: "audit.view", label: "View Audit Logs", category: "Audit" },
  { key: "reports.review", label: "Review Reports", category: "Audit" },
  // Forum
  { key: "forum.view", label: "View Forum", category: "Forum" },
  { key: "forum.create_thread", label: "Create Threads", category: "Forum" },
  { key: "forum.reply", label: "Reply", category: "Forum" },
  { key: "forum.edit_own_post", label: "Edit Own Posts", category: "Forum" },
  { key: "forum.delete_own_post", label: "Delete Own Posts", category: "Forum" },
  { key: "forum.delete_any_post", label: "Delete Any Posts", category: "Forum" },
  { key: "forum.pin_thread", label: "Pin Threads", category: "Forum" },
  { key: "forum.lock_thread", label: "Lock Threads", category: "Forum" },
  { key: "forum.move_thread", label: "Move Threads", category: "Forum" },
  { key: "forum.merge_thread", label: "Merge Threads", category: "Forum" },
  { key: "forum.approve_post", label: "Approve Posts", category: "Forum" },
  { key: "forum.moderate_reports", label: "Moderate Reports", category: "Forum" },
  // Administration
  { key: "users.manage", label: "Manage Users", category: "Administration" },
  { key: "roles.manage", label: "Manage Roles", category: "Administration" },
  { key: "clubs.manage", label: "Manage Clubs", category: "Administration" },
  { key: "news.manage", label: "Manage News", category: "Administration" },
  { key: "themes.manage", label: "Manage Themes", category: "Administration" },
  { key: "badges.manage", label: "Manage Badges", category: "Administration" },
  { key: "achievements.manage", label: "Manage Achievements", category: "Administration" },
  { key: "admin.access", label: "Access Admin Panel", category: "Administration" },
  { key: "analytics.view", label: "View Analytics", category: "Administration" },
  // System
  { key: "developer.tools", label: "Developer Tools", category: "System" },
  { key: "system.settings", label: "System Settings", category: "System" },
  { key: "database.maintenance", label: "Database Maintenance", category: "System" },
  { key: "api.manage", label: "API Management", category: "System" },
  // Future
  { key: "voice_chat.use", label: "Use Voice Chat", category: "Future" },
  { key: "live_radio.manage", label: "Manage Live Radio", category: "Future" },
  { key: "plugins.manage", label: "Manage Plugins", category: "Future" },
  { key: "third_party.manage", label: "Third-Party Integrations", category: "Future" },
];

export const ALL_PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

export const DEFAULT_ROLES = [
  { slug: "owner", name: "Owner", description: "Full platform control", icon: "Crown", color: "#f59e0b", priority: 0, parent_slug: null, is_system: true, permissions: ["*"], denied_permissions: [], badge_config: { name_color: "#f59e0b", banner_accent: "#f59e0b", forum_flair: "Owner", dashboard_indicator: true, icon: "Crown" } },
  { slug: "administrator", name: "Administrator", description: "Manage nearly everything except ownership", icon: "Shield", color: "#8b5cf6", priority: 10, parent_slug: "owner", is_system: true, permissions: ["community.manage", "community.settings.manage", "community.invite", "members.manage", "members.remove", "members.warn", "members.mute", "members.suspend", "members.ban", "repeaters.view", "repeaters.manage", "nets.view", "nets.create", "nets.edit", "nets.delete", "nets.start", "nets.pause", "nets.resume", "nets.end", "nets.broadcast", "nets.logs.view", "nets.logs.export", "chat.moderate", "chat.remove_messages", "events.manage", "gallery.manage", "shopping.manage", "marketplace.manage", "marketplace.list", "notifications.send", "notifications.broadcast", "audit.view", "reports.review", "forum.moderate_reports", "forum.delete_any_post", "users.manage", "roles.manage", "clubs.manage", "news.manage", "themes.manage", "badges.manage", "achievements.manage", "admin.access", "analytics.view"], denied_permissions: ["developer.tools", "system.settings", "database.maintenance", "api.manage"], badge_config: { name_color: "#8b5cf6", banner_accent: "#8b5cf6", forum_flair: "Admin", dashboard_indicator: true, icon: "Shield" } },
  { slug: "net_control", name: "Net Control", description: "Dedicated role for operating nets", icon: "RadioTower", color: "#22d3ee", priority: 12, parent_slug: "member", is_system: true, permissions: ["nets.view", "nets.create", "nets.edit", "nets.delete", "nets.start", "nets.pause", "nets.resume", "nets.end", "nets.broadcast", "nets.logs.view", "nets.logs.export", "repeaters.view", "forum.view", "forum.create_thread", "forum.reply"], denied_permissions: [], badge_config: { name_color: "#22d3ee", banner_accent: "#22d3ee", forum_flair: "Net Control", dashboard_indicator: true, icon: "RadioTower" } },
  { slug: "developer", name: "Developer", description: "System and API access", icon: "Terminal", color: "#22d3ee", priority: 15, parent_slug: "administrator", is_system: true, permissions: ["developer.tools", "system.settings", "database.maintenance", "api.manage"], denied_permissions: [], badge_config: { name_color: "#22d3ee", banner_accent: "#22d3ee", forum_flair: "Dev", dashboard_indicator: true, icon: "Terminal" } },
  { slug: "senior_moderator", name: "Senior Moderator", description: "Advanced moderation and user management", icon: "ShieldCheck", color: "#10b981", priority: 20, parent_slug: "administrator", is_system: true, permissions: ["forum.delete_any_post", "chat.moderate", "chat.remove_messages", "members.warn", "members.mute", "members.suspend", "members.remove", "reports.review", "users.manage"], denied_permissions: ["roles.manage"], badge_config: { name_color: "#10b981", banner_accent: "#10b981", forum_flair: "Sr Mod", dashboard_indicator: true, icon: "ShieldCheck" } },
  { slug: "moderator", name: "Moderator", description: "Moderate chat and members", icon: "ShieldAlert", color: "#3b82f6", priority: 30, parent_slug: "senior_moderator", is_system: true, permissions: ["chat.moderate", "chat.remove_messages", "members.warn", "members.mute", "reports.review"], denied_permissions: ["users.manage", "roles.manage", "members.suspend", "members.ban"], badge_config: { name_color: "#3b82f6", banner_accent: "#3b82f6", forum_flair: "Mod", dashboard_indicator: true, icon: "ShieldAlert" } },
  { slug: "club_owner", name: "Club Owner", description: "Owns and manages a club", icon: "Users", color: "#ec4899", priority: 40, parent_slug: "member", is_system: true, permissions: ["clubs.manage", "events.manage"], denied_permissions: [], badge_config: { name_color: "#ec4899", banner_accent: "#ec4899", forum_flair: "Club Owner", dashboard_indicator: true, icon: "Users" } },
  { slug: "verified_user", name: "Verified User", description: "Verified community member", icon: "BadgeCheck", color: "#06b6d4", priority: 50, parent_slug: "member", is_system: true, permissions: [], denied_permissions: [], badge_config: { name_color: "#06b6d4", banner_accent: "#06b6d4", forum_flair: "Verified", dashboard_indicator: false, icon: "BadgeCheck" } },
  { slug: "premium_user", name: "Premium User", description: "Premium subscriber perks", icon: "Sparkles", color: "#a855f7", priority: 55, parent_slug: "member", is_system: true, permissions: ["marketplace.list"], denied_permissions: [], badge_config: { name_color: "#a855f7", banner_accent: "#a855f7", forum_flair: "Premium", dashboard_indicator: false, icon: "Sparkles" } },
  { slug: "member", name: "Member", description: "Standard community member", icon: "User", color: "#94a3b8", priority: 60, parent_slug: null, is_system: true, permissions: ["forum.view", "forum.create_thread", "forum.reply", "forum.edit_own_post", "forum.delete_own_post", "repeaters.view", "nets.view"], denied_permissions: [], badge_config: { name_color: "#94a3b8", banner_accent: "#64748b", forum_flair: "", dashboard_indicator: false, icon: "User" } },
  { slug: "guest", name: "Guest", description: "Read-only access where applicable", icon: "Eye", color: "#64748b", priority: 65, parent_slug: null, is_system: true, permissions: ["forum.view", "repeaters.view", "nets.view"], denied_permissions: ["forum.create_thread", "forum.reply"], badge_config: { name_color: "#64748b", banner_accent: "#64748b", forum_flair: "Guest", dashboard_indicator: false, icon: "Eye" } },
  { slug: "new_user", name: "New User", description: "Newly registered, limited access", icon: "UserPlus", color: "#64748b", priority: 70, parent_slug: "member", is_system: true, permissions: [], denied_permissions: ["forum.create_thread"], badge_config: { name_color: "#64748b", banner_accent: "#64748b", forum_flair: "New", dashboard_indicator: false, icon: "UserPlus" } },
  { slug: "muted", name: "Muted", description: "Cannot post or reply", icon: "VolumeX", color: "#6b7280", priority: 80, parent_slug: "member", is_system: true, permissions: [], denied_permissions: ["forum.create_thread", "forum.reply"], badge_config: { name_color: "#9ca3af", banner_accent: "#6b7280", forum_flair: "Muted", dashboard_indicator: false, icon: "VolumeX" } },
  { slug: "suspended", name: "Suspended", description: "Temporarily restricted", icon: "PauseCircle", color: "#f97316", priority: 85, parent_slug: "member", is_system: true, permissions: [], denied_permissions: ["forum.create_thread", "forum.reply", "forum.edit_own_post", "forum.delete_own_post", "marketplace.list"], badge_config: { name_color: "#f97316", banner_accent: "#f97316", forum_flair: "Suspended", dashboard_indicator: true, icon: "PauseCircle" } },
  { slug: "banned", name: "Banned", description: "No access", icon: "Ban", color: "#ef4444", priority: 90, parent_slug: null, is_system: true, permissions: [], denied_permissions: ["*"], badge_config: { name_color: "#ef4444", banner_accent: "#ef4444", forum_flair: "Banned", dashboard_indicator: true, icon: "Ban" } },
];

export function safeParseJson(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Compute a single role's effective permissions, walking the inheritance tree.
// Child inherits parent permissions unless explicitly denied (override).
export function resolveEffectivePermissions(role, rolesById, visited = new Set()) {
  if (!role || visited.has(role.id)) return [];
  visited.add(role.id);

  let result = new Set();
  const own = safeParseJson(role.permissions);
  if (own.includes("*")) {
    result = new Set(ALL_PERMISSION_KEYS);
  } else {
    for (const p of own) result.add(p);
  }

  if (role.parent_role_id && rolesById[role.parent_role_id]) {
    const inherited = resolveEffectivePermissions(rolesById[role.parent_role_id], rolesById, visited);
    for (const p of inherited) result.add(p);
  }

  const denied = safeParseJson(role.denied_permissions);
  if (denied.includes("*")) return [];
  for (const p of denied) result.delete(p);

  return Array.from(result);
}

// Union of effective permissions across a user's active roles (multiple roles).
export function resolveUserPermissions(userRoles, rolesById) {
  const perms = new Set();
  for (const ur of userRoles) {
    if (ur.is_active === false) continue;
    const role = rolesById[ur.role_id];
    if (!role) continue;
    const effective = resolveEffectivePermissions(role, rolesById);
    for (const p of effective) perms.add(p);
  }
  return Array.from(perms);
}

// Backward-compat: map new RBAC role slugs to the legacy platform role flags
// (platform_owner / platform_admin / platform_support) so existing admin
// gating (PlatformAdminRoute, useAdminAccess) keeps working unchanged.
export function mapToLegacyPlatformRoles(slugs, permissions) {
  const out = [];
  if (slugs.includes("owner")) out.push("platform_owner");
  if (
    ["administrator", "developer", "senior_moderator", "moderator"].some((s) => slugs.includes(s)) ||
    (permissions && permissions.includes("admin.access"))
  ) {
    out.push("platform_admin");
  }
  return out;
}

// Backward-compat fallback permissions for users not yet migrated to RBAC.
// Keeps existing PlatformRole admins working until they're assigned RBAC roles.
export const LEGACY_ADMIN_PERMS = [
  "forum.moderate_reports", "forum.delete_any_post", "users.manage", "roles.manage",
  "clubs.manage", "repeaters.manage", "events.manage", "notifications.broadcast",
  "news.manage", "themes.manage", "badges.manage", "achievements.manage",
  "marketplace.manage", "admin.access", "analytics.view"
];

export function legacyFallback(platSlugs) {
  if (platSlugs.includes("platform_owner")) return { permissions: ALL_PERMISSION_KEYS, legacy: ["platform_owner"], slugs: ["owner"] };
  if (platSlugs.includes("platform_admin")) return { permissions: LEGACY_ADMIN_PERMS, legacy: ["platform_admin"], slugs: ["administrator"] };
  if (platSlugs.includes("platform_support")) return { permissions: [], legacy: ["platform_support"], slugs: [] };
  return null;
}

// Last-resort: a built-in admin (user.role === 'admin') is treated as Owner so
// the platform owner can never lock themselves out during migration.
export function ownerFallback() {
  return { permissions: ALL_PERMISSION_KEYS, legacy: ["platform_owner"], slugs: ["owner"] };
}

// Simple per-isolate TTL cache.
const cache = new Map();
const TTL_MS = 30000;
export function getCached(key) {
  const v = cache.get(key);
  if (v && Date.now() - v.ts < TTL_MS) return v.data;
  cache.delete(key);
  return null;
}
export function setCached(key, data) {
  cache.set(key, { data, ts: Date.now() });
}
export function invalidateRbacCache() {
  cache.clear();
}

// ─── Shared enforcement layer ──────────────────────────────────────────────
// Every protected backend function resolves the caller's permissions through
// this single helper (cache-aware), and enforces via requirePermission. Denials
// are written to RbacAuditLog so authorization failures are fully auditable.

export async function resolveCallerPerms(base44, user) {
  const cached = getCached(user.id);
  if (cached) {
    return {
      perms: cached.permissions || [],
      slugs: cached.roles || [],
      legacy: cached.legacy_platform_roles || [],
      assignments: cached.role_details || []
    };
  }
  const [userRoles, roles] = await Promise.all([
    base44.asServiceRole.entities.UserRole.filter({ user_id: user.id }),
    base44.asServiceRole.entities.Role.list('-priority', 500)
  ]);
  const rolesById = {};
  for (const r of roles || []) rolesById[r.id] = r;
  const active = (userRoles || []).filter((ur) => ur.is_active !== false);
  let slugs = active.map((ur) => ur.role_slug).filter(Boolean);
  let perms = resolveUserPermissions(active, rolesById);
  let legacy = mapToLegacyPlatformRoles(slugs, perms);
  // Single RBAC source of truth: UserRole. PlatformRole/CommunityRole are no
  // longer read. A built-in admin (user.role === 'admin') with no UserRole yet
  // is treated as Owner so the platform owner can never be locked out.
  if (active.length === 0 && user.role === 'admin') {
    const o = ownerFallback(); slugs = o.slugs; perms = o.permissions; legacy = o.legacy;
  }
  return { perms, slugs, legacy, assignments: active };
}

export async function logRbacAudit(base44, entry) {
  try {
    await base44.asServiceRole.entities.RbacAuditLog.create({
      admin_id: entry.admin_id || '',
      admin_email: entry.admin_email || '',
      action: entry.action,
      target_user_id: entry.target_user_id || '',
      target_user_email: entry.target_user_email || '',
      role_id: entry.role_id || '',
      role_name: entry.role_name || '',
      endpoint: entry.endpoint || '',
      permission_required: entry.permission_required || '',
      permission_granted: entry.permission_granted || '',
      old_value: entry.old_value || '',
      new_value: entry.new_value || '',
      changed_permissions: entry.changed_permissions || '',
      reason: entry.reason || '',
      ip_address: entry.ip_address || ''
    });
  } catch {
    /* audit is best-effort; never block the operation */
  }
}

// Enforce a permission for a protected function. Returns { ok, perms, slugs }.
// On denial, writes a permission_denied audit record. The caller returns 403.
export async function requirePermission(base44, user, permission, endpoint) {
  const { perms, slugs } = await resolveCallerPerms(base44, user);
  const ok = perms.includes('*') || perms.includes(permission);
  if (!ok) {
    await logRbacAudit(base44, {
      admin_id: user.id,
      admin_email: user.email || '',
      action: 'permission_denied',
      endpoint: endpoint || '',
      permission_required: permission,
      permission_granted: perms.join(',') || '(none)',
      reason: 'Missing "' + permission + '"'
    });
  }
  return { ok, perms, slugs };
}

// General domain-action audit (non-RBAC events: net lifecycle, content
// moderation, marketplace, etc.). Writes to PlatformAuditLog so the unified
// Security Audit Log captures every protected action across all modules.
export async function logActionAudit(base44, entry) {
  try {
    await base44.asServiceRole.entities.PlatformAuditLog.create({
      admin_id: entry.admin_id || '',
      admin_email: entry.admin_email || '',
      action: entry.action,
      target_type: entry.target_type || '',
      target_id: entry.target_id || '',
      target_name: entry.target_name || '',
      community_id: entry.community_id || '',
      community_name: entry.community_name || '',
      previous_value: entry.previous_value || '',
      new_value: entry.new_value || '',
      ip_address: entry.ip_address || '',
      notes: entry.notes || '',
    });
  } catch {
    /* audit is best-effort; never block the operation */
  }
}