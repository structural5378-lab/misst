// Frontend mirror of the centralized RBAC permission catalog (base44/shared/rbac.ts).
// Kept in sync manually; the backend shared module is authoritative for enforcement.

export const PERMISSIONS = [
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
  { key: "users.manage", label: "Manage Users", category: "Administration" },
  { key: "roles.manage", label: "Manage Roles", category: "Administration" },
  { key: "clubs.manage", label: "Manage Clubs", category: "Administration" },
  { key: "repeaters.manage", label: "Manage Repeaters", category: "Administration" },
  { key: "events.manage", label: "Manage Events", category: "Administration" },
  { key: "notifications.broadcast", label: "Send Broadcast Notifications", category: "Administration" },
  { key: "news.manage", label: "Manage News", category: "Administration" },
  { key: "themes.manage", label: "Manage Themes", category: "Administration" },
  { key: "badges.manage", label: "Manage Badges", category: "Administration" },
  { key: "achievements.manage", label: "Manage Achievements", category: "Administration" },
  { key: "marketplace.manage", label: "Manage Marketplace", category: "Administration" },
  { key: "admin.access", label: "Access Admin Panel", category: "Administration" },
  { key: "analytics.view", label: "View Analytics", category: "Administration" },
  { key: "developer.tools", label: "Developer Tools", category: "System" },
  { key: "system.settings", label: "System Settings", category: "System" },
  { key: "database.maintenance", label: "Database Maintenance", category: "System" },
  { key: "api.manage", label: "API Management", category: "System" },
  { key: "marketplace.list", label: "List Marketplace Items", category: "Future" },
  { key: "voice_chat.use", label: "Use Voice Chat", category: "Future" },
  { key: "live_radio.manage", label: "Manage Live Radio", category: "Future" },
  { key: "plugins.manage", label: "Manage Plugins", category: "Future" },
  { key: "third_party.manage", label: "Third-Party Integrations", category: "Future" },
];

export const ALL_PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

export const ROLE_ICONS = {
  Crown: "Crown", Shield: "Shield", Terminal: "Terminal", ShieldCheck: "ShieldCheck",
  ShieldAlert: "ShieldAlert", Users: "Users", BadgeCheck: "BadgeCheck", Sparkles: "Sparkles",
  User: "User", UserPlus: "UserPlus", VolumeX: "VolumeX", PauseCircle: "PauseCircle", Ban: "Ban"
};

export function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const p = JSON.parse(value);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export function parseBadgeConfig(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try { return JSON.parse(value) || {}; } catch { return {}; }
}