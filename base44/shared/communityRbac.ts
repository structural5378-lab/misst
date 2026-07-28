// Community-scoped RBAC catalog + default roles + templates.
// This is the single source of truth for the flexible per-community role
// system. Keys use the existing "community:<area>.<action>" colon style so
// existing hasPermission('community:moderate') checks keep working; the
// legacy keys are retained in default roles for backward compatibility.
// Platform Super Administrators remain on the separate Role/UserRole axis.

export const PERMISSION_CATALOG = [
  {
    id: 'general', label: 'General', permissions: [
      { key: 'community:view', label: 'View Community', description: 'See this community and its content.' },
      { key: 'community:join', label: 'Join Community', description: 'Self-join open/public communities.' },
      { key: 'community:view_members', label: 'View Members', description: 'See the community member list.' },
      { key: 'community:mention_everyone', label: 'Mention Everyone', description: 'Use @everyone / @here in chat.' },
      { key: 'community:invite_members', label: 'Invite Members', description: 'Send community invites.' },
      { key: 'community:manage_invites', label: 'Manage Invites', description: 'Create, revoke, and expire invite codes.' },
    ],
  },
  {
    id: 'community', label: 'Community', permissions: [
      { key: 'community:edit', label: 'Edit Community', description: 'Edit community name, description, and identity.' },
      { key: 'community:delete', label: 'Delete Community', description: 'Permanently delete the community (owner-only in practice).' },
      { key: 'community:manage_settings', label: 'Manage Settings', description: 'Edit community settings and join mode.' },
      { key: 'community:manage_branding', label: 'Manage Branding', description: 'Edit logo, banner, colors, and theme.' },
      { key: 'community:manage_categories', label: 'Manage Categories', description: 'Create and reorder forum/content categories.' },
      { key: 'community:manage_welcome', label: 'Manage Welcome Message', description: 'Edit the message shown to new members.' },
      { key: 'community:admin', label: 'Community Admin', description: 'Legacy umbrella permission for the admin panel.' },
      { key: 'community:create_custom_roles', label: 'Create Custom Roles', description: 'Create and edit custom community roles.' },
      { key: 'community:override_permissions', label: 'Override Permissions', description: 'Bypass role permission checks (owner-only in practice).' },
      { key: 'community:transfer_ownership', label: 'Transfer Ownership', description: 'Transfer community ownership.' },
    ],
  },
  {
    id: 'chat', label: 'Chat', permissions: [
      { key: 'community:chat_read', label: 'Read Chat', description: 'View community chat rooms and messages.' },
      { key: 'community:post_chat', label: 'Send Messages', description: 'Post messages in chat rooms.' },
      { key: 'community:edit_own_message', label: 'Edit Own Messages', description: 'Edit your own chat messages.' },
      { key: 'community:delete_own_message', label: 'Delete Own Messages', description: 'Delete your own chat messages.' },
      { key: 'community:upload_files', label: 'Upload Files', description: 'Attach files and images to messages.' },
      { key: 'community:react', label: 'React', description: 'Add emoji reactions to messages.' },
      { key: 'community:create_threads', label: 'Create Threads', description: 'Create forum threads.' },
      { key: 'community:pin_messages', label: 'Pin Messages', description: 'Pin messages in a room.' },
      { key: 'community:delete_any_message', label: 'Delete Messages', description: 'Delete any member’s messages (moderation).' },
      { key: 'community:manage_rooms', label: 'Manage Rooms', description: 'Create, edit, archive, and delete chat rooms.' },
      { key: 'community:lock_rooms', label: 'Lock Rooms', description: 'Lock and unlock chat rooms.' },
      { key: 'community:slow_mode', label: 'Slow Mode', description: 'Configure room slow-mode timers.' },
      { key: 'community:announcements', label: 'Announcements', description: 'Mark messages as announcements.' },
      { key: 'community:sticky_messages', label: 'Sticky Messages', description: 'Mark messages as sticky.' },
      { key: 'community:official_messages', label: 'Official Messages', description: 'Mark messages as official.' },
      { key: 'community:moderate', label: 'Moderate Chat', description: 'Legacy umbrella for chat moderation.' },
    ],
  },
  {
    id: 'members', label: 'Members', permissions: [
      { key: 'community:approve_members', label: 'Approve Members', description: 'Approve pending join requests.' },
      { key: 'community:reject_members', label: 'Reject Members', description: 'Reject pending join requests.' },
      { key: 'community:assign_roles', label: 'Assign Roles', description: 'Assign and remove roles on members.' },
      { key: 'community:manage_members', label: 'Manage Members', description: 'Legacy umbrella for member management.' },
      { key: 'community:warn', label: 'Warn Members', description: 'Issue warnings to members.' },
      { key: 'community:mute', label: 'Mute Members', description: 'Mute members from chat / voice.' },
      { key: 'community:suspend', label: 'Suspend Members', description: 'Suspend members temporarily.' },
      { key: 'community:remove', label: 'Kick Members', description: 'Remove members from the community.' },
      { key: 'community:ban', label: 'Ban Members', description: 'Permanently ban members.' },
      { key: 'community:unban', label: 'Unban Members', description: 'Lift community bans.' },
      { key: 'community:view_moderation_history', label: 'View Moderation History', description: 'View a member’s full moderation timeline.' },
      { key: 'community:create_mod_notes', label: 'Create Moderator Notes', description: 'Add internal staff notes to member profiles.' },
      { key: 'community:review_reports', label: 'Review Reports', description: 'View and act on community reports.' },
    ],
  },
  {
    id: 'events', label: 'Events', permissions: [
      { key: 'community:create_events', label: 'Create Events', description: 'Create community events.' },
      { key: 'community:edit_events', label: 'Edit Events', description: 'Edit any community event.' },
      { key: 'community:delete_events', label: 'Delete Events', description: 'Delete community events.' },
      { key: 'community:publish_events', label: 'Publish Events', description: 'Publish / announce events.' },
      { key: 'community:create_event', label: 'Create Event (legacy)', description: 'Legacy event-creation permission.' },
    ],
  },
  {
    id: 'nets', label: 'Nets', permissions: [
      { key: 'community:create_nets', label: 'Create Nets', description: 'Create new nets.' },
      { key: 'community:schedule_nets', label: 'Schedule Nets', description: 'Schedule recurring nets.' },
      { key: 'community:start_nets', label: 'Start Nets', description: 'Start a live net session.' },
      { key: 'community:pause_nets', label: 'Pause Nets', description: 'Pause an active net.' },
      { key: 'community:resume_nets', label: 'Resume Nets', description: 'Resume a paused net.' },
      { key: 'community:end_nets', label: 'End Nets', description: 'End an active net session.' },
      { key: 'community:log_nets', label: 'Log Nets', description: 'Record net check-ins and timeline entries.' },
      { key: 'community:export_net_logs', label: 'Export Net Logs', description: 'Export net logs as CSV/PDF.' },
      { key: 'community:create_net', label: 'Create Net (legacy)', description: 'Legacy net-creation permission.' },
      { key: 'community:checkin_net', label: 'Check In', description: 'Check in to an active net.' },
    ],
  },
  {
    id: 'reports', label: 'Reports', permissions: [
      { key: 'community:view_reports', label: 'View Reports', description: 'View submitted reports.' },
      { key: 'community:resolve_reports', label: 'Resolve Reports', description: 'Mark reports resolved with action.' },
      { key: 'community:dismiss_reports', label: 'Dismiss Reports', description: 'Dismiss reports with no action.' },
      { key: 'community:escalate_reports', label: 'Escalate Reports', description: 'Escalate reports to platform admins.' },
    ],
  },
  {
    id: 'analytics', label: 'Analytics', permissions: [
      { key: 'community:view_analytics', label: 'View Analytics', description: 'View moderation and community analytics.' },
      { key: 'community:export_analytics', label: 'Export Analytics', description: 'Export analytics as CSV/PDF.' },
    ],
  },
  {
    id: 'audit', label: 'Audit', permissions: [
      { key: 'community:view_audit_log', label: 'View Audit Log', description: 'View the community audit log.' },
      { key: 'community:export_audit_log', label: 'Export Audit Log', description: 'Export the audit log as CSV/PDF.' },
    ],
  },
  {
    id: 'voice', label: 'Voice', permissions: [
      { key: 'community:voice_join', label: 'Join Voice', description: 'Join voice channels.' },
      { key: 'community:voice_speak', label: 'Speak', description: 'Transmit audio in voice channels.' },
      { key: 'community:create_voice_rooms', label: 'Create Voice Rooms', description: 'Create voice rooms.' },
      { key: 'community:manage_voice', label: 'Manage Voice', description: 'Manage voice rooms and participants.' },
      { key: 'community:voice_mute', label: 'Voice Mute', description: 'Mute members from voice.' },
      { key: 'community:voice_kick', label: 'Voice Kick', description: 'Disconnect members from voice.' },
      { key: 'community:voice_lock', label: 'Voice Lock', description: 'Lock voice rooms.' },
    ],
  },
];

export const ALL_COMMUNITY_PERMISSIONS = PERMISSION_CATALOG.flatMap((c) => c.permissions.map((p) => p.key));

// Legacy keys kept in default roles so existing hasPermission() checks across
// the app keep working unchanged during the migration to the flexible system.
const LEGACY = {
  owner: ['community:admin', 'community:moderate', 'community:create_alert', 'community:create_event', 'community:create_net', 'community:manage_members', 'community:manage_settings', 'community:delete', 'community:transfer_ownership', 'community:create_custom_roles', 'community:override_permissions', 'community:customize_branding', 'community:invite_members', 'community:upload_photos', 'community:create_listings', 'community:create_threads', 'community:post_chat', 'community:delete_any_message', 'community:checkin_net', 'community:view_content', 'community:warn', 'community:mute', 'community:suspend', 'community:remove', 'community:ban', 'community:review_reports'],
  admin: ['community:admin', 'community:moderate', 'community:create_alert', 'community:create_event', 'community:create_net', 'community:manage_members', 'community:manage_settings', 'community:invite_members', 'community:upload_photos', 'community:create_listings', 'community:create_threads', 'community:post_chat', 'community:delete_any_message', 'community:checkin_net', 'community:view_content', 'community:warn', 'community:mute', 'community:suspend', 'community:remove', 'community:review_reports'],
  net_control: ['community:create_net', 'community:create_event', 'community:upload_photos', 'community:create_threads', 'community:post_chat', 'community:delete_own_message', 'community:checkin_net', 'community:view_content'],
  moderator: ['community:moderate', 'community:delete_any_message', 'community:warn', 'community:mute', 'community:suspend', 'community:remove', 'community:review_reports', 'community:create_threads', 'community:post_chat', 'community:delete_own_message', 'community:checkin_net', 'community:view_content'],
  trusted: ['community:upload_photos', 'community:create_listings', 'community:create_threads', 'community:post_chat', 'community:delete_own_message', 'community:checkin_net', 'community:view_content'],
  member: ['community:post_chat', 'community:delete_own_message', 'community:checkin_net', 'community:view_content'],
};

// The six protected default roles. Owner and Member cannot be deleted; the
// others may be renamed but not stripped of critical permissions.
export const DEFAULT_COMMUNITY_ROLES = [
  {
    slug: 'owner', name: 'Owner', description: 'Full community control. Cannot be removed except via ownership transfer.',
    color: '#f59e0b', icon: 'Crown', position: 0, is_system: true, is_protected: true,
    mentionable: true, hoisted: true,
    permissions: ['*'],
  },
  {
    slug: 'administrator', name: 'Administrator', description: 'Manage nearly everything except ownership.',
    color: '#8b5cf6', icon: 'Shield', position: 10, is_system: true, is_protected: false,
    mentionable: true, hoisted: true,
    permissions: [
      ...LEGACY.admin,
      'community:edit', 'community:manage_branding', 'community:manage_categories', 'community:manage_welcome',
      'community:approve_members', 'community:reject_members', 'community:assign_roles', 'community:unban',
      'community:view_moderation_history', 'community:create_mod_notes', 'community:manage_invites',
      'community:create_events', 'community:edit_events', 'community:delete_events', 'community:publish_events',
      'community:create_nets', 'community:schedule_nets', 'community:start_nets', 'community:pause_nets', 'community:resume_nets', 'community:end_nets', 'community:log_nets', 'community:export_net_logs',
      'community:view_reports', 'community:resolve_reports', 'community:dismiss_reports', 'community:escalate_reports',
      'community:view_analytics', 'community:export_analytics', 'community:view_audit_log', 'community:export_audit_log',
      'community:manage_rooms', 'community:lock_rooms', 'community:slow_mode', 'community:announcements', 'community:sticky_messages', 'community:official_messages', 'community:pin_messages',
      'community:chat_read', 'community:react', 'community:upload_files', 'community:view_members',
    ],
  },
  {
    slug: 'moderator', name: 'Moderator', description: 'Moderate chat and members, review reports.',
    color: '#3b82f6', icon: 'ShieldAlert', position: 20, is_system: true, is_protected: false,
    mentionable: true, hoisted: true,
    permissions: [
      ...LEGACY.moderator,
      'community:chat_read', 'community:react', 'community:upload_files', 'community:view_members',
      'community:pin_messages', 'community:manage_rooms', 'community:lock_rooms', 'community:slow_mode',
      'community:announcements', 'community:sticky_messages', 'community:official_messages',
      'community:view_moderation_history', 'community:create_mod_notes',
      'community:view_reports', 'community:resolve_reports', 'community:dismiss_reports',
      'community:view_audit_log',
    ],
  },
  {
    slug: 'net_control', name: 'Net Control', description: 'Dedicated role for operating nets.',
    color: '#22d3ee', icon: 'RadioTower', position: 30, is_system: true, is_protected: false,
    mentionable: true, hoisted: true,
    permissions: [
      ...LEGACY.net_control,
      'community:chat_read', 'community:react', 'community:view_members',
      'community:create_nets', 'community:schedule_nets', 'community:start_nets', 'community:pause_nets', 'community:resume_nets', 'community:end_nets', 'community:log_nets', 'community:export_net_logs',
      'community:create_events', 'community:publish_events', 'community:voice_join', 'community:voice_speak',
    ],
  },
  {
    slug: 'trusted', name: 'Trusted', description: 'Trusted regular member with extra abilities.',
    color: '#06b6d4', icon: 'BadgeCheck', position: 40, is_system: true, is_protected: false,
    mentionable: false, hoisted: false,
    permissions: [
      ...LEGACY.trusted,
      'community:chat_read', 'community:react', 'community:view_members', 'community:voice_join', 'community:voice_speak',
    ],
  },
  {
    slug: 'member', name: 'Member', description: 'Standard community member.',
    color: '#94a3b8', icon: 'User', position: 50, is_system: true, is_protected: true,
    mentionable: false, hoisted: false,
    permissions: [
      ...LEGACY.member,
      'community:chat_read', 'community:react', 'community:view_members', 'community:voice_join', 'community:voice_speak',
    ],
  },
];

// Map a custom role slug to the legacy CommunityMember.role enum (kept for
// back-compat with existing hierarchy checks in manageCommunityMembership).
export function legacyRoleFromSlug(slug: string): string | null {
  if (slug === 'owner') return 'community_owner';
  if (slug === 'administrator') return 'community_admin';
  if (slug === 'moderator') return 'moderator';
  if (slug === 'net_control') return 'net_control';
  if (slug === 'trusted') return 'trusted_member';
  if (slug === 'member') return 'member';
  return null;
}

// Optional role templates a community owner can apply to seed custom roles.
export const ROLE_TEMPLATES = [
  {
    id: 'gmrs_club', label: 'GMRS Club', description: 'Radio club with net control + officers.',
    roles: [
      { slug: 'club_officer', name: 'Club Officer', color: '#a855f7', icon: 'Star', permissions: ['community:manage_settings', 'community:manage_members', 'community:invite_members', 'community:manage_invites', 'community:create_events', 'community:edit_events'] },
      { slug: 'training_officer', name: 'Training Officer', color: '#10b981', icon: 'GraduationCap', permissions: ['community:create_events', 'community:create_nets', 'community:start_nets', 'community:log_nets'] },
    ],
  },
  {
    id: 'emergency', label: 'Emergency Response', description: 'Emergency coordination structure.',
    roles: [
      { slug: 'emergency_coordinator', name: 'Emergency Coordinator', color: '#ef4444', icon: 'Siren', permissions: ['community:announcements', 'community:pin_messages', 'community:create_events', 'community:publish_events', 'community:manage_rooms'] },
      { slug: 'dispatcher', name: 'Dispatcher', color: '#f59e0b', icon: 'Radio', permissions: ['community:create_nets', 'community:start_nets', 'community:log_nets', 'community:announcements'] },
    ],
  },
  {
    id: 'social', label: 'Social Community', description: 'Light social community roles.',
    roles: [
      { slug: 'event_coordinator', name: 'Event Coordinator', color: '#ec4899', icon: 'CalendarPlus', permissions: ['community:create_events', 'community:edit_events', 'community:publish_events'] },
      { slug: 'volunteer', name: 'Volunteer', color: '#22c55e', icon: 'HandHeart', permissions: ['community:upload_files', 'community:create_threads'] },
    ],
  },
  {
    id: 'training', label: 'Training Group', description: 'Training-focused community.',
    roles: [
      { slug: 'instructor', name: 'Instructor', color: '#3b82f6', icon: 'GraduationCap', permissions: ['community:create_events', 'community:publish_events', 'community:create_nets', 'community:start_nets', 'community:log_nets', 'community:export_net_logs'] },
    ],
  },
  {
    id: 'public', label: 'Public Community', description: 'Open public community.',
    roles: [
      { slug: 'community_liaison', name: 'Community Liaison', color: '#06b6d4', icon: 'Megaphone', permissions: ['community:announcements', 'community:invite_members', 'community:manage_invites'] },
    ],
  },
  {
    id: 'private', label: 'Private Community', description: 'Closed private community.',
    roles: [
      { slug: 'board_member', name: 'Board Member', color: '#8b5cf6', icon: 'Briefcase', permissions: ['community:manage_settings', 'community:manage_members', 'community:approve_members', 'community:reject_members'] },
    ],
  },
];

export function safeParseArr(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try { const p = JSON.parse(value); return Array.isArray(p) ? p : []; } catch { return []; }
}

// Union of permission arrays across a member's custom roles. '*' expands to all.
export function unionPermissions(rolePermissionArrays: string[][]): string[] {
  const set = new Set<string>();
  for (const arr of rolePermissionArrays) {
    if (arr.includes('*')) return ALL_COMMUNITY_PERMISSIONS;
    for (const p of arr) set.add(p);
  }
  return Array.from(set);
}