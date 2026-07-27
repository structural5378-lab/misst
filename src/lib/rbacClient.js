// Frontend mirror of the centralized RBAC permission catalog (base44/shared/rbac.ts).
// Kept in sync manually; the backend shared module is authoritative for enforcement.

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