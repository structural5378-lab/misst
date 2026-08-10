-- MISST Core — Migration 002: Entity tables
-- Auto-generated from base44/entities/*.jsonc. Do not edit by hand.
-- Regenerate via: node scripts/generate-core-entities.cjs
-- 69 entities.
-- AccountMigration
CREATE TABLE IF NOT EXISTS account_migration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  mybb_uid TEXT NOT NULL,
  mybb_username TEXT NOT NULL,
  mybb_email TEXT,
  mist_user_id TEXT,
  mist_email TEXT,
  status TEXT NOT NULL DEFAULT 'conflict' CHECK (status IN ('migrated', 'conflict', 'skipped', 'error', 'resolved')),
  conflict_reason TEXT,
  preserved_data TEXT,
  migration_batch TEXT,
  migrated_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_account_migration_mist_user_id ON account_migration(mist_user_id);
CREATE INDEX IF NOT EXISTS idx_account_migration_created_date ON account_migration(created_date);

-- Alert
CREATE TABLE IF NOT EXISTS alert (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'emergency', 'system')),
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  community_id TEXT,
  community_name TEXT
);
CREATE INDEX IF NOT EXISTS idx_alert_community_id ON alert(community_id);
CREATE INDEX IF NOT EXISTS idx_alert_created_date ON alert(created_date);

-- BlockedUser
CREATE TABLE IF NOT EXISTS blocked_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  user_id TEXT NOT NULL,
  blocked_user_id TEXT NOT NULL,
  blocked_user_name TEXT,
  blocked_user_avatar TEXT,
  blocked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_blocked_user_user_id ON blocked_user(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_user_blocked_user_id ON blocked_user(blocked_user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_user_created_date ON blocked_user(created_date);

-- ChatMessage
CREATE TABLE IF NOT EXISTS chat_message (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  sender_uid TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  community_id TEXT,
  community_name TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  reactions TEXT,
  reply_to_id TEXT,
  reply_to_name TEXT,
  reply_to_content TEXT,
  reply_to_image TEXT
);
CREATE INDEX IF NOT EXISTS idx_chat_message_community_id ON chat_message(community_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_reply_to_id ON chat_message(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_created_date ON chat_message(created_date);

-- ChatPresence
CREATE TABLE IF NOT EXISTS chat_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  user_uid TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'typing', 'away', 'idle', 'monitoring', 'emergency', 'offline')),
  last_active TIMESTAMPTZ,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  current_repeater_id TEXT,
  active_chat_community_id TEXT,
  sharing_location BOOLEAN DEFAULT FALSE,
  gps_accuracy DOUBLE PRECISION,
  gps_speed DOUBLE PRECISION,
  gps_heading DOUBLE PRECISION,
  location_source TEXT CHECK (location_source IN ('gps', 'network', 'low', 'unknown')),
  location_updated_at TIMESTAMPTZ,
  location_expires_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_chat_presence_current_repeater_id ON chat_presence(current_repeater_id);
CREATE INDEX IF NOT EXISTS idx_chat_presence_active_chat_community_id ON chat_presence(active_chat_community_id);
CREATE INDEX IF NOT EXISTS idx_chat_presence_created_date ON chat_presence(created_date);

-- ChatV2Conversation
CREATE TABLE IF NOT EXISTS chat_v2_conversation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  name TEXT,
  is_group BOOLEAN NOT NULL DEFAULT FALSE,
  community_id TEXT,
  created_by TEXT,
  avatar_url TEXT,
  participants_summary TEXT,
  last_message_id TEXT,
  last_message_preview TEXT,
  last_message_at TIMESTAMPTZ,
  last_sender_id TEXT,
  last_sender_name TEXT,
  last_sender_avatar TEXT
);
CREATE INDEX IF NOT EXISTS idx_chat_v2_conversation_community_id ON chat_v2_conversation(community_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_conversation_last_message_id ON chat_v2_conversation(last_message_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_conversation_last_sender_id ON chat_v2_conversation(last_sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_conversation_created_date ON chat_v2_conversation(created_date);

-- ChatV2Message
CREATE TABLE IF NOT EXISTS chat_v2_message (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  sender_avatar TEXT,
  body TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  attachments TEXT,
  reactions TEXT,
  reply_to_message_id TEXT,
  reply_to_preview TEXT,
  edited_at TIMESTAMPTZ,
  deleted BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
  read_by TEXT,
  delivered_to TEXT,
  client_temp_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_chat_v2_message_conversation_id ON chat_v2_message(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_message_sender_id ON chat_v2_message(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_message_reply_to_message_id ON chat_v2_message(reply_to_message_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_message_client_temp_id ON chat_v2_message(client_temp_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_message_created_date ON chat_v2_message(created_date);

-- ChatV2Participant
CREATE TABLE IF NOT EXISTS chat_v2_participant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_avatar TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  last_read_message_id TEXT,
  last_read_at TIMESTAMPTZ,
  unread_count DOUBLE PRECISION DEFAULT 0,
  muted BOOLEAN DEFAULT FALSE,
  left BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_chat_v2_participant_conversation_id ON chat_v2_participant(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_participant_user_id ON chat_v2_participant(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_participant_last_read_message_id ON chat_v2_participant(last_read_message_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_participant_created_date ON chat_v2_participant(created_date);

-- ChatV2Presence
CREATE TABLE IF NOT EXISTS chat_v2_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_avatar TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
  last_seen TIMESTAMPTZ,
  last_heartbeat TIMESTAMPTZ,
  typing_conversation_id TEXT,
  typing_at TIMESTAMPTZ,
  active_conversation_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_chat_v2_presence_user_id ON chat_v2_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_presence_typing_conversation_id ON chat_v2_presence(typing_conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_presence_active_conversation_id ON chat_v2_presence(active_conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_presence_created_date ON chat_v2_presence(created_date);

-- ChatV2Room
CREATE TABLE IF NOT EXISTS chat_v2_room (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Hash',
  community_id TEXT NOT NULL,
  community_name TEXT,
  community_slug TEXT,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'voice', 'readonly', 'admin', 'emergency', 'event')),
  order DOUBLE PRECISION DEFAULT 0,
  created_by TEXT,
  created_by_name TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  slow_mode_seconds DOUBLE PRECISION DEFAULT 0,
  permissions TEXT,
  member_count DOUBLE PRECISION DEFAULT 0,
  last_message_id TEXT,
  last_message_preview TEXT,
  last_message_at TIMESTAMPTZ,
  last_sender_id TEXT,
  last_sender_name TEXT,
  last_sender_avatar TEXT
);
CREATE INDEX IF NOT EXISTS idx_chat_v2_room_community_id ON chat_v2_room(community_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_room_last_message_id ON chat_v2_room(last_message_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_room_last_sender_id ON chat_v2_room(last_sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_room_created_date ON chat_v2_room(created_date);

-- ChatV2RoomMembership
CREATE TABLE IF NOT EXISTS chat_v2_room_membership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT,
  community_id TEXT,
  muted BOOLEAN DEFAULT FALSE,
  favorite BOOLEAN DEFAULT FALSE,
  pinned BOOLEAN DEFAULT FALSE,
  last_read_message_id TEXT,
  last_read_at TIMESTAMPTZ,
  unread_count DOUBLE PRECISION DEFAULT 0,
  joined_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_chat_v2_room_membership_room_id ON chat_v2_room_membership(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_room_membership_user_id ON chat_v2_room_membership(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_room_membership_community_id ON chat_v2_room_membership(community_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_room_membership_last_read_message_id ON chat_v2_room_membership(last_read_message_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_room_membership_created_date ON chat_v2_room_membership(created_date);

-- ChatV2RoomMessage
CREATE TABLE IF NOT EXISTS chat_v2_room_message (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  room_id TEXT NOT NULL,
  community_id TEXT NOT NULL,
  community_slug TEXT,
  room_name TEXT,
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  sender_avatar TEXT,
  sender_role TEXT,
  body TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  attachments TEXT,
  reactions TEXT,
  reply_to_message_id TEXT,
  reply_to_preview TEXT,
  reply_to_sender_id TEXT,
  reply_to_sender_name TEXT,
  mentions TEXT,
  edited_at TIMESTAMPTZ,
  deleted BOOLEAN DEFAULT FALSE,
  deleted_by TEXT,
  deleted_by_name TEXT,
  deleted_at TIMESTAMPTZ,
  deleted_reason TEXT,
  pinned BOOLEAN DEFAULT FALSE,
  pinned_by TEXT,
  pinned_by_name TEXT,
  pinned_at TIMESTAMPTZ,
  is_announcement BOOLEAN DEFAULT FALSE,
  is_sticky BOOLEAN DEFAULT FALSE,
  is_official BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'failed')),
  client_temp_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_chat_v2_room_message_room_id ON chat_v2_room_message(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_room_message_community_id ON chat_v2_room_message(community_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_room_message_sender_id ON chat_v2_room_message(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_room_message_reply_to_message_id ON chat_v2_room_message(reply_to_message_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_room_message_reply_to_sender_id ON chat_v2_room_message(reply_to_sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_room_message_client_temp_id ON chat_v2_room_message(client_temp_id);
CREATE INDEX IF NOT EXISTS idx_chat_v2_room_message_created_date ON chat_v2_room_message(created_date);

-- Club
CREATE TABLE IF NOT EXISTS club (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  community_id TEXT,
  community_name TEXT,
  owner_id TEXT,
  owner_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
  is_public BOOLEAN DEFAULT TRUE,
  member_count DOUBLE PRECISION DEFAULT 0,
  logo_url TEXT
);
CREATE INDEX IF NOT EXISTS idx_club_community_id ON club(community_id);
CREATE INDEX IF NOT EXISTS idx_club_owner_id ON club(owner_id);
CREATE INDEX IF NOT EXISTS idx_club_created_date ON club(created_date);

-- Community
CREATE TABLE IF NOT EXISTS community (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  category TEXT,
  callsign TEXT,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  owner_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  founder_uid TEXT,
  founder_name TEXT,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending', 'archived')),
  timezone TEXT DEFAULT 'America/New_York',
  location TEXT,
  location_lat DOUBLE PRECISION,
  location_lon DOUBLE PRECISION,
  primary_repeater TEXT,
  frequency DOUBLE PRECISION,
  pl_tone TEXT,
  invite_link TEXT,
  primary_color TEXT DEFAULT '#8B5CF6',
  accent_color TEXT DEFAULT '#06B6D4',
  theme_override TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  max_members DOUBLE PRECISION DEFAULT 1000,
  is_listed BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  member_count DOUBLE PRECISION DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_community_owner_id ON community(owner_id);
CREATE INDEX IF NOT EXISTS idx_community_created_date ON community(created_date);

-- CommunityAuditLog
CREATE TABLE IF NOT EXISTS community_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  community_id TEXT NOT NULL,
  community_name TEXT,
  admin_id TEXT NOT NULL,
  admin_name TEXT,
  action TEXT NOT NULL,
  action_category TEXT DEFAULT 'moderation' CHECK (action_category IN ('membership', 'moderation', 'chat', 'roles', 'settings', 'other')),
  target_user_id TEXT,
  target_user_name TEXT,
  target_message_id TEXT,
  room_id TEXT,
  room_name TEXT,
  reason TEXT,
  duration TEXT,
  previous_state TEXT,
  new_state TEXT,
  ip_address TEXT,
  device_info TEXT
);
CREATE INDEX IF NOT EXISTS idx_community_audit_log_community_id ON community_audit_log(community_id);
CREATE INDEX IF NOT EXISTS idx_community_audit_log_admin_id ON community_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_community_audit_log_target_user_id ON community_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_community_audit_log_target_message_id ON community_audit_log(target_message_id);
CREATE INDEX IF NOT EXISTS idx_community_audit_log_room_id ON community_audit_log(room_id);
CREATE INDEX IF NOT EXISTS idx_community_audit_log_created_date ON community_audit_log(created_date);

-- CommunityMember
CREATE TABLE IF NOT EXISTS community_member (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  user_avatar TEXT,
  user_callsign TEXT,
  community_id TEXT NOT NULL,
  community_name TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('community_owner', 'community_admin', 'net_control', 'moderator', 'trusted_member', 'member', 'guest')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'banned', 'left')),
  joined_date TIMESTAMPTZ,
  assigned_by TEXT,
  assigned_by_email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  muted BOOLEAN DEFAULT FALSE,
  muted_until TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_community_member_user_id ON community_member(user_id);
CREATE INDEX IF NOT EXISTS idx_community_member_community_id ON community_member(community_id);
CREATE INDEX IF NOT EXISTS idx_community_member_created_date ON community_member(created_date);

-- CommunityMemberRole
CREATE TABLE IF NOT EXISTS community_member_role (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  community_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT,
  role_id TEXT NOT NULL,
  role_slug TEXT NOT NULL,
  role_name TEXT,
  role_color TEXT,
  role_icon TEXT,
  role_position DOUBLE PRECISION,
  is_primary BOOLEAN DEFAULT FALSE,
  assigned_by TEXT,
  assigned_by_email TEXT,
  assigned_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_community_member_role_community_id ON community_member_role(community_id);
CREATE INDEX IF NOT EXISTS idx_community_member_role_user_id ON community_member_role(user_id);
CREATE INDEX IF NOT EXISTS idx_community_member_role_role_id ON community_member_role(role_id);
CREATE INDEX IF NOT EXISTS idx_community_member_role_created_date ON community_member_role(created_date);

-- CommunityRole
CREATE TABLE IF NOT EXISTS community_role (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  community_id TEXT NOT NULL,
  community_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('community_owner', 'community_admin', 'moderator', 'trusted_member', 'member', 'guest')),
  assigned_by TEXT,
  assigned_by_email TEXT,
  is_active BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_community_role_user_id ON community_role(user_id);
CREATE INDEX IF NOT EXISTS idx_community_role_community_id ON community_role(community_id);
CREATE INDEX IF NOT EXISTS idx_community_role_created_date ON community_role(created_date);

-- CommunityRoleDefinition
CREATE TABLE IF NOT EXISTS community_role_definition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  community_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#94a3b8',
  icon TEXT DEFAULT 'Shield',
  position DOUBLE PRECISION NOT NULL DEFAULT 100,
  permissions TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  is_protected BOOLEAN DEFAULT FALSE,
  mentionable BOOLEAN DEFAULT FALSE,
  hoisted BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  member_count DOUBLE PRECISION DEFAULT 0,
  created_by TEXT,
  created_by_name TEXT
);
CREATE INDEX IF NOT EXISTS idx_community_role_definition_community_id ON community_role_definition(community_id);
CREATE INDEX IF NOT EXISTS idx_community_role_definition_created_date ON community_role_definition(created_date);

-- CommunitySettings
CREATE TABLE IF NOT EXISTS community_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  community_id TEXT NOT NULL,
  features_enabled TEXT,
  dashboard_widgets TEXT,
  nav_config TEXT,
  join_mode TEXT DEFAULT 'invite' CHECK (join_mode IN ('open', 'invite', 'request', 'closed')),
  auto_approve BOOLEAN DEFAULT FALSE,
  invite_code TEXT,
  invite_expires TIMESTAMPTZ,
  invite_max_uses DOUBLE PRECISION DEFAULT 0,
  invite_uses DOUBLE PRECISION DEFAULT 0,
  marketplace_public BOOLEAN DEFAULT FALSE,
  quiet_hours_start TEXT,
  quiet_hours_end TEXT,
  forum_type TEXT DEFAULT 'none' CHECK (forum_type IN ('mybb', 'discourse', 'native', 'none')),
  forum_url TEXT,
  bridge_url TEXT,
  pushalert_segment TEXT,
  email_from_name TEXT,
  email_enabled BOOLEAN DEFAULT TRUE,
  tags TEXT,
  welcome_message TEXT,
  community_rules TEXT,
  default_rooms TEXT,
  default_member_role TEXT DEFAULT 'member' CHECK (default_member_role IN ('member', 'trusted_member', 'net_control', 'moderator')),
  net_schedule_defaults TEXT,
  website TEXT,
  social_links TEXT,
  contact_info TEXT
);
CREATE INDEX IF NOT EXISTS idx_community_settings_community_id ON community_settings(community_id);
CREATE INDEX IF NOT EXISTS idx_community_settings_created_date ON community_settings(created_date);

-- Conversation
CREATE TABLE IF NOT EXISTS conversation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  title TEXT,
  avatar_url TEXT,
  created_by TEXT NOT NULL,
  created_by_name TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  last_message_sender_name TEXT,
  last_message_sender_id TEXT,
  last_message_type TEXT DEFAULT 'text' CHECK (last_message_type IN ('text', 'image', 'file'))
);
CREATE INDEX IF NOT EXISTS idx_conversation_last_message_sender_id ON conversation(last_message_sender_id);
CREATE INDEX IF NOT EXISTS idx_conversation_created_date ON conversation(created_date);

-- ConversationParticipant
CREATE TABLE IF NOT EXISTS conversation_participant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  user_callsign TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ,
  last_read_at TIMESTAMPTZ,
  unread_count DOUBLE PRECISION DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  is_muted BOOLEAN DEFAULT FALSE,
  typing_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_conversation_participant_conversation_id ON conversation_participant(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participant_user_id ON conversation_participant(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participant_created_date ON conversation_participant(created_date);

-- DMMessage
CREATE TABLE IF NOT EXISTS dm_message (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  sender_avatar TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size DOUBLE PRECISION,
  reply_to_id TEXT,
  reply_to_content TEXT,
  reply_to_sender_name TEXT,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_dm_message_conversation_id ON dm_message(conversation_id);
CREATE INDEX IF NOT EXISTS idx_dm_message_sender_id ON dm_message(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_message_reply_to_id ON dm_message(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_dm_message_created_date ON dm_message(created_date);

-- DeviceToken
CREATE TABLE IF NOT EXISTS device_token (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  platform TEXT DEFAULT 'web' CHECK (platform IN ('web', 'android', 'ios')),
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_seen TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_device_token_user_id ON device_token(user_id);
CREATE INDEX IF NOT EXISTS idx_device_token_created_date ON device_token(created_date);

-- DirectMessage
CREATE TABLE IF NOT EXISTS direct_message (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  sender_id TEXT,
  receiver_id TEXT,
  sender_name TEXT,
  receiver_name TEXT,
  community_id TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_direct_message_sender_id ON direct_message(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_message_receiver_id ON direct_message(receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_message_community_id ON direct_message(community_id);
CREATE INDEX IF NOT EXISTS idx_direct_message_created_date ON direct_message(created_date);

-- Event
CREATE TABLE IF NOT EXISTS event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  event_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  created_by TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'delayed', 'active', 'ended')),
  delayed_until TIMESTAMPTZ,
  reminders_sent DOUBLE PRECISION DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  notification_sent BOOLEAN DEFAULT FALSE,
  community_id TEXT,
  community_name TEXT
);
CREATE INDEX IF NOT EXISTS idx_event_community_id ON event(community_id);
CREATE INDEX IF NOT EXISTS idx_event_created_date ON event(created_date);

-- FeatureFlag
CREATE TABLE IF NOT EXISTS feature_flag (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General',
  is_enabled BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_feature_flag_created_date ON feature_flag(created_date);

-- FollowedThread
CREATE TABLE IF NOT EXISTS followed_thread (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  user_id TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  thread_title TEXT,
  last_known_reply_count DOUBLE PRECISION DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_followed_thread_user_id ON followed_thread(user_id);
CREATE INDEX IF NOT EXISTS idx_followed_thread_thread_id ON followed_thread(thread_id);
CREATE INDEX IF NOT EXISTS idx_followed_thread_created_date ON followed_thread(created_date);

-- ForumCategory
CREATE TABLE IF NOT EXISTS forum_category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT 'violet',
  community_id TEXT,
  sort_order DOUBLE PRECISION DEFAULT 0,
  thread_count DOUBLE PRECISION DEFAULT 0,
  post_count DOUBLE PRECISION DEFAULT 0,
  is_restricted BOOLEAN DEFAULT FALSE,
  last_thread_id TEXT,
  last_thread_title TEXT,
  last_thread_author TEXT,
  last_reply_date TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_forum_category_community_id ON forum_category(community_id);
CREATE INDEX IF NOT EXISTS idx_forum_category_last_thread_id ON forum_category(last_thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_category_created_date ON forum_category(created_date);

-- ForumPost
CREATE TABLE IF NOT EXISTS forum_post (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  thread_id TEXT NOT NULL,
  thread_title TEXT,
  body TEXT NOT NULL,
  author_id TEXT,
  author_name TEXT,
  author_callsign TEXT,
  author_avatar TEXT,
  author_role TEXT,
  parent_post_id TEXT,
  reply_to_post_id TEXT,
  reply_to_author TEXT,
  quote_of_post_id TEXT,
  quote_of_author TEXT,
  quote_of_body TEXT,
  image_url TEXT,
  attachments TEXT,
  reactions TEXT,
  mentions TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  edit_history TEXT
);
CREATE INDEX IF NOT EXISTS idx_forum_post_thread_id ON forum_post(thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_author_id ON forum_post(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_parent_post_id ON forum_post(parent_post_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_reply_to_post_id ON forum_post(reply_to_post_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_quote_of_post_id ON forum_post(quote_of_post_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_created_date ON forum_post(created_date);

-- ForumSubscription
CREATE TABLE IF NOT EXISTS forum_subscription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  user_id TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  thread_title TEXT,
  category_name TEXT,
  is_subscribed BOOLEAN DEFAULT TRUE,
  is_muted BOOLEAN DEFAULT FALSE,
  is_bookmarked BOOLEAN DEFAULT FALSE,
  last_read_post_id TEXT,
  last_read_date TIMESTAMPTZ,
  unread_count DOUBLE PRECISION DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_forum_subscription_user_id ON forum_subscription(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_subscription_thread_id ON forum_subscription(thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_subscription_last_read_post_id ON forum_subscription(last_read_post_id);
CREATE INDEX IF NOT EXISTS idx_forum_subscription_created_date ON forum_subscription(created_date);

-- ForumThread
CREATE TABLE IF NOT EXISTS forum_thread (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  title TEXT NOT NULL,
  body TEXT,
  category_id TEXT NOT NULL,
  category_name TEXT,
  community_id TEXT,
  community_name TEXT,
  author_id TEXT,
  author_name TEXT,
  author_callsign TEXT,
  author_avatar TEXT,
  author_role TEXT,
  tags TEXT,
  image_url TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_announcement BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  reply_count DOUBLE PRECISION DEFAULT 0,
  view_count DOUBLE PRECISION DEFAULT 0,
  reaction_counts TEXT,
  last_reply_date TIMESTAMPTZ,
  last_reply_author TEXT,
  last_reply_author_id TEXT,
  last_reply_avatar TEXT,
  has_poll BOOLEAN DEFAULT FALSE,
  poll_data TEXT,
  subscribed_count DOUBLE PRECISION DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_forum_thread_category_id ON forum_thread(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_thread_community_id ON forum_thread(community_id);
CREATE INDEX IF NOT EXISTS idx_forum_thread_author_id ON forum_thread(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_thread_last_reply_author_id ON forum_thread(last_reply_author_id);
CREATE INDEX IF NOT EXISTS idx_forum_thread_created_date ON forum_thread(created_date);

-- GatheringPhoto
CREATE TABLE IF NOT EXISTS gathering_photo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  photo_url TEXT NOT NULL,
  caption TEXT,
  gathering_label TEXT,
  uploader_name TEXT,
  uploader_id TEXT,
  community_id TEXT,
  community_name TEXT
);
CREATE INDEX IF NOT EXISTS idx_gathering_photo_uploader_id ON gathering_photo(uploader_id);
CREATE INDEX IF NOT EXISTS idx_gathering_photo_community_id ON gathering_photo(community_id);
CREATE INDEX IF NOT EXISTS idx_gathering_photo_created_date ON gathering_photo(created_date);

-- Geofence
CREATE TABLE IF NOT EXISTS geofence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  community_id TEXT,
  community_name TEXT,
  shape TEXT NOT NULL CHECK (shape IN ('geojson', 'circle')),
  geo TEXT NOT NULL,
  color TEXT DEFAULT '#06B6D4',
  created_by TEXT,
  created_by_email TEXT
);
CREATE INDEX IF NOT EXISTS idx_geofence_community_id ON geofence(community_id);
CREATE INDEX IF NOT EXISTS idx_geofence_created_date ON geofence(created_date);

-- LightningAlertDelivery
CREATE TABLE IF NOT EXISTS lightning_alert_delivery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  strike_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  distance_miles DOUBLE PRECISION,
  strike_time TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_lightning_alert_delivery_strike_id ON lightning_alert_delivery(strike_id);
CREATE INDEX IF NOT EXISTS idx_lightning_alert_delivery_user_id ON lightning_alert_delivery(user_id);
CREATE INDEX IF NOT EXISTS idx_lightning_alert_delivery_created_date ON lightning_alert_delivery(created_date);

-- LightningAlertSettings
CREATE TABLE IF NOT EXISTS lightning_alert_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  user_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  radius_miles DOUBLE PRECISION DEFAULT 10,
  push_enabled BOOLEAN DEFAULT TRUE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  vibration_enabled BOOLEAN DEFAULT TRUE,
  auto_open_map BOOLEAN DEFAULT FALSE,
  last_alert_at TIMESTAMPTZ,
  recent_count DOUBLE PRECISION DEFAULT 0,
  recent_window_start TIMESTAMPTZ,
  recent_escalated DOUBLE PRECISION DEFAULT 0,
  updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_lightning_alert_settings_user_id ON lightning_alert_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_lightning_alert_settings_created_date ON lightning_alert_settings(created_date);

-- LightningProviderState
CREATE TABLE IF NOT EXISTS lightning_provider_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  provider TEXT NOT NULL,
  health TEXT DEFAULT 'unknown' CHECK (health IN ('ok', 'degraded', 'down', 'not_configured', 'unknown')),
  last_successful_update TIMESTAMPTZ,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  avg_response_time_ms DOUBLE PRECISION DEFAULT 0,
  total_strikes_today DOUBLE PRECISION DEFAULT 0,
  notifications_sent_today DOUBLE PRECISION DEFAULT 0,
  rate_limit_status TEXT,
  last_poll_at TIMESTAMPTZ,
  consecutive_failures DOUBLE PRECISION DEFAULT 0,
  stats_date TEXT
);
CREATE INDEX IF NOT EXISTS idx_lightning_provider_state_created_date ON lightning_provider_state(created_date);

-- LightningStrike
CREATE TABLE IF NOT EXISTS lightning_strike (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  strike_time TIMESTAMPTZ,
  provider TEXT DEFAULT 'mock',
  provider_strike_id TEXT,
  strike_type TEXT,
  intensity DOUBLE PRECISION,
  metadata TEXT,
  processed BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_lightning_strike_provider_strike_id ON lightning_strike(provider_strike_id);
CREATE INDEX IF NOT EXISTS idx_lightning_strike_created_date ON lightning_strike(created_date);

-- LocationShare
CREATE TABLE IF NOT EXISTS location_share (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  initiator_uid TEXT NOT NULL,
  initiator_username TEXT NOT NULL,
  initiator_avatar TEXT,
  community_id TEXT,
  initiator_lat DOUBLE PRECISION,
  initiator_lon DOUBLE PRECISION,
  target_uid TEXT NOT NULL,
  target_username TEXT NOT NULL,
  target_avatar TEXT,
  target_lat DOUBLE PRECISION,
  target_lon DOUBLE PRECISION,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'declined', 'ended')),
  expires_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_location_share_community_id ON location_share(community_id);
CREATE INDEX IF NOT EXISTS idx_location_share_created_date ON location_share(created_date);

-- MarketplaceItem
CREATE TABLE IF NOT EXISTS marketplace_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  price DOUBLE PRECISION NOT NULL,
  currency TEXT DEFAULT 'USD',
  image_url TEXT,
  source TEXT DEFAULT 'community' CHECK (source IN ('amazon', 'ebay', 'community', 'other')),
  source_url TEXT,
  seller_name TEXT NOT NULL,
  seller_id TEXT,
  category TEXT DEFAULT 'other' CHECK (category IN ('electronics', 'radio_gear', 'accessories', 'clothing', 'home', 'other')),
  condition TEXT DEFAULT 'good' CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'for_parts')),
  is_available BOOLEAN DEFAULT TRUE,
  views DOUBLE PRECISION DEFAULT 0,
  posted_date TIMESTAMPTZ,
  community_id TEXT,
  community_name TEXT
);
CREATE INDEX IF NOT EXISTS idx_marketplace_item_seller_id ON marketplace_item(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_item_community_id ON marketplace_item(community_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_item_created_date ON marketplace_item(created_date);

-- ModeratorNote
CREATE TABLE IF NOT EXISTS moderator_note (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  community_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  target_user_name TEXT,
  author_id TEXT NOT NULL,
  author_name TEXT,
  author_role TEXT,
  content TEXT NOT NULL,
  edited_at TIMESTAMPTZ,
  edited_by TEXT,
  edited_by_name TEXT
);
CREATE INDEX IF NOT EXISTS idx_moderator_note_community_id ON moderator_note(community_id);
CREATE INDEX IF NOT EXISTS idx_moderator_note_target_user_id ON moderator_note(target_user_id);
CREATE INDEX IF NOT EXISTS idx_moderator_note_author_id ON moderator_note(author_id);
CREATE INDEX IF NOT EXISTS idx_moderator_note_created_date ON moderator_note(created_date);

-- Net
CREATE TABLE IF NOT EXISTS net (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  schedule TEXT,
  schedule_type TEXT DEFAULT 'recurring' CHECK (schedule_type IN ('recurring', 'one_time')),
  days TEXT,
  time TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  day_of_week TEXT,
  start_date DATE,
  frequency DOUBLE PRECISION,
  offset TEXT,
  tone TEXT,
  repeater_callsign TEXT,
  net_control TEXT,
  primary_net_control TEXT,
  assistant_net_control TEXT,
  expected_duration_minutes DOUBLE PRECISION,
  auto_start BOOLEAN DEFAULT FALSE,
  auto_end BOOLEAN DEFAULT FALSE,
  allow_visitor_checkins BOOLEAN DEFAULT TRUE,
  require_callsign BOOLEAN DEFAULT TRUE,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'archived')),
  member_count DOUBLE PRECISION DEFAULT 0,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'emergency', 'technical', 'social', 'training')),
  is_favorite BOOLEAN DEFAULT FALSE,
  community_id TEXT,
  community_name TEXT,
  community_logo TEXT,
  created_by TEXT,
  created_by_name TEXT
);
CREATE INDEX IF NOT EXISTS idx_net_community_id ON net(community_id);
CREATE INDEX IF NOT EXISTS idx_net_created_date ON net(created_date);

-- NetCheckIn
CREATE TABLE IF NOT EXISTS net_check_in (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  net_id TEXT NOT NULL,
  net_name TEXT,
  user_id TEXT,
  callsign TEXT NOT NULL,
  location TEXT,
  signal_report TEXT,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_net_check_in_net_id ON net_check_in(net_id);
CREATE INDEX IF NOT EXISTS idx_net_check_in_user_id ON net_check_in(user_id);
CREATE INDEX IF NOT EXISTS idx_net_check_in_created_date ON net_check_in(created_date);

-- NetIncident
CREATE TABLE IF NOT EXISTS net_incident (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  session_id TEXT NOT NULL,
  net_id TEXT,
  category TEXT NOT NULL CHECK (category IN ('weather', 'emergency', 'priority', 'equipment_failure', 'repeater_offline', 'medical', 'general_note')),
  notes TEXT,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  operator TEXT,
  operator_id TEXT,
  timestamp TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_net_incident_session_id ON net_incident(session_id);
CREATE INDEX IF NOT EXISTS idx_net_incident_net_id ON net_incident(net_id);
CREATE INDEX IF NOT EXISTS idx_net_incident_operator_id ON net_incident(operator_id);
CREATE INDEX IF NOT EXISTS idx_net_incident_created_date ON net_incident(created_date);

-- NetLog
CREATE TABLE IF NOT EXISTS net_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  session_id TEXT NOT NULL,
  net_name TEXT,
  user_id TEXT,
  callsign TEXT NOT NULL,
  avatar TEXT,
  name TEXT,
  location TEXT,
  location_lat DOUBLE PRECISION,
  location_lon DOUBLE PRECISION,
  distance DOUBLE PRECISION,
  signal_report TEXT,
  notes TEXT,
  status TEXT DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'late', 'mobile', 'base', 'visitor', 'emergency', 'priority', 'monitoring', 'pending')),
  checkin_number DOUBLE PRECISION,
  checked_in_at TIMESTAMPTZ,
  is_guest BOOLEAN DEFAULT FALSE,
  approved BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_net_log_session_id ON net_log(session_id);
CREATE INDEX IF NOT EXISTS idx_net_log_user_id ON net_log(user_id);
CREATE INDEX IF NOT EXISTS idx_net_log_created_date ON net_log(created_date);

-- NetQueueEntry
CREATE TABLE IF NOT EXISTS net_queue_entry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  session_id TEXT NOT NULL,
  net_id TEXT,
  user_id TEXT,
  callsign TEXT NOT NULL,
  name TEXT,
  avatar TEXT,
  location TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'priority', 'emergency')),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'skipped', 'removed')),
  position DOUBLE PRECISION DEFAULT 0,
  requested_at TIMESTAMPTZ,
  called_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_net_queue_entry_session_id ON net_queue_entry(session_id);
CREATE INDEX IF NOT EXISTS idx_net_queue_entry_net_id ON net_queue_entry(net_id);
CREATE INDEX IF NOT EXISTS idx_net_queue_entry_user_id ON net_queue_entry(user_id);
CREATE INDEX IF NOT EXISTS idx_net_queue_entry_created_date ON net_queue_entry(created_date);

-- NetSession
CREATE TABLE IF NOT EXISTS net_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  net_id TEXT,
  net_name TEXT NOT NULL,
  net_type TEXT,
  frequency DOUBLE PRECISION,
  tone TEXT,
  repeater_callsign TEXT,
  repeater_lat DOUBLE PRECISION,
  repeater_lon DOUBLE PRECISION,
  net_control TEXT NOT NULL,
  net_control_uid TEXT,
  net_control_avatar TEXT,
  co_host TEXT,
  co_host_uid TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  paused_total DOUBLE PRECISION DEFAULT 0,
  checkin_count DOUBLE PRECISION DEFAULT 0,
  total_operators DOUBLE PRECISION DEFAULT 0,
  visitors DOUBLE PRECISION DEFAULT 0,
  late_checkins DOUBLE PRECISION DEFAULT 0,
  priority_count DOUBLE PRECISION DEFAULT 0,
  emergency_count DOUBLE PRECISION DEFAULT 0,
  report_generated BOOLEAN DEFAULT FALSE,
  forum_thread_id TEXT,
  notes TEXT,
  community_id TEXT,
  community_name TEXT
);
CREATE INDEX IF NOT EXISTS idx_net_session_net_id ON net_session(net_id);
CREATE INDEX IF NOT EXISTS idx_net_session_forum_thread_id ON net_session(forum_thread_id);
CREATE INDEX IF NOT EXISTS idx_net_session_community_id ON net_session(community_id);
CREATE INDEX IF NOT EXISTS idx_net_session_created_date ON net_session(created_date);

-- NetTemplate
CREATE TABLE IF NOT EXISTS net_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'emergency', 'technical', 'social', 'training')),
  frequency DOUBLE PRECISION,
  repeater_callsign TEXT,
  default_net_control TEXT,
  schedule TEXT,
  time TEXT,
  day_of_week TEXT,
  recurrence_rule TEXT,
  community_id TEXT,
  community_name TEXT,
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_net_template_community_id ON net_template(community_id);
CREATE INDEX IF NOT EXISTS idx_net_template_created_date ON net_template(created_date);

-- NetTimeline
CREATE TABLE IF NOT EXISTS net_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  session_id TEXT NOT NULL,
  net_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('net_started', 'net_paused', 'net_resumed', 'net_closed', 'checkin', 'priority', 'emergency', 'weather_alert', 'note', 'member_joined')),
  message TEXT,
  actor_name TEXT,
  actor_avatar TEXT,
  actor_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_net_timeline_session_id ON net_timeline(session_id);
CREATE INDEX IF NOT EXISTS idx_net_timeline_net_id ON net_timeline(net_id);
CREATE INDEX IF NOT EXISTS idx_net_timeline_actor_id ON net_timeline(actor_id);
CREATE INDEX IF NOT EXISTS idx_net_timeline_created_date ON net_timeline(created_date);

-- Notification
CREATE TABLE IF NOT EXISTS notification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  recipient_id TEXT NOT NULL,
  recipient_name TEXT,
  sender_id TEXT,
  sender_name TEXT,
  type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('direct_message', 'community_chat', 'community_announcement', 'friend_request', 'user_mention', 'net_starting', 'net_ended', 'emergency_alert', 'badge_earned', 'community_invite', 'system', 'mission_control', 'radioscope_nearby', 'weather_alert', 'ai_assistant', 'event_reminder', 'forum_reply', 'news', 'repeater_added', 'achievement_unlocked')),
  title TEXT,
  message TEXT,
  image_url TEXT,
  related_object_id TEXT,
  related_object_type TEXT,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  community_id TEXT,
  link TEXT,
  metadata TEXT
);
CREATE INDEX IF NOT EXISTS idx_notification_recipient_id ON notification(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_sender_id ON notification(sender_id);
CREATE INDEX IF NOT EXISTS idx_notification_related_object_id ON notification(related_object_id);
CREATE INDEX IF NOT EXISTS idx_notification_community_id ON notification(community_id);
CREATE INDEX IF NOT EXISTS idx_notification_created_date ON notification(created_date);

-- NotificationDelivery
CREATE TABLE IF NOT EXISTS notification_delivery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  notification_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  type TEXT,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'failed', 'expired')),
  attempts DOUBLE PRECISION DEFAULT 0,
  max_attempts DOUBLE PRECISION DEFAULT 5,
  next_retry_at TIMESTAMPTZ,
  last_error TEXT,
  last_error_code TEXT,
  token_count DOUBLE PRECISION DEFAULT 0,
  token_preview TEXT,
  fcm_message_id TEXT,
  platforms TEXT,
  app_version TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_notification_id ON notification_delivery(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_recipient_id ON notification_delivery(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_fcm_message_id ON notification_delivery(fcm_message_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_created_date ON notification_delivery(created_date);

-- NotificationPreferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  user_id TEXT NOT NULL,
  prefs TEXT,
  quiet_hours_start TEXT,
  quiet_hours_end TEXT,
  quiet_hours_timezone TEXT DEFAULT 'America/New_York',
  emergency_sound BOOLEAN DEFAULT TRUE,
  emergency_vibration BOOLEAN DEFAULT TRUE,
  allow_marketing BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_created_date ON notification_preferences(created_date);

-- PlatformAuditLog
CREATE TABLE IF NOT EXISTS platform_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  admin_id TEXT NOT NULL,
  admin_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  target_name TEXT,
  community_id TEXT,
  community_name TEXT,
  previous_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_platform_audit_log_admin_id ON platform_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_log_target_id ON platform_audit_log(target_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_log_community_id ON platform_audit_log(community_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_log_created_date ON platform_audit_log(created_date);

-- PlatformRole
CREATE TABLE IF NOT EXISTS platform_role (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('platform_owner', 'platform_admin', 'platform_support')),
  assigned_by TEXT,
  assigned_by_email TEXT,
  is_active BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_platform_role_user_id ON platform_role(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_role_created_date ON platform_role(created_date);

-- PremiumBadge
CREATE TABLE IF NOT EXISTS premium_badge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  price DOUBLE PRECISION DEFAULT 0,
  icon TEXT DEFAULT 'Award',
  artwork_url TEXT,
  rarity TEXT NOT NULL DEFAULT 'member' CHECK (rarity IN ('member', 'supporter', 'community', 'rare', 'epic', 'elite', 'mythic', 'legendary', 'administration')),
  effect TEXT NOT NULL DEFAULT 'static_glow' CHECK (effect IN ('static_glow', 'electric_aura', 'purple_lightning', 'blue_plasma', 'gold_energy_pulse', 'green_radar_sweep', 'fire_ember', 'ice_frost', 'rainbow_prism', 'thunder_storm', 'neon_pulse', 'electric_sparks', 'fire_aura', 'ice_crystal', 'shadow_mist', 'galaxy_swirl', 'cosmic_dust', 'orbit_rings', 'meteor_trail')),
  accent_color TEXT DEFAULT '#a855f7',
  display_priority DOUBLE PRECISION DEFAULT 0,
  is_enabled BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_best_value BOOLEAN DEFAULT FALSE,
  is_seasonal BOOLEAN DEFAULT FALSE,
  season_start DATE,
  season_end DATE,
  is_founder BOOLEAN DEFAULT FALSE,
  is_event BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  release_date DATE,
  expiration_date DATE,
  edition_size DOUBLE PRECISION DEFAULT 0,
  purchase_limit DOUBLE PRECISION DEFAULT 0,
  purchases_count DOUBLE PRECISION DEFAULT 0,
  is_gifted BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_premium_badge_created_date ON premium_badge(created_date);

-- PremiumBadgeOwnership
CREATE TABLE IF NOT EXISTS premium_badge_ownership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT,
  badge_id TEXT NOT NULL,
  badge_name TEXT,
  badge_icon TEXT,
  badge_artwork_url TEXT,
  badge_effect TEXT,
  badge_accent_color TEXT,
  badge_rarity TEXT,
  badge_edition_size DOUBLE PRECISION,
  edition_number DOUBLE PRECISION,
  is_active BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_gift BOOLEAN DEFAULT FALSE,
  gifted_by TEXT,
  gifted_by_name TEXT,
  gift_message TEXT,
  is_anonymous_gift BOOLEAN DEFAULT FALSE,
  scheduled_delivery_at TIMESTAMPTZ,
  is_earned BOOLEAN DEFAULT FALSE,
  is_upgrade BOOLEAN DEFAULT FALSE,
  purchased_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  stripe_checkout_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_premium_badge_ownership_user_id ON premium_badge_ownership(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_badge_ownership_badge_id ON premium_badge_ownership(badge_id);
CREATE INDEX IF NOT EXISTS idx_premium_badge_ownership_stripe_checkout_id ON premium_badge_ownership(stripe_checkout_id);
CREATE INDEX IF NOT EXISTS idx_premium_badge_ownership_created_date ON premium_badge_ownership(created_date);

-- RadioFile
CREATE TABLE IF NOT EXISTS radio_file (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  uploader_id TEXT,
  uploader_name TEXT,
  radio_model_id TEXT NOT NULL,
  manufacturer_name TEXT,
  model_name TEXT,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size DOUBLE PRECISION,
  description TEXT,
  notes TEXT,
  version TEXT DEFAULT '1.0',
  versions TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  hidden BOOLEAN DEFAULT FALSE,
  deleted BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  community BOOLEAN DEFAULT FALSE,
  download_count DOUBLE PRECISION DEFAULT 0,
  tags TEXT
);
CREATE INDEX IF NOT EXISTS idx_radio_file_uploader_id ON radio_file(uploader_id);
CREATE INDEX IF NOT EXISTS idx_radio_file_radio_model_id ON radio_file(radio_model_id);
CREATE INDEX IF NOT EXISTS idx_radio_file_created_date ON radio_file(created_date);

-- RadioManufacturer
CREATE TABLE IF NOT EXISTS radio_manufacturer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  name TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_radio_manufacturer_created_date ON radio_manufacturer(created_date);

-- RadioModel
CREATE TABLE IF NOT EXISTS radio_model (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  manufacturer_id TEXT NOT NULL,
  manufacturer_name TEXT,
  model_name TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_radio_model_manufacturer_id ON radio_model(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_radio_model_created_date ON radio_model(created_date);

-- RbacAuditLog
CREATE TABLE IF NOT EXISTS rbac_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  admin_id TEXT NOT NULL,
  admin_email TEXT,
  action TEXT NOT NULL CHECK (action IN ('role_create', 'role_update', 'role_delete', 'role_clone', 'user_assign', 'user_unassign', 'user_bulk_assign', 'permission_denied', 'role_migration')),
  target_user_id TEXT,
  target_user_email TEXT,
  role_id TEXT,
  role_name TEXT,
  endpoint TEXT,
  permission_required TEXT,
  permission_granted TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_permissions TEXT,
  reason TEXT,
  ip_address TEXT
);
CREATE INDEX IF NOT EXISTS idx_rbac_audit_log_admin_id ON rbac_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_rbac_audit_log_target_user_id ON rbac_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_rbac_audit_log_role_id ON rbac_audit_log(role_id);
CREATE INDEX IF NOT EXISTS idx_rbac_audit_log_created_date ON rbac_audit_log(created_date);

-- Repeater
CREATE TABLE IF NOT EXISTS repeater (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  callsign TEXT NOT NULL,
  frequency DOUBLE PRECISION NOT NULL,
  offset TEXT,
  tone TEXT,
  band TEXT DEFAULT 'GMRS' CHECK (band IN ('GMRS', 'Ham', 'Business', 'Public Safety', 'Other')),
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'offline', 'busy')),
  owner_callsign TEXT,
  description TEXT,
  image_url TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  community_id TEXT,
  community_name TEXT,
  coverage_radius DOUBLE PRECISION,
  coverage_color TEXT DEFAULT '#8B5CF6',
  coverage_opacity DOUBLE PRECISION DEFAULT 0.18,
  coverage_visible BOOLEAN DEFAULT TRUE,
  height_m DOUBLE PRECISION,
  erp_watts DOUBLE PRECISION,
  antenna_type TEXT
);
CREATE INDEX IF NOT EXISTS idx_repeater_community_id ON repeater(community_id);
CREATE INDEX IF NOT EXISTS idx_repeater_created_date ON repeater(created_date);

-- Report
CREATE TABLE IF NOT EXISTS report (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  reporter_id TEXT NOT NULL,
  reporter_name TEXT,
  reporter_email TEXT,
  target_type TEXT NOT NULL DEFAULT 'thread' CHECK (target_type IN ('thread', 'post', 'chat_message', 'dm', 'member', 'community', 'repeater', 'marketplace', 'gallery', 'other')),
  target_id TEXT NOT NULL,
  target_name TEXT,
  target_owner_id TEXT,
  target_owner_name TEXT,
  community_id TEXT,
  community_name TEXT,
  reason TEXT NOT NULL DEFAULT 'spam' CHECK (reason IN ('spam', 'harassment', 'offensive', 'misinformation', 'illegal', 'safety', 'other')),
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolution TEXT DEFAULT 'none' CHECK (resolution IN ('none', 'warned', 'removed', 'banned', 'no_action')),
  resolved_by TEXT,
  resolved_by_email TEXT,
  resolved_at TIMESTAMPTZ,
  admin_notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_report_reporter_id ON report(reporter_id);
CREATE INDEX IF NOT EXISTS idx_report_target_id ON report(target_id);
CREATE INDEX IF NOT EXISTS idx_report_target_owner_id ON report(target_owner_id);
CREATE INDEX IF NOT EXISTS idx_report_community_id ON report(community_id);
CREATE INDEX IF NOT EXISTS idx_report_created_date ON report(created_date);

-- Role
CREATE TABLE IF NOT EXISTS role (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  priority DOUBLE PRECISION DEFAULT 100,
  is_system BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  parent_role_id TEXT,
  permissions TEXT,
  denied_permissions TEXT,
  badge_config TEXT,
  member_count DOUBLE PRECISION DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_role_parent_role_id ON role(parent_role_id);
CREATE INDEX IF NOT EXISTS idx_role_created_date ON role(created_date);

-- User
CREATE TABLE IF NOT EXISTS user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  callsign TEXT,
  license_status TEXT DEFAULT 'UNLICENSED' CHECK (license_status IN ('LICENSED', 'UNLICENSED', 'PENDING_VERIFICATION')),
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  location TEXT,
  location_lat DOUBLE PRECISION,
  location_lon DOUBLE PRECISION,
  bio TEXT,
  about_me TEXT,
  website TEXT,
  social_links TEXT,
  occupation TEXT,
  interests TEXT,
  radios JSONB,
  reputation DOUBLE PRECISION DEFAULT 0,
  badges DOUBLE PRECISION DEFAULT 0,
  forum_count DOUBLE PRECISION DEFAULT 0,
  mybb_username TEXT,
  push_alerts BOOLEAN DEFAULT TRUE,
  notification_preferences TEXT,
  notif_settings TEXT,
  privacy_settings TEXT,
  radio_profile TEXT,
  security_settings TEXT,
  language TEXT,
  timezone TEXT,
  date_format TEXT,
  notif_sound TEXT,
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'deactivated')),
  account_deletion_requested BOOLEAN DEFAULT FALSE,
  last_active TIMESTAMPTZ,
  is_platform_suspended BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  is_muted BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_user_created_date ON user(created_date);

-- UserAchievement
CREATE TABLE IF NOT EXISTS user_achievement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT,
  achievement_id TEXT NOT NULL,
  achievement_name TEXT,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic', 'founder', 'seasonal', 'club_exclusive', 'national_event', 'developer')),
  collection TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  pin_order DOUBLE PRECISION DEFAULT 0,
  unlocked_date TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_user_achievement_user_id ON user_achievement(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievement_achievement_id ON user_achievement(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievement_created_date ON user_achievement(created_date);

-- UserPresence
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'offline')),
  last_active TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_created_date ON user_presence(created_date);

-- UserRadio
CREATE TABLE IF NOT EXISTS user_radio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT,
  radio_model_id TEXT NOT NULL,
  manufacturer_name TEXT,
  model_name TEXT,
  nickname TEXT,
  description TEXT
);
CREATE INDEX IF NOT EXISTS idx_user_radio_user_id ON user_radio(user_id);
CREATE INDEX IF NOT EXISTS idx_user_radio_radio_model_id ON user_radio(radio_model_id);
CREATE INDEX IF NOT EXISTS idx_user_radio_created_date ON user_radio(created_date);

-- UserRole
CREATE TABLE IF NOT EXISTS user_role (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  user_id TEXT NOT NULL,
  user_email TEXT,
  scope TEXT DEFAULT 'platform' CHECK (scope IN ('platform', 'community')),
  community_id TEXT,
  role_id TEXT,
  role_name TEXT,
  role_slug TEXT NOT NULL,
  assigned_by TEXT,
  assigned_by_email TEXT,
  assigned_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_user_role_user_id ON user_role(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_community_id ON user_role(community_id);
CREATE INDEX IF NOT EXISTS idx_user_role_role_id ON user_role(role_id);
CREATE INDEX IF NOT EXISTS idx_user_role_created_date ON user_role(created_date);

-- UserStats
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_callsign TEXT,
  user_avatar TEXT,
  user_location TEXT,
  net_checkins DOUBLE PRECISION DEFAULT 0,
  net_control_sessions DOUBLE PRECISION DEFAULT 0,
  repeaters_visited DOUBLE PRECISION DEFAULT 0,
  states_operated DOUBLE PRECISION DEFAULT 0,
  counties_visited DOUBLE PRECISION DEFAULT 0,
  miles_traveled DOUBLE PRECISION DEFAULT 0,
  hours_on_nets DOUBLE PRECISION DEFAULT 0,
  forum_posts DOUBLE PRECISION DEFAULT 0,
  helpful_answers DOUBLE PRECISION DEFAULT 0,
  photos_uploaded DOUBLE PRECISION DEFAULT 0,
  events_attended DOUBLE PRECISION DEFAULT 0,
  volunteer_hours DOUBLE PRECISION DEFAULT 0,
  emergency_activations DOUBLE PRECISION DEFAULT 0,
  club_events_hosted DOUBLE PRECISION DEFAULT 0,
  repeaters_managed DOUBLE PRECISION DEFAULT 0,
  friends DOUBLE PRECISION DEFAULT 0,
  reputation DOUBLE PRECISION DEFAULT 0,
  years_active DOUBLE PRECISION DEFAULT 0,
  xp DOUBLE PRECISION DEFAULT 0,
  level DOUBLE PRECISION DEFAULT 1,
  achievement_score DOUBLE PRECISION DEFAULT 0,
  achievements_count DOUBLE PRECISION DEFAULT 0,
  daily_login_streak DOUBLE PRECISION DEFAULT 0,
  longest_login_streak DOUBLE PRECISION DEFAULT 0,
  weekly_net_streak DOUBLE PRECISION DEFAULT 0,
  monthly_club_streak DOUBLE PRECISION DEFAULT 0,
  travel_streak DOUBLE PRECISION DEFAULT 0,
  volunteer_streak DOUBLE PRECISION DEFAULT 0,
  last_login_date DATE,
  gmrs_license TEXT,
  ham_license_class TEXT DEFAULT '' CHECK (ham_license_class IN ('', 'technician', 'general', 'amateur_extra')),
  club_membership TEXT,
  favorite_repeater TEXT,
  current_status TEXT DEFAULT 'online'
);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_created_date ON user_stats(created_date);
