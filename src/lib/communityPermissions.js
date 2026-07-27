// Frontend mirror of the community-role → permission map used by the backend
// resolvePermissions function. Kept in sync manually; the backend is
// authoritative for enforcement. Used by the community Member Role Manager
// to preview a member's effective community permissions.

export const COMMUNITY_ROLE_PERMISSIONS = {
  community_owner: [
    "community:admin", "community:moderate", "community:create_alert", "community:create_event",
    "community:create_net", "community:manage_members", "community:manage_settings",
    "community:delete", "community:transfer_ownership", "community:create_custom_roles",
    "community:override_permissions", "community:customize_branding", "community:invite_members",
    "community:upload_photos", "community:create_listings", "community:create_threads",
    "community:post_chat", "community:delete_any_message", "community:checkin_net",
    "community:view_content", "community:warn", "community:mute", "community:suspend",
    "community:remove", "community:ban", "community:review_reports",
  ],
  community_admin: [
    "community:admin", "community:moderate", "community:create_alert", "community:create_event",
    "community:create_net", "community:manage_members", "community:manage_settings",
    "community:invite_members", "community:upload_photos", "community:create_listings",
    "community:create_threads", "community:post_chat", "community:delete_any_message",
    "community:checkin_net", "community:view_content", "community:warn", "community:mute",
    "community:suspend", "community:remove", "community:review_reports",
  ],
  net_control: [
    "community:create_net", "community:create_event", "community:upload_photos",
    "community:create_threads", "community:post_chat", "community:delete_own_message",
    "community:checkin_net", "community:view_content",
  ],
  moderator: [
    "community:moderate", "community:delete_any_message", "community:warn", "community:mute",
    "community:suspend", "community:remove", "community:review_reports", "community:create_threads",
    "community:post_chat", "community:delete_own_message", "community:checkin_net",
    "community:view_content",
  ],
  trusted_member: [
    "community:upload_photos", "community:create_listings", "community:create_threads",
    "community:post_chat", "community:delete_own_message", "community:checkin_net",
    "community:view_content",
  ],
  member: [
    "community:post_chat", "community:delete_own_message", "community:checkin_net",
    "community:view_content",
  ],
  guest: ["community:view_content"],
};

export const COMMUNITY_ROLES = [
  { key: "community_owner", label: "Owner", color: "#f59e0b", desc: "Full control. Cannot be removed except via ownership transfer." },
  { key: "community_admin", label: "Administrator", color: "#8b5cf6", desc: "Manage nearly everything except ownership." },
  { key: "net_control", label: "Net Control", color: "#22d3ee", desc: "Dedicated role for operating nets." },
  { key: "moderator", label: "Moderator", color: "#3b82f6", desc: "Moderate chat, warn/mute/suspend members, review reports." },
  { key: "trusted_member", label: "Trusted Member", color: "#06b6d4", desc: "Trusted regular member with extra abilities." },
  { key: "member", label: "Member", color: "#94a3b8", desc: "Standard community member." },
  { key: "guest", label: "Guest", color: "#64748b", desc: "Read-only access where applicable." },
];

export function communityRoleLabel(role) {
  return COMMUNITY_ROLES.find((r) => r.key === role)?.label || role || "Member";
}