# MIST Database — Entity Relationship Documentation

This document explains the relationships between every table in the MIST PostgreSQL schema.

---

## Core User System

### users ↔ profiles (1:1)
Every user has exactly one profile. The `profiles.user_id` column has a `UNIQUE` constraint and `ON DELETE CASCADE` — when a user is deleted, their profile is automatically removed. This is a 1:1 relationship because profile data (bio, location, radio gear) is accessed separately from auth data and could grow independently.

### users → users (self-reference via community_id)
`users.community_id` stores the user's primary group affiliation. This is a soft foreign key (not enforced with REFERENCES because groups may be created after users in migration scenarios). It's a many:1 relationship — many users belong to one group.

---

## Friendship System

### users ↔ users (via friendships, M:N)
Friendships are a many-to-many self-referential relationship on the users table. The `friendships` table connects `requester_id` → `addressee_id` with a status (`pending`, `accepted`, `declined`, `blocked`). The `UNIQUE (requester_id, addressee_id)` constraint prevents duplicate requests. The `CHECK (requester_id != addressee_id)` constraint prevents self-friending.

---

## Group System

### users → groups (1:N via founder_id)
A user can found multiple groups. `groups.founder_id` references `users(id)` with `ON DELETE SET NULL` — if a founder deletes their account, the group survives but the founder reference is nulled.

### users ↔ groups (M:N via group_members)
Group membership is many-to-many. `group_members` is the junction table with a `role` column (`founder`, `admin`, `moderator`, `member`). The `UNIQUE (group_id, user_id)` constraint prevents duplicate memberships. `ON DELETE CASCADE` on both foreign keys means deleting a group removes all memberships, and deleting a user removes them from all groups.

### groups → group_invites → users
Group invites connect a group, an inviter (user), and an invitee (user). `inviter_id` uses `ON DELETE SET NULL` (the invite record survives for audit even if the inviter leaves), while `invitee_id` uses `ON DELETE CASCADE` (no point keeping an invite for a deleted user).

---

## Channel & Messaging System

### groups → channels (1:N)
A group has multiple channels. `channels.group_id` references `groups(id)` with `ON DELETE CASCADE` — deleting a group removes all its channels.

### users ↔ channels (M:N via channel_members)
Channel membership is many-to-many. `channel_members` tracks per-user state: `is_muted`, `is_pinned`, and `last_read_at` (for unread message calculation). `ON DELETE CASCADE` on both sides.

### channels → messages (1:N)
A channel has many messages. `messages.channel_id` references `channels(id)` with `ON DELETE CASCADE`.

### users → messages (1:N via sender_id)
A user sends many messages. `messages.sender_id` uses `ON DELETE SET NULL` — if a user is deleted, their messages remain (for conversation history) but the sender reference is nulled. `sender_name` and `sender_avatar` are denormalized snapshots so messages display correctly even after the user is deleted.

### messages → messages (self-reference via reply_to_id)
Messages can reply to other messages. `reply_to_id` references the same table with `ON DELETE SET NULL` — deleting a parent message doesn't delete replies, but the reply reference is cleared.

### messages ↔ users (M:N via message_reactions)
Reactions are many-to-many between messages and users. The `UNIQUE (message_id, user_id, emoji)` constraint ensures a user can only react with each emoji once per message.

### messages ↔ users (M:N via message_read_receipts)
Read receipts track which users have read which messages. `UNIQUE (message_id, user_id)` prevents duplicate receipts.

---

## Repeater System

### users → repeaters (1:N via owner_id)
A user can own multiple repeaters. `owner_id` uses `ON DELETE SET NULL` — repeaters persist even if the owner's account is deleted.

### users ↔ repeaters (M:N via repeater_favorites)
Favorites are many-to-many. `UNIQUE (repeater_id, user_id)` prevents duplicate favorites. `ON DELETE CASCADE` on both sides.

---

## Weather Alert System

### weather_alerts (standalone)
Weather alerts are ingested from external sources (NOAA). `UNIQUE (source, external_id)` prevents duplicate alerts from the same source.

### users ↔ weather_alerts (M:N via weather_alert_acknowledgments)
Acknowledgments track which users have seen which alerts. `UNIQUE (alert_id, user_id)` prevents duplicate acknowledgments.

---

## Event System

### groups → events (1:N)
A group can have many events. `events.group_id` uses `ON DELETE SET NULL` — events survive group deletion (they may have historical significance).

### users → events (1:N via created_by)
A user creates events. `created_by` uses `ON DELETE SET NULL` — events survive creator deletion.

### users ↔ events (M:N via event_rsvps)
RSVPs are many-to-many. `UNIQUE (event_id, user_id)` prevents duplicate RSVPs. The `status` column tracks `attending`, `maybe`, or `declined`.

---

## Photo System

### users → photos (1:N via uploader_id)
A user uploads many photos. `uploader_id` uses `ON DELETE SET NULL` — photos survive uploader deletion (denormalized `uploader_name` preserves attribution).

### groups → photos (1:N via group_id, optional)
Photos can belong to a group (gallery). `ON DELETE SET NULL` — photos survive group deletion.

### events → photos (1:N via event_id, optional)
Photos can belong to an event. `ON DELETE SET NULL` — photos survive event deletion.

---

## Comment System

### comments → comments (self-reference via parent_id)
Comments support threaded replies. `parent_id` references the same table with `ON DELETE CASCADE` — deleting a parent comment deletes all its children.

### comments → photos / events / repeaters (polymorphic)
Comments use a polymorphic pattern with a CHECK constraint ensuring exactly one of `photo_id`, `event_id`, or `repeater_id` is set. Each uses `ON DELETE CASCADE` — deleting the target removes all its comments.

### users → comments (1:N via author_id)
A user authors many comments. `author_id` uses `ON DELETE SET NULL` — comments survive author deletion (denormalized `author_name` preserves attribution).

---

## Like System

### likes → photos / comments / events / messages (polymorphic)
Likes use a polymorphic pattern with a CHECK constraint ensuring exactly one target is set. Multiple `UNIQUE` constraints prevent a user from liking the same target twice. All use `ON DELETE CASCADE`.

### users → likes (1:N via user_id)
A user creates many likes. `ON DELETE CASCADE` — deleting a user removes all their likes.

---

## Forum Link System

### forum_links (standalone with optional group)
Forum links reference external MyBB threads/posts. `group_id` is optional (`ON DELETE SET NULL`) — a forum link can exist without a group. `UNIQUE (link_type, external_id)` prevents duplicates.

### users ↔ forum_links (M:N via forum_follows)
Thread following is many-to-many. `UNIQUE (user_id, forum_link_id)` prevents duplicate follows. `ON DELETE CASCADE` on both sides.

---

## Notification System

### users → notifications (1:N)
A user receives many notifications. `ON DELETE CASCADE` — deleting a user removes all their notifications.

### users → notification_preferences (1:1)
Each user has one preferences record. `user_id` is `UNIQUE` with `ON DELETE CASCADE`.

### users → device_tokens (1:N)
A user can have multiple devices registered for push notifications. `UNIQUE (user_id, token)` prevents duplicate device registrations. `ON DELETE CASCADE`.

---

## Permission System

### permissions (standalone)
Permissions are defined per module (chat, forum, events, etc.). `name` is unique.

### roles ↔ permissions (M:N via role_permissions)
Role-permission mapping is many-to-many. `UNIQUE (role, permission_id)` prevents duplicates. The `role` column uses the `user_role` enum, linking to the role on the users table.

### roles (metadata table)
The `roles` table stores display names, descriptions, and priority for each role. `name` is unique and uses the `user_role` enum. `is_system = TRUE` for built-in roles that cannot be deleted.

---

## Audit System

### users → audit_logs (1:N via actor_id)
A user generates many audit log entries. `actor_id` uses `ON DELETE SET NULL` — audit logs survive user deletion (critical for compliance). `actor_name` is denormalized for historical accuracy.

### audit_logs (standalone otherwise)
Audit logs reference `target_type` and `target_id` as soft references (not enforced foreign keys) because targets may be deleted but audit records must persist.