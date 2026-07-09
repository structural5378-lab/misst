-- ============================================================================
-- MIST PLATFORM — PRODUCTION POSTGRESQL SCHEMA
-- Version: 1.0.0
-- Date: 2026-07-09
-- Target: 100,000+ users
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'member', 'guest');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted', 'unverified');
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');
CREATE TYPE group_role AS ENUM ('founder', 'admin', 'moderator', 'member');
CREATE TYPE group_visibility AS ENUM ('public', 'private', 'invite_only');
CREATE TYPE message_type AS ENUM ('text', 'image', 'system', 'voice');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read', 'failed');
CREATE TYPE channel_type AS ENUM ('general', 'announcement', 'emergency', 'net_control', 'trading');
CREATE TYPE repeater_status AS ENUM ('online', 'offline', 'busy', 'maintenance');
CREATE TYPE weather_alert_severity AS ENUM ('advisory', 'watch', 'warning', 'emergency');
CREATE TYPE event_status AS ENUM ('upcoming', 'active', 'delayed', 'ended', 'cancelled');
CREATE TYPE rsvp_status AS ENUM ('attending', 'maybe', 'declined');
CREATE TYPE notification_type AS ENUM ('chat', 'forum', 'event', 'alert', 'system', 'friend_request', 'location', 'mention');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'permission_change', 'role_change', 'export', 'import');
CREATE TYPE photo_type AS ENUM ('gallery', 'event', 'profile', 'message', 'repeater');
CREATE TYPE forum_link_type AS ENUM ('mybb_thread', 'mybb_post', 'external');

-- ============================================================================
-- 1. USERS
-- ============================================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    callsign        VARCHAR(50) UNIQUE,
    role            user_role NOT NULL DEFAULT 'member',
    status          user_status NOT NULL DEFAULT 'unverified',
    avatar_url      TEXT,
    community_id    UUID,
    last_login_at   TIMESTAMPTZ,
    last_active_at  TIMESTAMPTZ,
    failed_logins   INT NOT NULL DEFAULT 0,
    locked_until    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. PROFILES
-- ============================================================================

CREATE TABLE profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio             TEXT,
    location        VARCHAR(255),
    license_id      VARCHAR(50),
    license_class   VARCHAR(20),
    latitude        DECIMAL(10, 7),
    longitude       DECIMAL(10, 7),
    geo_point       GEOGRAPHY(POINT, 4326),  -- PostGIS for geo queries
    radio_gear      JSONB DEFAULT '[]'::jsonb,
    social_links    JSONB DEFAULT '{}'::jsonb,
    website_url     TEXT,
    youtube_url     TEXT,
    is_public       BOOLEAN NOT NULL DEFAULT TRUE,
    show_location   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. FRIENDSHIPS
-- ============================================================================

CREATE TABLE friendships (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          friendship_status NOT NULL DEFAULT 'pending',
    requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (requester_id, addressee_id),
    CHECK (requester_id != addressee_id)
);

-- ============================================================================
-- 4. GROUPS
-- ============================================================================

CREATE TABLE groups (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    callsign        VARCHAR(50) UNIQUE,
    description     TEXT,
    logo_url        TEXT,
    primary_color   VARCHAR(7) DEFAULT '#8B5CF6',
    founder_id      UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    founder_name    VARCHAR(100),
    visibility      group_visibility NOT NULL DEFAULT 'public',
    member_count    INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE group_members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id        UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            group_role NOT NULL DEFAULT 'member',
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (group_id, user_id)
);

CREATE TABLE group_invites (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id        UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    inviter_id      UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    invitee_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            group_role NOT NULL DEFAULT 'member',
    status          friendship_status NOT NULL DEFAULT 'pending',
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at    TIMESTAMPTZ
);

-- ============================================================================
-- 5. CHANNELS
-- ============================================================================

CREATE TABLE channels (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id        UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    type            channel_type NOT NULL DEFAULT 'general',
    description     TEXT,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    member_count    INT NOT NULL DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (group_id, name)
);

CREATE TABLE channel_members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id      UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_muted        BOOLEAN NOT NULL DEFAULT FALSE,
    is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
    last_read_at    TIMESTAMPTZ,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (channel_id, user_id)
);

-- ============================================================================
-- 6. MESSAGES
-- ============================================================================

CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id      UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    sender_name     VARCHAR(100),
    sender_avatar   TEXT,
    type            message_type NOT NULL DEFAULT 'text',
    content         TEXT,
    image_url       TEXT,
    reply_to_id    UUID REFERENCES messages(id) ON DELETE SET NULL,
    status          message_status NOT NULL DEFAULT 'sent',
    edited_at       TIMESTAMPTZ,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE message_reactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji           VARCHAR(10) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (message_id, user_id, emoji)
);

CREATE TABLE message_read_receipts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (message_id, user_id)
);

-- ============================================================================
-- 7. REPEATERS
-- ============================================================================

CREATE TABLE repeaters (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    callsign        VARCHAR(50) NOT NULL,
    frequency       DECIMAL(8, 4) NOT NULL,
    offset          VARCHAR(20),
    tone            VARCHAR(20),
    location        VARCHAR(255),
    latitude        DECIMAL(10, 7),
    longitude       DECIMAL(10, 7),
    geo_point       GEOGRAPHY(POINT, 4326),
    status          repeater_status NOT NULL DEFAULT 'online',
    owner_callsign  VARCHAR(50),
    owner_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    description     TEXT,
    image_url       TEXT,
    band            VARCHAR(10) DEFAULT 'uhf',
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE repeater_favorites (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repeater_id     UUID NOT NULL REFERENCES repeaters(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (repeater_id, user_id)
);

-- ============================================================================
-- 8. WEATHER ALERTS
-- ============================================================================

CREATE TABLE weather_alerts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source          VARCHAR(50) NOT NULL DEFAULT 'noaa',
    external_id     VARCHAR(100),
    title           VARCHAR(255) NOT NULL,
    message         TEXT NOT NULL,
    severity        weather_alert_severity NOT NULL DEFAULT 'advisory',
    alert_type      VARCHAR(50),
    affected_areas  JSONB DEFAULT '[]'::jsonb,
    latitude        DECIMAL(10, 7),
    longitude       DECIMAL(10, 7),
    geo_point       GEOGRAPHY(POINT, 4326),
    starts_at       TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (source, external_id)
);

CREATE TABLE weather_alert_acknowledgments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id        UUID NOT NULL REFERENCES weather_alerts(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (alert_id, user_id)
);

-- ============================================================================
-- 9. EVENTS
-- ============================================================================

CREATE TABLE events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id        UUID REFERENCES groups(id) ON DELETE SET NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    event_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ,
    location        VARCHAR(255),
    latitude        DECIMAL(10, 7),
    longitude       DECIMAL(10, 7),
    geo_point       GEOGRAPHY(POINT, 4326),
    status          event_status NOT NULL DEFAULT 'upcoming',
    delayed_until   TIMESTAMPTZ,
    created_by      UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    rsvp_count      INT NOT NULL DEFAULT 0,
    reminder_sent   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE event_rsvps (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          rsvp_status NOT NULL DEFAULT 'attending',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, user_id)
);

-- ============================================================================
-- 10. PHOTOS
-- ============================================================================

CREATE TABLE photos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id     UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    uploader_name   VARCHAR(100),
    photo_url       TEXT NOT NULL,
    thumbnail_url   TEXT,
    caption         TEXT,
    photo_type      photo_type NOT NULL DEFAULT 'gallery',
    group_id        UUID REFERENCES groups(id) ON DELETE SET NULL,
    event_id        UUID REFERENCES events(id) ON DELETE SET NULL,
    width           INT,
    height          INT,
    file_size       BIGINT,
    mime_type       VARCHAR(50),
    view_count      INT NOT NULL DEFAULT 0,
    is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 11. COMMENTS
-- ============================================================================

CREATE TABLE comments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photo_id        UUID REFERENCES photos(id) ON DELETE CASCADE,
    event_id        UUID REFERENCES events(id) ON DELETE CASCADE,
    repeater_id     UUID REFERENCES repeaters(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    author_name     VARCHAR(100),
    author_avatar   TEXT,
    body            TEXT NOT NULL,
    parent_id       UUID REFERENCES comments(id) ON DELETE CASCADE,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (photo_id IS NOT NULL)::int +
        (event_id IS NOT NULL)::int +
        (repeater_id IS NOT NULL)::int = 1
    )
);

-- ============================================================================
-- 12. LIKES
-- ============================================================================

CREATE TABLE likes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_id        UUID REFERENCES photos(id) ON DELETE CASCADE,
    comment_id      UUID REFERENCES comments(id) ON DELETE CASCADE,
    event_id        UUID REFERENCES events(id) ON DELETE CASCADE,
    message_id      UUID REFERENCES messages(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (photo_id IS NOT NULL)::int +
        (comment_id IS NOT NULL)::int +
        (event_id IS NOT NULL)::int +
        (message_id IS NOT NULL)::int = 1
    ),
    UNIQUE (user_id, photo_id),
    UNIQUE (user_id, comment_id),
    UNIQUE (user_id, event_id),
    UNIQUE (user_id, message_id)
);

-- ============================================================================
-- 13. FORUM LINKS
-- ============================================================================

CREATE TABLE forum_links (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    link_type       forum_link_type NOT NULL,
    external_id     VARCHAR(100) NOT NULL,
    external_url    TEXT NOT NULL,
    title           VARCHAR(255) NOT NULL,
    category_name   VARCHAR(100),
    author_name     VARCHAR(100),
    author_callsign VARCHAR(50),
    reply_count     INT DEFAULT 0,
    view_count      INT DEFAULT 0,
    is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
    last_reply_at   TIMESTAMPTZ,
    group_id        UUID REFERENCES groups(id) ON DELETE SET NULL,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (link_type, external_id)
);

CREATE TABLE forum_follows (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    forum_link_id   UUID NOT NULL REFERENCES forum_links(id) ON DELETE CASCADE,
    last_known_replies INT DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, forum_link_id)
);

-- ============================================================================
-- 14. NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            notification_type NOT NULL,
    title           VARCHAR(255) NOT NULL,
    message         TEXT,
    link            TEXT,
    metadata        JSONB DEFAULT '{}'::jsonb,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_preferences (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    chat_messages       BOOLEAN NOT NULL DEFAULT TRUE,
    forum_replies       BOOLEAN NOT NULL DEFAULT TRUE,
    event_reminders     BOOLEAN NOT NULL DEFAULT TRUE,
    emergency_alerts    BOOLEAN NOT NULL DEFAULT TRUE,
    location_requests   BOOLEAN NOT NULL DEFAULT TRUE,
    friend_requests     BOOLEAN NOT NULL DEFAULT TRUE,
    mentions            BOOLEAN NOT NULL DEFAULT TRUE,
    quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    quiet_hours_start   TIME,
    quiet_hours_end     TIME,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE device_tokens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token           VARCHAR(255) NOT NULL,
    platform        VARCHAR(20) NOT NULL,
    device_name     VARCHAR(100),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, token)
);

-- ============================================================================
-- 15. PERMISSIONS
-- ============================================================================

CREATE TABLE permissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    module          VARCHAR(50) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE role_permissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role            user_role NOT NULL,
    permission_id   UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (role, permission_id)
);

-- ============================================================================
-- 16. ROLES
-- ============================================================================

-- Roles are managed via the user_role enum on the users table.
-- This table stores role metadata and descriptions for documentation/admin UI.

CREATE TABLE roles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            user_role NOT NULL UNIQUE,
    display_name    VARCHAR(50) NOT NULL,
    description     TEXT,
    priority        INT NOT NULL DEFAULT 0,
    is_system       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 17. AUDIT LOGS
-- ============================================================================

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_name      VARCHAR(100),
    action          audit_action NOT NULL,
    module          VARCHAR(50) NOT NULL,
    target_type     VARCHAR(50),
    target_id       UUID,
    target_name     VARCHAR(255),
    changes         JSONB,
    ip_address      INET,
    user_agent      TEXT,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 18. SESSIONS
-- ============================================================================

CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token   VARCHAR(500) NOT NULL UNIQUE,
    ip_address      INET,
    user_agent      TEXT,
    device_name     VARCHAR(100),
    is_revoked      BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at      TIMESTAMPTZ NOT NULL,
    last_used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 19. API TOKENS
-- ============================================================================

CREATE TABLE api_tokens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    token_hash      VARCHAR(255) NOT NULL UNIQUE,
    scopes          JSONB DEFAULT '[]'::jsonb,
    last_used_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    is_revoked      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES — OPTIMIZED FOR LARGE DATASETS
-- ============================================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_callsign ON users(callsign) WHERE callsign IS NOT NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_community ON users(community_id);
CREATE INDEX idx_users_last_active ON users(last_active_at DESC);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Profiles
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_geo ON profiles USING GIST (geo_point) WHERE geo_point IS NOT NULL;
CREATE INDEX idx_profiles_license ON profiles(license_id) WHERE license_id IS NOT NULL;
CREATE INDEX idx_profiles_public ON profiles(is_public) WHERE is_public = TRUE;

-- Friendships
CREATE INDEX idx_friendships_requester ON friendships(requester_id, status);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id, status);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_friendships_accepted ON friendships(requester_id, addressee_id) WHERE status = 'accepted';

-- Groups
CREATE INDEX idx_groups_name ON groups(name);
CREATE INDEX idx_groups_callsign ON groups(callsign);
CREATE INDEX idx_groups_founder ON groups(founder_id);
CREATE INDEX idx_groups_visibility ON groups(visibility);
CREATE INDEX idx_groups_active ON groups(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_groups_member_count ON groups(member_count DESC);

-- Group Members
CREATE INDEX idx_group_members_group ON group_members(group_id, is_active);
CREATE INDEX idx_group_members_user ON group_members(user_id, is_active);
CREATE INDEX idx_group_members_role ON group_members(group_id, role);

-- Group Invites
CREATE INDEX idx_group_invites_group ON group_invites(group_id, status);
CREATE INDEX idx_group_invites_invitee ON group_invites(invitee_id, status);
CREATE INDEX idx_group_invites_expires ON group_invites(expires_at) WHERE status = 'pending';

-- Channels
CREATE INDEX idx_channels_group ON channels(group_id);
CREATE INDEX idx_channels_type ON channels(type);
CREATE INDEX idx_channels_last_message ON channels(last_message_at DESC);
CREATE INDEX idx_channels_active ON channels(group_id, is_archived) WHERE is_archived = FALSE;

-- Channel Members
CREATE INDEX idx_channel_members_channel ON channel_members(channel_id);
CREATE INDEX idx_channel_members_user ON channel_members(user_id);
CREATE INDEX idx_channel_members_last_read ON channel_members(user_id, last_read_at);

-- Messages (most critical for performance at scale)
CREATE INDEX idx_messages_channel_created ON messages(channel_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at DESC);
CREATE INDEX idx_messages_reply_to ON messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX idx_messages_status ON messages(status) WHERE status != 'read';
CREATE INDEX idx_messages_type ON messages(channel_id, type);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
-- Partial index for non-deleted messages (most queries skip deleted)
CREATE INDEX idx_messages_active ON messages(channel_id, created_at DESC) WHERE deleted_at IS NULL;

-- Message Reactions
CREATE INDEX idx_reactions_message ON message_reactions(message_id);
CREATE INDEX idx_reactions_user ON message_reactions(user_id);
CREATE INDEX idx_reactions_emoji ON message_reactions(message_id, emoji);

-- Message Read Receipts
CREATE INDEX idx_read_receipts_message ON message_read_receipts(message_id);
CREATE INDEX idx_read_receipts_user ON message_read_receipts(user_id, read_at);

-- Repeaters
CREATE INDEX idx_repeaters_callsign ON repeaters(callsign);
CREATE INDEX idx_repeaters_frequency ON repeaters(frequency);
CREATE INDEX idx_repeaters_status ON repeaters(status);
CREATE INDEX idx_repeaters_band ON repeaters(band);
CREATE INDEX idx_repeaters_geo ON repeaters USING GIST (geo_point) WHERE geo_point IS NOT NULL;
CREATE INDEX idx_repeaters_location ON repeaters(location);
CREATE INDEX idx_repeaters_owner ON repeaters(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX idx_repeaters_verified ON repeaters(is_verified) WHERE is_verified = TRUE;

-- Repeater Favorites
CREATE INDEX idx_repeater_fav_user ON repeater_favorites(user_id);
CREATE INDEX idx_repeater_fav_repeater ON repeater_favorites(repeater_id);

-- Weather Alerts
CREATE INDEX idx_weather_alerts_active ON weather_alerts(is_active, expires_at) WHERE is_active = TRUE;
CREATE INDEX idx_weather_alerts_severity ON weather_alerts(severity);
CREATE INDEX idx_weather_alerts_geo ON weather_alerts USING GIST (geo_point) WHERE geo_point IS NOT NULL;
CREATE INDEX idx_weather_alerts_source ON weather_alerts(source, external_id);
CREATE INDEX idx_weather_alerts_expires ON weather_alerts(expires_at);
CREATE INDEX idx_weather_alerts_type ON weather_alerts(alert_type, is_active);

-- Weather Alert Acknowledgments
CREATE INDEX idx_weather_ack_alert ON weather_alert_acknowledgments(alert_id);
CREATE INDEX idx_weather_ack_user ON weather_alert_acknowledgments(user_id);

-- Events
CREATE INDEX idx_events_group ON events(group_id);
CREATE INDEX idx_events_time ON events(event_time);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_upcoming ON events(event_time, status) WHERE status = 'upcoming';
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_geo ON events USING GIST (geo_point) WHERE geo_point IS NOT NULL;

-- Event RSVPs
CREATE INDEX idx_event_rsvps_event ON event_rsvps(event_id, status);
CREATE INDEX idx_event_rsvps_user ON event_rsvps(user_id);

-- Photos
CREATE INDEX idx_photos_uploader ON photos(uploader_id);
CREATE INDEX idx_photos_type ON photos(photo_type);
CREATE INDEX idx_photos_group ON photos(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX idx_photos_event ON photos(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_photos_featured ON photos(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_photos_created ON photos(created_at DESC);

-- Comments
CREATE INDEX idx_comments_photo ON comments(photo_id) WHERE photo_id IS NOT NULL;
CREATE INDEX idx_comments_event ON comments(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_comments_repeater ON comments(repeater_id) WHERE repeater_id IS NOT NULL;
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_comments_created ON comments(created_at DESC);

-- Likes
CREATE INDEX idx_likes_photo ON likes(photo_id) WHERE photo_id IS NOT NULL;
CREATE INDEX idx_likes_comment ON likes(comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX idx_likes_event ON likes(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_likes_message ON likes(message_id) WHERE message_id IS NOT NULL;
CREATE INDEX idx_likes_user ON likes(user_id);

-- Forum Links
CREATE INDEX idx_forum_links_type ON forum_links(link_type, external_id);
CREATE INDEX idx_forum_links_group ON forum_links(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX idx_forum_links_pinned ON forum_links(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX idx_forum_links_last_reply ON forum_links(last_reply_at DESC);
CREATE INDEX idx_forum_links_category ON forum_links(category_name);

-- Forum Follows
CREATE INDEX idx_forum_follows_user ON forum_follows(user_id);
CREATE INDEX idx_forum_follows_link ON forum_follows(forum_link_id);

-- Notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(user_id, type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Device Tokens
CREATE INDEX idx_device_tokens_user ON device_tokens(user_id, is_active);
CREATE INDEX idx_device_tokens_token ON device_tokens(token) WHERE is_active = TRUE;

-- Permissions
CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_permissions_module ON permissions(module);
CREATE INDEX idx_role_permissions_role ON role_permissions(role);

-- Audit Logs
CREATE INDEX idx_audit_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_module ON audit_logs(module, created_at DESC);
CREATE INDEX idx_audit_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_metadata ON audit_logs USING GIN (metadata);

-- Sessions
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(refresh_token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at) WHERE is_revoked = FALSE;
CREATE INDEX idx_sessions_active ON sessions(user_id, is_revoked) WHERE is_revoked = FALSE;

-- API Tokens
CREATE INDEX idx_api_tokens_user ON api_tokens(user_id);
CREATE INDEX idx_api_tokens_hash ON api_tokens(token_hash);
CREATE INDEX idx_api_tokens_active ON api_tokens(user_id, is_revoked) WHERE is_revoked = FALSE;

-- ============================================================================
-- TRIGGERS — AUTO-UPDATE updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_groups_updated BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_channels_updated BEFORE UPDATE ON channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_messages_updated BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_repeaters_updated BEFORE UPDATE ON repeaters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_weather_alerts_updated BEFORE UPDATE ON weather_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_photos_updated BEFORE UPDATE ON photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_comments_updated BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_forum_links_updated BEFORE UPDATE ON forum_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_notification_preferences_updated BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TRIGGERS — DENORMALIZED COUNTERS
-- ============================================================================

-- Group member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE groups SET member_count = member_count + 1
        WHERE id = NEW.group_id AND NEW.is_active = TRUE;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE groups SET member_count = GREATEST(member_count - 1, 0)
        WHERE id = OLD.group_id AND OLD.is_active = TRUE;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
            UPDATE groups SET member_count = GREATEST(member_count - 1, 0) WHERE id = NEW.group_id;
        ELSIF OLD.is_active = FALSE AND NEW.is_active = TRUE THEN
            UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_group_member_count
    AFTER INSERT OR DELETE OR UPDATE OF is_active ON group_members
    FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- Event RSVP count
CREATE OR REPLACE FUNCTION update_event_rsvp_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE events SET rsvp_count = rsvp_count + 1 WHERE id = NEW.event_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE events SET rsvp_count = GREATEST(rsvp_count - 1, 0) WHERE id = OLD.event_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_event_rsvp_count
    AFTER INSERT OR DELETE ON event_rsvps
    FOR EACH ROW EXECUTE FUNCTION update_event_rsvp_count();

-- Channel last message + member count
CREATE OR REPLACE FUNCTION update_channel_last_message()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE channels SET last_message_at = NEW.created_at WHERE id = NEW.channel_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_channel_last_message
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_channel_last_message();

-- ============================================================================
-- PARTITIONING STRATEGY (for tables exceeding 10M rows)
-- ============================================================================

-- Messages: partition by month for time-based queries
-- (Applied when table grows beyond ~10M rows)
--
-- CREATE TABLE messages_partitioned (
--     LIKE messages INCLUDING DEFAULTS INCLUDING CONSTRAINTS
-- ) PARTITION BY RANGE (created_at);
--
-- CREATE TABLE messages_2026_07 PARTITION OF messages_partitioned
--     FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
--
-- Audit logs: partition by month
-- Notifications: partition by month (archive old partitions)

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================