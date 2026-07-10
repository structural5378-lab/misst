# MIST Multi-Tenant Platform Migration — Architecture Document

> **Status:** DRAFT — Awaiting Approval
> **Author:** Lead Software Architect
> **Date:** 2026-07-10
> **Decision Required:** Do NOT implement until this document is reviewed and approved.

---

## Table of Contents

1. [Current Architecture Audit](#1-current-architecture-audit)
2. [Required Database Changes](#2-required-database-changes)
3. [Required API Changes](#3-required-api-changes)
4. [Required Authentication Changes](#4-required-authentication-changes)
5. [Required Routing Changes](#5-required-routing-changes)
6. [Required UI Changes](#6-required-ui-changes)
7. [Required Permission Changes](#7-required-permission-changes)
8. [Migration Risks](#8-migration-risks)
9. [Implementation Phases](#9-implementation-phases)

---

## 1. Current Architecture Audit

### 1.1 Current Architecture Summary

MIST is currently a **single-tenant application** built on the Base44 platform. It serves one GMRS community (Insomniacs GMRS) and assumes all users, data, and features belong to that single community. The app uses a **MyBB forum bridge** for authentication — there is no native identity system.

**Stack:**
- Frontend: React + Tailwind CSS + Vite (PWA)
- Backend: Base44 BaaS (entities, functions, automations) + external MyBB PHP bridge
- Auth: MyBB bridge (username/password → PHP API → localStorage session)
- Realtime: Base44 entity subscriptions (WebSocket)
- Notifications: PushAlert (push), Base44 SendEmail (email)

### 1.2 Pages — Single-Community Assumptions

| Page | Route | Single-Community Assumption | Severity |
|------|-------|------------------------------|----------|
| Dashboard | `/` | Fetches ALL alerts, nets, forum posts, online members globally — no community filter | **Critical** |
| LiveChat | `/live-chat` | `useChat` loads ALL ChatMessages globally via `ChatMessage.list()` — no community_id filter | **Critical** |
| MyBBForum | `/community-forum` | Calls `fetchMyBBForums` which hits a single hardcoded MyBB instance (`insomniacsgmrs.com`) | **Critical** |
| Repeaters | `/repeaters` | `Repeater.list()` fetches ALL repeaters globally — no community ownership | **Critical** |
| RepeaterDetail | `/repeaters/:id` | No community context check — any user can view any repeater | High |
| AddRepeater | `/repeaters/add` | Creates repeater with no community_id | **Critical** |
| MapView | `/map` | Fetches ALL repeaters globally — no community filter | **Critical** |
| Nets | `/nets` | `Net.list()` fetches ALL nets globally — no community_id | **Critical** |
| NetControl | `/nets/:netId/control` | No community authorization check | High |
| CreateNet | `/nets/create` | Creates net with no community_id | **Critical** |
| Alerts | `/alerts` | `Alert.list()` fetches ALL alerts globally — no community_id | **Critical** |
| CreateAlert | `/alerts/create` | Creates alert with no community_id; broadcasts to ALL users platform-wide | **Critical** |
| Gallery | `/gallery` | `GatheringPhoto.list()` fetches ALL photos globally — no community_id | **Critical** |
| Members | `/members` | Calls `fetchMyBBForums` → `members` action — fetches ALL MyBB members | **Critical** |
| Weather | `/weather` | Hardcoded to Orlando, FL coordinates (28.5383, -81.3792) — no per-community location | High |
| LiveCams | `/live-cams` | Hardcoded Florida beach cam list — not configurable per community | High |
| Shopping | `/shopping` | `MarketplaceItem.list()` fetches ALL items globally — no community_id | **Critical** |
| Profile | `/profile` | User profile has no community context; `base44.auth.me()` returns platform user only | High |
| CreateCommunity | `/community/create` | Creates community but doesn't establish tenant isolation | Medium |
| Messages | `/messages` | PMs go through single MyBB instance — no community context | **Critical** |
| Tools | `/tools` | Stateless calculators — no community needed | None |
| TestNotifications | `/test-notifications` | Sends to ALL PushAlert subscribers globally | High |
| CineplexMode | `/cineplex` | LocationShare has community_id field but it's not used for filtering | Medium |
| AddContent | `/add` | Hub for creating content — no community context in create flows | **Critical** |

### 1.3 Components — Single-Community Assumptions

| Component | File | Assumption | Severity |
|-----------|------|------------|----------|
| AppLayout | `src/components/layout/AppLayout.jsx` | Hardcoded MIST logo, fetches weather for single location, no tenant context provider | **Critical** |
| BottomNav | `src/components/layout/BottomNav.jsx` | Fetches unread PMs for single MyBB instance, subscribes to ALL ChatMessages globally | **Critical** |
| CommunitySelector | `src/components/layout/CommunitySelector.jsx` | Exists but only switches localStorage — does NOT filter data queries downstream | **Critical** |
| AlertPoller | `src/components/layout/AlertPoller.jsx` | Subscribes to ALL Alert creates globally — no community filter | **Critical** |
| SimplexRequestPoller | `src/components/layout/SimplexRequestPoller.jsx` | Polls ALL LocationShare requests — no community filter | High |
| NotificationManager | `src/components/layout/NotificationManager.jsx` | Registers for PushAlert globally — no per-community subscription | High |
| OnlineMembersSheet | `src/components/members/OnlineMembersSheet.jsx` | Displays members from single MyBB instance | **Critical** |
| PropagationGauge | `src/components/dashboard/PropagationGauge.jsx` | Global solar data — not community-specific (acceptable: physics is global) | None |
| StormTracker | `src/components/weather/StormTracker.jsx` | Global storm data — could be community-location-aware | Low |
| All chat components | `src/components/chat/*` | `useChat` hook fetches all messages globally; no community_id in queries | **Critical** |
| All forum components | `src/components/forum/*` | Hardcoded to single MyBB instance | **Critical** |
| All message components | `src/components/messages/*` | Hardcoded to single MyBB PM system | **Critical** |

### 1.4 Database Entities — Community Isolation Audit

| Entity | Has `community_id`? | Actually Filters By It? | Verdict |
|--------|---------------------|--------------------------|---------|
| Community | N/A (is the parent) | — | OK |
| CommunityMember | ✅ `community_id` | Used in CommunitySelector only | **Partial** |
| ChatMessage | ✅ `community_id`, `community_name` | **NOT used in any query** | **Critical** |
| ChatPresence | ❌ No community_id | N/A | **Critical** |
| DirectMessage | ✅ `community_id` | Not used in queries | **Critical** |
| LocationShare | ✅ `community_id` | Not used in queries | **Critical** |
| ForumThread | ✅ `community_id`, `community_name` | Not used — threads come from MyBB | **Critical** |
| ForumPost | ❌ No community_id | N/A | **Critical** |
| ForumCategory | ❌ No community_id | N/A | **Critical** |
| FollowedThread | ❌ No community_id | N/A | **Critical** |
| Repeater | ❌ No community_id | N/A | **Critical** |
| Net | ❌ No community_id | N/A | **Critical** |
| NetSession | ❌ No community_id | N/A | **Critical** |
| NetCheckIn | ❌ No community_id | N/A | **Critical** |
| NetLog | ❌ No community_id | N/A | **Critical** |
| Event | ❌ No community_id | N/A | **Critical** |
| Alert | ❌ No community_id | N/A | **Critical** |
| GatheringPhoto | ❌ No community_id | N/A | **Critical** |
| MarketplaceItem | ❌ No community_id | N/A | **Critical** |

**Summary:** 13 of 18 content entities have NO community_id field at all. The 5 that do have it never use it for filtering. The app is effectively single-tenant despite the Community entity existing.

### 1.5 Backend Functions — Single-Community Assumptions

| Function | File | Assumption | Severity |
|----------|------|-------------|----------|
| `mybbAuth` | `base44/functions/mybbAuth/entry.ts` | Hardcoded `BRIDGE_URL = "https://insomniacsgmrs.com/mist-api.php"` — single MyBB instance | **Critical** |
| `fetchMyBBForums` | `base44/functions/fetchMyBBForums/entry.ts` | Same hardcoded `BRIDGE_URL`; all forum operations go to single instance | **Critical** |
| `mybbMessages` | `base44/functions/mybbMessages/entry.ts` | Single MyBB PM system | **Critical** |
| `registerMyBBUser` | `base44/functions/registerMyBBUser/entry.ts` | Registers on single MyBB instance | **Critical** |
| `getWeatherData` | `base44/functions/getWeatherData/entry.ts` | Hardcoded fallback to Orlando coordinates — no per-community location | High |
| `fetchRepeaterBook` | `base44/functions/fetchRepeaterBook/entry.ts` | Hardcoded to GMRS band, specific lat/lng | Medium |
| `sendAlertNotification` | `base44/functions/sendAlertNotification/entry.ts` | Broadcasts to ALL PushAlert subscribers — no community targeting | **Critical** |
| `sendEventNotification` | `base44/functions/sendEventNotification/entry.ts` | Same — broadcasts to all | **Critical** |
| `checkNewChatMessages` | `base44/functions/checkNewChatMessages/entry.ts` | Checks ALL ChatMessages globally; notifies all users | **Critical** |
| `checkNewPMs` | `base44/functions/checkNewPMs/entry.ts` | Checks single MyBB instance | **Critical** |
| `checkNewThreads` | `base44/functions/checkNewThreads/entry.ts` | Checks single MyBB instance | **Critical** |
| `checkFollowedThreads` | `base44/functions/checkFollowedThreads/entry.ts` | Single MyBB instance | **Critical** |
| `checkLocationShareRequests` | `base44/functions/checkLocationShareRequests/entry.ts` | Polls ALL LocationShare requests; notifies all | **Critical** |
| `checkEventReminders` | `base44/functions/checkEventReminders/entry.ts` | Checks ALL events; notifies all | **Critical** |
| `checkAllNotifications` | `base44/functions/checkAllNotifications/entry.ts` | Aggregator — inherits all above issues | **Critical** |
| `sendTestNotification` | `base44/functions/sendTestNotification/entry.ts` | Sends to all | Medium |
| `uploadAvatar` | `base44/functions/uploadAvatar/entry.ts` | No community context for file storage | Low |
| `uploadGalleryPhoto` | `base44/functions/uploadGalleryPhoto/entry.ts` | No community_id on uploaded photos | **Critical** |
| `searchUsers` | `base44/functions/searchUsers/entry.ts` | Searches single MyBB user base | **Critical** |

### 1.6 Authentication System — Current State

**Current auth flow:**
```
User enters username/password
  → Login.jsx calls base44.functions.invoke("mybbAuth", {username, password})
    → mybbAuth function POSTs to https://insomniacsgmrs.com/mist-api.php
      → PHP bridge validates against MyBB database
      → Returns user object with uid, username, role, avatar, etc.
    → Frontend stores entire user object (including password) in localStorage
  → All subsequent API calls read from localStorage
```

**Critical problems for multi-tenancy:**
1. **No native identity system** — users don't exist outside MyBB
2. **Password stored in localStorage** in plaintext (security risk)
3. **No concept of platform-level vs community-level identity**
4. **Single MyBB instance** — can't support multiple communities with different forums
5. **No JWT/token-based auth** — session is a localStorage blob
6. **No role separation** — `mybbUser.role` is a single string ("admin"|"moderator"|"member") with no platform vs community distinction

### 1.7 Notification System — Current State

**Current flow:**
```
Alert created → entity automation fires → sendAlertNotification function
  → PushAlert API sends push to ALL subscribers (no targeting)
  → Email sent to ALL platform admins if emergency
```

**Critical problems:**
1. PushAlert has no concept of community-scoped subscriptions
2. All users receive all notifications regardless of community membership
3. No per-community notification preferences
4. No per-community push topic/segment

### 1.8 Realtime System — Current State

**Current flow:**
```
ChatMessage.subscribe() → ALL message creates broadcast to ALL connected clients
AlertPoller subscribes to ALL Alert creates globally
BottomNav subscribes to ALL ChatMessage creates globally
```

**Critical problems:**
1. Every client receives every entity event platform-wide
2. No room/channel-based pub-sub scoped to communities
3. Client-side filtering by community_id would still leak data to the client

---

## 2. Required Database Changes

### 2.1 New Entities Required

#### 2.1.1 PlatformRole
```
Purpose: Stores platform-level role assignments (separate from community roles)
Fields:
  - user_id: string (required) — references User.id
  - user_email: string
  - role: enum ["platform_owner", "platform_admin", "platform_support"]
  - assigned_by: string — User.id of assigner
  - assigned_date: date-time
  - is_active: boolean
Required: [user_id, role]
```

#### 2.1.2 CommunityRole
```
Purpose: Stores per-community role assignments for each member
Fields:
  - user_id: string (required)
  - user_email: string
  - community_id: string (required)
  - role: enum ["community_owner", "community_admin", "moderator", "trusted_member", "member", "guest"]
  - assigned_by: string
  - assigned_date: date-time
  - is_active: boolean
Required: [user_id, community_id, role]
```

#### 2.1.3 CommunityForumConfig
```
Purpose: Stores per-community forum adapter configuration (supports swappable forums)
Fields:
  - community_id: string (required)
  - forum_type: enum ["mybb", "discourse", "native", "none"]
  - forum_url: string
  - bridge_url: string — API endpoint for forum bridge
  - bridge_secret: string — stored as secret reference, not plaintext
  - bot_username: string
  - bot_password_secret: string — reference to secret
  - is_active: boolean
Required: [community_id, forum_type]
```

#### 2.1.4 CommunityWeatherConfig
```
Purpose: Stores per-community weather location and preferences
Fields:
  - community_id: string (required)
  - default_lat: number
  - default_lon: number
  - location_name: string
  - radar_enabled: boolean
  - storm_tracking_enabled: boolean
Required: [community_id]
```

#### 2.1.5 CommunityLiveCamConfig
```
Purpose: Stores per-community live camera configurations
Fields:
  - community_id: string (required)
  - cameras: string (JSON array of {name, location, url, type, youtubeId})
  - is_active: boolean
Required: [community_id]
```

#### 2.1.6 CommunityNotificationConfig
```
Purpose: Stores per-community notification channel configuration
Fields:
  - community_id: string (required)
  - pushalert_segment: string — PushAlert subscriber segment for this community
  - email_from_name: string
  - email_enabled: boolean
  - quiet_hours_start: string
  - quiet_hours_end: string
Required: [community_id]
```

#### 2.1.7 CommunitySettings
```
Purpose: Stores per-community general settings and feature flags
Fields:
  - community_id: string (required)
  - features_enabled: string (JSON: {chat: true, forum: true, weather: true, ...})
  - primary_color: string
  - theme_override: string
  - max_members: number
  - is_public: boolean — can non-members see this community?
  - join_mode: enum ["open", "invite", "request", "closed"]
  - created_date: date-time
Required: [community_id]
```

#### 2.1.8 CommunityModerationLog
```
Purpose: Audit log for moderation actions within a community
Fields:
  - community_id: string (required)
  - moderator_id: string
  - moderator_name: string
  - action: enum ["warn", "mute", "ban", "delete_message", "delete_thread", "kick", "unmute", "unban"]
  - target_user_id: string
  - target_user_name: string
  - reason: string
  - entity_type: string — "chat_message", "forum_thread", "forum_post", etc.
  - entity_id: string
  - action_date: date-time
Required: [community_id, moderator_id, action]
```

#### 2.1.9 CommunityInvitation
```
Purpose: Manages invitations to join a community
Fields:
  - community_id: string (required)
  - community_name: string
  - invited_email: string
  - invited_by: string — User.id
  - inviter_name: string
  - role: enum ["member", "moderator", "trusted_member"]
  - status: enum ["pending", "accepted", "declined", "expired"]
  - invite_token: string
  - expires_at: date-time
  - accepted_date: date-time
Required: [community_id, invited_email, status]
```

#### 2.1.10 PlatformAuditLog
```
Purpose: Audit log for platform-level administrative actions
Fields:
  - actor_id: string
  - actor_email: string
  - action: string — e.g. "create_community", "suspend_community", "assign_platform_role"
  - target_type: string — "community", "user", "role"
  - target_id: string
  - details: string (JSON)
  - action_date: date-time
Required: [actor_id, action]
```

### 2.2 Existing Entities — Required Modifications

Every content entity must gain a `community_id` field (string, required) and all queries must filter by it.

| Entity | Add `community_id` | Add `community_name` (denormalized) | Other Changes |
|--------|-------------------|--------------------------------------|----------------|
| ChatMessage | ✅ (field exists, must enforce) | ✅ (exists) | Add `is_deleted` for moderation |
| ChatPresence | ✅ **NEW** | ✅ **NEW** | — |
| DirectMessage | ✅ (field exists, must enforce) | — | — |
| LocationShare | ✅ (field exists, must enforce) | — | — |
| ForumThread | ✅ (field exists, must enforce) | ✅ (exists) | — |
| ForumPost | ✅ **NEW** | — | — |
| ForumCategory | ✅ **NEW** | — | — |
| FollowedThread | ✅ **NEW** | — | — |
| Repeater | ✅ **NEW** | — | Add `is_public_platform` boolean for shared repeaters |
| Net | ✅ **NEW** | — | — |
| NetSession | ✅ **NEW** | — | — |
| NetCheckIn | ✅ **NEW** | — | — |
| NetLog | ✅ **NEW** | — | — |
| Event | ✅ **NEW** | — | — |
| Alert | ✅ **NEW** | — | Add `scope` enum: "community" \| "platform" |
| GatheringPhoto | ✅ **NEW** | — | — |
| MarketplaceItem | ✅ **NEW** | — | — |

### 2.3 Community Entity — Required Enhancements

The existing Community entity needs additional fields:

```
Current fields: name, callsign, description, logo_url, primary_color,
                founder_uid, founder_name, is_active, member_count, created_date

ADD:
  - slug: string (required, unique) — URL-safe identifier for routing
  - status: enum ["active", "suspended", "pending", "archived"]
  - plan: enum ["free", "pro", "enterprise"] — future billing tier
  - max_members: number (default 1000)
  - is_listed: boolean — appears in public community directory
  - suspended_reason: string
  - suspended_date: date-time
  - platform_owner_id: string — platform admin who approved
```

### 2.4 Data Isolation Model

**Rule:** Every database query for content entities MUST include `community_id` in its filter. The ONLY exceptions are:
- Platform-level entities (PlatformRole, PlatformAuditLog, Community)
- Cross-community shared repeaters (flagged with `is_public_platform = true`)

**Enforcement:** This will be enforced at the service/repository layer, not at the UI level. The frontend will pass `community_id` from a context provider; the backend will validate it against the user's membership.

---

## 3. Required API Changes

### 3.1 New API Modules Required

#### 3.1.1 Platform Admin API
```
POST   /api/platform/roles/assign          — Assign platform role (platform_owner only)
DELETE /api/platform/roles/:userId          — Revoke platform role
GET    /api/platform/roles                  — List all platform roles
GET    /api/platform/communities            — List all communities (paginated)
PATCH  /api/platform/communities/:id/status — Suspend/activate/archive community
GET    /api/platform/audit-log              — Platform audit log
GET    /api/platform/stats                   — Platform-wide statistics
```

#### 3.1.2 Community Management API
```
POST   /api/communities                     — Create community
GET    /api/communities                      — List user's communities
GET    /api/communities/:slug                — Get community by slug
PATCH  /api/communities/:id                  — Update community (community_admin+)
DELETE /api/communities/:id                  — Delete community (community_owner only)
POST   /api/communities/:id/invite           — Send invitation
POST   /api/communities/:id/join             — Join via invite token
DELETE /api/communities/:id/members/:userId  — Remove member (moderator+)
PATCH  /api/communities/:id/members/:userId   — Change member role (community_admin+)
GET    /api/communities/:id/members           — List community members
GET    /api/communities/:id/settings         — Get community settings
PATCH  /api/communities/:id/settings          — Update settings (community_admin+)
```

#### 3.1.3 Community-Scoped Content APIs
All existing content endpoints must become community-scoped:

```
GET    /api/communities/:slug/chat/messages          — Chat messages (scoped)
POST   /api/communities/:slug/chat/messages          — Send message
DELETE /api/communities/:slug/chat/messages/:id      — Delete message
GET    /api/communities/:slug/chat/presence           — Online members
GET    /api/communities/:slug/repeaters               — Community repeaters
POST   /api/communities/:slug/repeaters               — Add repeater
GET    /api/communities/:slug/nets                    — Community nets
POST   /api/communities/:slug/nets                    — Create net
GET    /api/communities/:slug/alerts                  — Community alerts
POST   /api/communities/:slug/alerts                  — Create alert
GET    /api/communities/:slug/events                   — Community events
GET    /api/communities/:slug/gallery                  — Community gallery
POST   /api/communities/:slug/gallery                 — Upload photo
GET    /api/communities/:slug/marketplace             — Community marketplace
GET    /api/communities/:slug/forum/categories        — Forum categories
GET    /api/communities/:slug/forum/threads           — Forum threads
POST   /api/communities/:slug/forum/threads           — Create thread
GET    /api/communities/:slug/forum/threads/:id        — Thread detail
POST   /api/communities/:slug/forum/threads/:id/reply  — Reply to thread
GET    /api/communities/:slug/weather                 — Community weather
GET    /api/communities/:slug/cams                    — Community live cams
GET    /api/communities/:slug/notifications            — Community notifications
```

### 3.2 Existing Backend Functions — Required Changes

Every backend function must be modified to accept `community_id` and scope all operations.

| Function | Current Behavior | Required Change |
|----------|-----------------|-----------------|
| `mybbAuth` | Authenticates against single MyBB | Must authenticate against platform identity, then resolve community memberships |
| `fetchMyBBForums` | Hardcoded single MyBB URL | Must accept `community_id`, look up that community's forum config, use the correct bridge URL |
| `mybbMessages` | Single MyBB PM system | Must accept `community_id`, use community's forum config |
| `registerMyBBUser` | Registers on single MyBB | Must accept `community_id`, register on that community's forum |
| `getWeatherData` | Hardcoded Orlando fallback | Must accept `community_id`, use community's weather config for location |
| `sendAlertNotification` | Broadcasts to ALL users | Must accept `community_id`, send only to that community's PushAlert segment |
| `sendEventNotification` | Broadcasts to ALL users | Must accept `community_id`, target community members only |
| `checkNewChatMessages` | Checks ALL messages | Must check per-community, notify per-community |
| `checkNewPMs` | Checks single MyBB | Must check per-community forum config |
| `checkNewThreads` | Checks single MyBB | Must check per-community forum config |
| `checkFollowedThreads` | Checks single MyBB | Must check per-community forum config |
| `checkLocationShareRequests` | Polls ALL requests | Must filter by `community_id` |
| `checkEventReminders` | Checks ALL events | Must filter by `community_id` |
| `uploadGalleryPhoto` | No community context | Must accept and store `community_id` |
| `searchUsers` | Searches single MyBB | Must search within community context |
| `uploadAvatar` | No community context | Acceptable — avatars are platform-level (user identity) |

### 3.3 New Backend Functions Required

| Function | Purpose |
|----------|---------|
| `createCommunity` | Full community setup: create Community, CommunitySettings, CommunityForumConfig, CommunityWeatherConfig, assign founder as community_owner |
| `inviteToCommunity` | Generate invite token, send email |
| `acceptInvitation` | Validate token, create CommunityMember + CommunityRole |
| `assignCommunityRole` | Change member's role within community |
| `removeCommunityMember` | Remove member from community |
| `getCommunityConfig` | Aggregate all community config for frontend context |
| `assignPlatformRole` | Platform-level role assignment (platform_owner only) |
| `suspendCommunity` | Platform admin suspends a community |
| `moderateContent` | Create moderation log entry, take action on content |
| `getPlatformStats` | Platform-wide dashboard data |

### 3.4 Standard Response Envelope (unchanged)

All API responses continue to use the existing envelope:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Error responses:
```json
{
  "success": false,
  "data": null,
  "error": { "code": "NOT_AUTHORIZED", "message": "..." }
}
```

---

## 4. Required Authentication Changes

### 4.1 Identity System Overhaul

**Current:** MyBB bridge → localStorage blob (no tokens, password in plaintext)

**Required:** Two-layer identity system

#### Layer 1: Platform Identity (Native)
- Users register with email + password on MIST platform directly
- JWT-based authentication (access token + refresh token)
- Platform identity is independent of any forum system
- Stores: email, password_hash, full_name, avatar, platform_role
- This replaces the MyBB bridge as the primary auth mechanism

#### Layer 2: Community Membership
- After platform authentication, user's community memberships are resolved
- Each membership includes a community role
- User can belong to multiple communities simultaneously
- One community is "active" at a time (stored in session/context)

### 4.2 Auth Flow — New Design

```
Registration:
  User enters email + password
    → Platform creates User record (unverified)
    → OTP sent to email
    → User verifies OTP
    → Platform identity established
    → User can now join/create communities

Login:
  User enters email + password
    → Platform validates credentials
    → Returns JWT access token
    → Frontend stores token (httpOnly cookie or secure storage)
    → Frontend fetches user's community memberships
    → If user has communities → set active community → load dashboard
    → If user has no communities → show community discovery/onboarding

Community Context:
  On every API call, frontend includes:
    - Authorization: Bearer <jwt>
    - X-Community-Id: <active_community_id>
  Backend validates:
    1. JWT is valid
    2. User is member of X-Community-Id
    3. User's role in that community permits the requested action
```

### 4.3 MyBB Forum Bridge — New Role

MyBB becomes an **optional, swappable forum adapter** per community:
- A community can choose: MyBB, Discourse, native forum, or no forum
- If MyBB is selected, the community admin configures the bridge URL and credentials
- Forum auth is linked to platform identity (not separate credentials)
- The `mybbAuth` function is deprecated as a login mechanism; it becomes a forum-linking utility

### 4.4 Session Management

| Aspect | Current | Required |
|--------|---------|----------|
| Token storage | localStorage (plaintext password) | httpOnly cookie or in-memory token |
| Token type | None (localStorage blob) | JWT (access + refresh) |
| Session expiry | Never (until logout) | Access token: 15min; Refresh token: 7 days |
| Multi-community | Not supported | Active community in context; switchable |
| Platform roles | Not supported | PlatformRole entity |
| Community roles | Single string in MyBB user | CommunityRole entity per community |

### 4.5 Migration Considerations for Existing Users

Existing MyBB users must be migrated to platform identity:
1. **Migration function** reads all MyBB users
2. Creates platform User records with email from MyBB
3. Sets a temporary password (forces reset on first login)
4. Links MyBB account as forum adapter for the migrated community
5. Existing MyBB roles map to community roles: MyBB admin → community_admin, MyBB moderator → moderator, MyBB member → member

---

## 5. Required Routing Changes

### 5.1 Current Routing

```
/login
/ (dashboard)
/repeaters
/repeaters/:id
/map
/nets
/messages
/alerts
/tools
/tools/*
/profile
/add
/community-forum
/nets/:netId/control
/nets/create
/community-forum/register
/alerts/create
/live-cams
/gallery
/members
/weather
/cineplex
/events/create
/live-chat
/forums/new
/forums/thread/:id
/test-notifications
/shopping
/community/create
```

All routes are flat — no community context in the URL.

### 5.2 Required Routing — Community-Scoped

**Option A: Subpath-based (recommended)**
```
/login
/register
/forgot-password
/reset-password
/onboarding                    — New user, no community yet
/discover                      — Browse public communities

/c/:slug                       — Community home (dashboard)
/c/:slug/chat
/c/:slug/forum
/c/:slug/forum/thread/:id
/c/:slug/forum/new
/c/:slug/repeaters
/c/:slug/repeaters/:id
/c/:slug/repeaters/add
/c/:slug/map
/c/:slug/nets
/c/:slug/nets/:netId/control
/c/:slug/nets/create
/c/:slug/messages
/c/:slug/alerts
/c/:slug/alerts/create
/c/:slug/events
/c/:slug/events/create
/c/:slug/gallery
/c/:slug/members
/c/:slug/weather
/c/:slug/cams
/c/:slug/shopping
/c/:slug/cineplex
/c/:slug/settings
/c/:slug/profile

/platform/admin                — Platform admin dashboard
/platform/admin/communities
/platform/admin/users
/platform/admin/audit-log

/settings                      — Platform-level settings (account, notifications)
/notifications                 — Unified notification inbox (cross-community)
/tools                         — Stateless tools (no community needed)
```

**Option B: State-based (not recommended)**
Community is in context (localStorage/context provider), not in URL. Simpler but breaks deep linking and sharing.

**Recommendation:** Option A (subpath-based) because:
- Deep linking works per-community
- URLs are shareable
- Browser back button works naturally
- Community context is visible in the URL

### 5.3 Route Protection Changes

Current: `MyBBProtectedRoute` checks localStorage for MyBB session.

Required: Two protection layers:

```javascript
// Platform auth — user must be logged in
<Route element={<PlatformAuthRoute />}>
  <Route path="/onboarding" element={<Onboarding />} />
  <Route path="/discover" element={<DiscoverCommunities />} />
  <Route path="/settings" element={<PlatformSettings />} />
  <Route path="/notifications" element={<UnifiedNotifications />} />
  <Route path="/tools" element={<Tools />} />

  // Community auth — user must be member of :slug community
  <Route element={<CommunityAuthRoute />}>
    <Route path="/c/:slug" element={<Dashboard />} />
    <Route path="/c/:slug/chat" element={<LiveChat />} />
    // ... all community-scoped routes
  </Route>

  // Platform admin — user must have platform role
  <Route element={<PlatformAdminRoute />}>
    <Route path="/platform/admin" element={<PlatformAdminDashboard />} />
    // ... platform admin routes
  </Route>
</Route>
```

### 5.4 Community Context Provider

A new `CommunityContext` will replace the current localStorage-based approach:

```
CommunityContext {
  community: Community          — full community object
  communityId: string           — convenience
  communitySlug: string          — for routing
  memberRole: string             — user's role in this community
  permissions: string[]          — resolved permission list
  switchCommunity(slug): void   — switch active community
  refresh(): void               — re-fetch community data
}
```

This context is populated by `CommunityAuthRoute` from the URL `:slug` parameter. All community-scoped pages consume this context instead of reading localStorage.

---

## 6. Required UI Changes

### 6.1 New Screens Required

| Screen | Route | Purpose |
|--------|-------|---------|
| Onboarding | `/onboarding` | New user with no communities — discover or create |
| DiscoverCommunities | `/discover` | Browse public communities, request to join |
| CommunitySettings | `/c/:slug/settings` | Community admin settings (features, appearance, forum config, weather config, cam config) |
| CommunityMembers | `/c/:slug/members` | Member list with role management (replaces current Members page) |
| CommunityModeration | `/c/:slug/moderation` | Moderation log and actions (community_admin+) |
| PlatformAdminDashboard | `/platform/admin` | Platform overview — total communities, users, health |
| PlatformCommunities | `/platform/admin/communities` | Manage all communities (suspend, archive) |
| PlatformUsers | `/platform/admin/users` | Manage platform users and platform roles |
| PlatformAuditLog | `/platform/admin/audit-log` | Platform action history |
| UnifiedNotifications | `/notifications` | Cross-community notification inbox with community badges |
| PlatformSettings | `/settings` | Account, security, connected accounts, notification preferences (platform-level) |

### 6.2 Modified Screens

| Screen | Current | Required Change |
|--------|---------|-----------------|
| Dashboard | Global data | All queries filtered by `community_id` from context; header shows community name/logo |
| LiveChat | Global messages | `useChat` hook accepts `communityId`; all CRUD scoped to community |
| Forum | Hardcoded MyBB | Uses community's forum config; supports multiple forum backends |
| Repeaters | Global list | Filtered by `community_id`; option to show platform-shared repeaters |
| Nets | Global list | Filtered by `community_id` |
| Alerts | Global list | Filtered by `community_id`; platform alerts shown separately |
| Gallery | Global photos | Filtered by `community_id` |
| Weather | Hardcoded Orlando | Uses community weather config for location |
| LiveCams | Hardcoded Florida cams | Uses community live cam config |
| Shopping | Global items | Filtered by `community_id` |
| Members | Single MyBB list | Community members with roles from CommunityRole entity |
| Profile | Platform user only | Shows platform identity + per-community profiles |
| Messages | Single MyBB PMs | Community-scoped messaging (if forum adapter supports PMs) |
| AddContent | No community context | Pre-fills `community_id` from context on all create flows |
| CreateCommunity | Basic creation | Full setup wizard: name, slug, forum config, weather config, features |
| AppLayout | Hardcoded branding | Dynamic branding from active community (logo, colors) |
| BottomNav | Global subscriptions | Subscriptions scoped to active community; community switcher prominent |
| CommunitySelector | localStorage only | Drives CommunityContext; triggers route change to `/c/:slug` |

### 6.3 Community Branding

The app shell must dynamically adapt to the active community:
- Logo in header → community logo
- Primary color → community primary_color
- App name in header → community name
- Favicon → community favicon (if configured)

### 6.4 Community Switcher

The community switcher must be prominent and accessible:
- In the header (current position, enhanced)
- Shows all communities user belongs to
- Shows unread counts per community
- Switching changes the route AND the context AND refreshes all data
- No page reload (unlike current `window.location.reload()`)

### 6.5 Empty States

Every community-scoped screen needs:
- "No messages yet — start the conversation" (Chat)
- "No repeaters added — add your first repeater" (Repeaters)
- "No upcoming nets — create a net" (Nets)
- "No photos — upload gathering memories" (Gallery)
- "No alerts — all clear" (Alerts)
- "No events scheduled — create one" (Events)
- "No marketplace listings — list an item" (Shopping)

### 6.6 Permission-Gated UI

UI elements must show/hide based on resolved permissions:
- "Create Alert" button → only visible to community_admin+
- "Create Event" button → only visible to community_admin+
- "Create Net" button → only visible to moderator+
- "Delete message" option → only for message author or moderator+
- "Manage Members" → only for community_admin+
- "Community Settings" → only for community_admin+
- "Platform Admin" link → only for platform_admin+
- "Moderation Log" → only for moderator+

---

## 7. Required Permission Changes

### 7.1 Two-Layer Permission System

#### Layer 1: Platform Permissions

| Role | Permissions |
|------|-------------|
| **Platform Owner** | Full platform control: create/suspend/archive communities, assign platform roles, access platform audit log, platform billing, platform settings |
| **Platform Administrator** | Manage all communities (suspend/activate), manage users, view audit log, support communities |
| **Platform Support** | View-only access to communities and users for support purposes; cannot modify |

**Enforcement:** PlatformRole entity + `PlatformAdminRoute` component + backend function checks.

#### Layer 2: Community Permissions

| Role | Permissions |
|------|-------------|
| **Community Owner** | Full community control: delete community, transfer ownership, assign community_admin, all community settings, all content moderation |
| **Community Administrator** | Manage members (invite, remove, change roles up to moderator), manage all community settings (except deletion/transfer), moderate all content, create alerts/events/nets |
| **Moderator** | Moderate chat (delete messages, mute users), moderate forum (delete threads/posts, lock threads), create nets, view moderation log |
| **Trusted Member** | Create forum threads, upload gallery photos, post in chat, create marketplace listings, check into nets |
| **Member** | Read all community content, post in chat, reply to forum threads, check into nets |
| **Guest** | Read-only access to public community content (if community is_public = true); cannot post |

### 7.2 Permission Resolution

```
For any action, the system checks:

1. Is the user authenticated at the platform level?
   NO → 401 Unauthorized

2. Does the user have a platform role that grants this action?
   YES → Allow (platform-level actions only)

3. Does the user have a community role for the active community?
   NO → 403 Forbidden

4. Does the community role permit this action?
   NO → 403 Forbidden

5. Allow
```

### 7.3 Permission Matrix — Actions to Roles

| Action | Minimum Community Role | Platform Override |
|--------|----------------------|-------------------|
| View community content (public) | Guest | — |
| View community content (private) | Member | Platform Admin |
| Post in chat | Member | — |
| Delete own chat message | Member | — |
| Delete any chat message | Moderator | Platform Admin |
| Mute/kick community member | Moderator | Platform Admin |
| Create forum thread | Trusted Member | — |
| Reply to forum thread | Member | — |
| Delete forum thread | Moderator | Platform Admin |
| Create net | Moderator | — |
| Check into net | Member | — |
| Create alert | Community Admin | Platform Admin |
| Create event | Community Admin | — |
| Upload gallery photo | Trusted Member | — |
| Create marketplace listing | Trusted Member | — |
| Invite members | Community Admin | — |
| Change member roles | Community Admin | — |
| Manage community settings | Community Admin | — |
| Delete community | Community Owner | Platform Owner |
| Suspend community | N/A | Platform Admin |
| Assign platform roles | N/A | Platform Owner |
| View platform audit log | N/A | Platform Admin |

### 7.4 Permission Context Provider

```javascript
CommunityPermissions = {
  canCreateAlert: boolean,
  canCreateEvent: boolean,
  canCreateNet: boolean,
  canModerateChat: boolean,
  canModerateForum: boolean,
  canManageMembers: boolean,
  canManageSettings: boolean,
  canDeleteCommunity: boolean,
  canInviteMembers: boolean,
  canUploadPhotos: boolean,
  canCreateListings: boolean,
  canCreateThreads: boolean,
}

PlatformPermissions = {
  isPlatformOwner: boolean,
  isPlatformAdmin: boolean,
  isPlatformSupport: boolean,
  canAccessAdminDashboard: boolean,
  canManageAllCommunities: boolean,
  canAssignPlatformRoles: boolean,
}
```

These are computed from the role and provided via context to avoid repeated lookups.

---

## 8. Migration Risks

### 8.1 Critical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Data leakage during migration** — existing data has no community_id; could be visible to all communities or none | High | Run a migration script that assigns all existing data to the original "Insomniacs GMRS" community before enabling multi-tenant queries |
| **Auth system change breaks all existing users** — switching from MyBB bridge to native identity | High | Dual-auth period: support both MyBB bridge and native auth during migration; gradually deprecate MyBB |
| **Password stored in localStorage** — existing sessions have plaintext passwords | High | Force all users to re-authenticate on first visit after migration; new system uses JWT only |
| **Realtime subscriptions leak data** — Base44 subscriptions are global; can't filter by community_id server-side | **Critical** | Client-side filtering as interim; long-term: backend functions with WebSocket rooms scoped by community |
| **PushAlert doesn't support per-community segments natively** — can't target specific community members | High | Use PushAlert segments/tags: tag each subscriber with community_id; filter sends by tag |
| **MyBB bridge hardcoded URL** — all forum functions break for new communities | High | Make bridge URL configurable per community via CommunityForumConfig |
| **Race conditions in community switching** — switching communities while data loads | Medium | Cancel in-flight queries on community switch; show loading state until new community data loads |
| **Orphaned data** — entities created without community_id during migration window | Medium | Add default community_id in all entity schemas; reject creates without community_id at the function level |

### 8.2 Performance Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Query performance with community_id filter** — every query now has an additional filter | Medium | Add database indexes on community_id for all content entities |
| **Community context resolution on every request** — extra DB lookups | Medium | Cache community context in the frontend (TanStack Query with staleTime); cache membership in JWT claims |
| **PushAlert segment lookups** — checking community membership before each push | Low | Pre-compute community → subscriber mapping; cache in memory on function warm |
| **Realtime subscription volume** — thousands of communities × active users | High | Move to room-based WebSocket subscriptions (join room = community_id); only receive events for active community |

### 8.3 Backwards Compatibility Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Existing URLs break** — flat routes → community-scoped routes | High | Redirect old routes to `/c/insomniacs-gmrs/...` (the original community slug) |
| **Existing API consumers break** — if any external integrations call functions directly | Low | Version the API; keep old function signatures working with default community during transition |
| **MyBB deep links break** — forum thread links point to old URLs | Medium | Keep MyBB links working; they're external URLs that don't change |
| **Existing localStorage sessions break** — old format without community context | Medium | Detect old session format on load; force re-authentication |

### 8.4 Data Migration Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Existing ChatMessage records have community_id but it may be empty or wrong** | High | Migration script: set all existing messages to the original community_id |
| **Entities without community_id field** — Repeater, Net, Alert, etc. | High | Schema migration: add community_id with default to original community; backfill all records |
| **User accounts only in MyBB** — no platform User records | High | Migration script: create platform User for every MyBB user; link via email; temporary password |
| **CommunityMember records may be stale** — created during testing | Low | Clean up orphaned memberships during migration |

---

## 9. Implementation Phases

### Phase 0: Preparation (No user-facing changes)

**Goal:** Set up the foundation without breaking existing functionality.

**Tasks:**
1. Create all new entity schemas (PlatformRole, CommunityRole, CommunityForumConfig, CommunityWeatherConfig, CommunityLiveCamConfig, CommunityNotificationConfig, CommunitySettings, CommunityModerationLog, CommunityInvitation, PlatformAuditLog)
2. Add `community_id` field to all existing content entities (Repeater, Net, NetSession, NetCheckIn, NetLog, Event, Alert, GatheringPhoto, MarketplaceItem, ForumPost, ForumCategory, FollowedThread, ChatPresence)
3. Add `slug`, `status`, `plan`, `max_members`, `is_listed` to Community entity
4. Add `scope` field to Alert entity
5. Create the original "Insomniacs GMRS" community record with slug `insomniacs-gmrs`
6. Run data migration: set `community_id` on all existing records to the original community ID
7. Add database indexes on `community_id` for all content entities

**Deliverable:** All schemas updated, data migrated, no UI changes yet.

**Estimated effort:** 1-2 days

---

### Phase 1: Authentication Overhaul

**Goal:** Replace MyBB bridge auth with native platform identity.

**Tasks:**
1. Create `registerMyBBUser` replacement: native registration with email + password + OTP
2. Create `platformAuth` backend function: login → JWT issuance
3. Create `platformRefresh` backend function: refresh token rotation
4. Modify `Login.jsx` to use native auth (keep MyBB as optional "link forum account" flow)
5. Create `Register.jsx` new flow: email → password → OTP → verified
6. Create `PlatformAuthContext` replacing `MyBBAuthContext`
7. Create migration function: MyBB users → platform Users (email match, temp password)
8. Dual-auth period: both MyBB and native auth work simultaneously
9. Create `PlatformRole` assignment function (platform_owner bootstrap)

**Deliverable:** Users can register and log in natively; existing MyBB users are migrated.

**Estimated effort:** 3-4 days

---

### Phase 2: Community Context & Routing

**Goal:** Make the app community-aware with scoped routing.

**Tasks:**
1. Create `CommunityContext` provider
2. Create `CommunityAuthRoute` component (validates membership)
3. Create `PlatformAuthRoute` component
4. Create `PlatformAdminRoute` component
5. Restructure `App.jsx` routes to community-scoped pattern (`/c/:slug/...`)
6. Add redirect from old flat routes to `/c/insomniacs-gmrs/...`
7. Modify `CommunitySelector` to drive route changes (not just localStorage)
8. Modify `AppLayout` to consume `CommunityContext` for branding
9. Create `useCommunity` hook v2: reads from context, not localStorage
10. Create onboarding flow for users with no communities

**Deliverable:** All routes are community-scoped; community switcher works; branding adapts.

**Estimated effort:** 3-4 days

---

### Phase 3: Data Scoping — Backend Functions

**Goal:** All backend functions are community-aware.

**Tasks:**
1. Modify `fetchMyBBForums` to accept `community_id`, look up forum config
2. Modify `mybbMessages` to accept `community_id`
3. Modify `getWeatherData` to accept `community_id`, use community location
4. Modify `sendAlertNotification` to target community PushAlert segment
5. Modify `sendEventNotification` to target community
6. Modify `checkNewChatMessages` to check per-community
7. Modify `checkNewPMs` to check per-community
8. Modify `checkNewThreads` to check per-community
9. Modify `checkFollowedThreads` to check per-community
10. Modify `checkLocationShareRequests` to filter by community
11. Modify `checkEventReminders` to filter by community
12. Modify `uploadGalleryPhoto` to accept and store `community_id`
13. Modify `searchUsers` to search within community
14. Create `createCommunity` full setup function
15. Create `inviteToCommunity` function
16. Create `acceptInvitation` function
17. Create `assignCommunityRole` function
18. Create `removeCommunityMember` function
19. Create `getCommunityConfig` function

**Deliverable:** All backend functions scope data by community.

**Estimated effort:** 4-5 days

---

### Phase 4: Data Scoping — Frontend Pages

**Goal:** All frontend pages consume `CommunityContext` and scope queries.

**Tasks:**
1. Modify `useChat` hook to accept `communityId`; filter all queries
2. Modify `Dashboard.jsx` — all queries filtered by `community_id`
3. Modify `LiveChat.jsx` — pass community to `useChat`
4. Modify `MyBBForum.jsx` — pass community to forum functions
5. Modify `Repeaters.jsx` — filter by community
6. Modify `Nets.jsx` — filter by community
7. Modify `Alerts.jsx` — filter by community
8. Modify `Gallery.jsx` — filter by community
9. Modify `Shopping.jsx` — filter by community
10. Modify `Members.jsx` — show community members with roles
11. Modify `Weather.jsx` — use community weather config
12. Modify `LiveCams.jsx` — use community cam config
13. Modify `MapView.jsx` — filter repeaters by community
14. Modify `Messages.jsx` — scope to community
15. Modify `AddContent.jsx` — pre-fill community_id
16. Modify all create flows (CreateAlert, CreateEvent, CreateNet, AddRepeater) to include community_id
17. Modify `BottomNav` subscriptions to be community-scoped
18. Modify `AlertPoller` to filter by community
19. Modify `SimplexRequestPoller` to filter by community

**Deliverable:** All pages show only the active community's data.

**Estimated effort:** 5-6 days

---

### Phase 5: Permission System

**Goal:** Two-layer permission system is enforced everywhere.

**Tasks:**
1. Create `usePermissions` hook (resolves platform + community permissions)
2. Create `PermissionGate` component (conditionally render based on permissions)
3. Modify all create/delete/moderation buttons to use `PermissionGate`
4. Create `CommunityMembers` page with role management
5. Create `CommunitySettings` page (forum config, weather config, cam config, features)
6. Create `CommunityModeration` page (moderation log)
7. Create `assignCommunityRole` backend function with authorization checks
8. Create `removeCommunityMember` backend function with authorization checks
9. Add backend authorization checks to all content-modifying functions
10. Create `CommunityInvitation` flow (invite, accept, decline)

**Deliverable:** Permissions are enforced on both frontend and backend.

**Estimated effort:** 4-5 days

---

### Phase 6: Platform Admin

**Goal:** Platform administrators can manage all communities.

**Tasks:**
1. Create `PlatformAdminDashboard` page (total communities, users, health metrics)
2. Create `PlatformCommunities` page (list, suspend, activate, archive)
3. Create `PlatformUsers` page (list, assign platform roles, suspend)
4. Create `PlatformAuditLog` page
5. Create `suspendCommunity` backend function (platform_admin+)
6. Create `assignPlatformRole` backend function (platform_owner only)
7. Create `getPlatformStats` backend function
8. Add platform admin link in settings (visible only to platform admins)
9. Bootstrap first platform_owner account

**Deliverable:** Platform admin dashboard is functional.

**Estimated effort:** 3-4 days

---

### Phase 7: Notification System Overhaul

**Goal:** Notifications are community-scoped.

**Tasks:**
1. Configure PushAlert segments/tags per community
2. Modify all notification-sending functions to target community segment
3. Create `UnifiedNotifications` inbox (cross-community, with community badges)
4. Modify `NotificationManager` to register with community tags
5. Add per-community notification preferences in settings
6. Add quiet hours per community
7. Modify `NotificationPrompt` to explain community-scoped notifications

**Deliverable:** Notifications only go to community members.

**Estimated effort:** 2-3 days

---

### Phase 8: Realtime Scoping

**Goal:** Realtime subscriptions only receive events for the active community.

**Tasks:**
1. Evaluate Base44 subscription capabilities for filtering
2. If client-side filtering is the only option: filter in the subscription callback by `community_id` (interim)
3. If backend functions support WebSocket rooms: move subscriptions to room-based model
4. Modify `useChat` to only process events matching active community
5. Modify `AlertPoller` to only process events matching active community
6. Modify `BottomNav` chat subscription to filter by community
7. Add subscription cleanup on community switch

**Deliverable:** Realtime events are community-scoped.

**Estimated effort:** 2-3 days

---

### Phase 9: Community Discovery & Onboarding

**Goal:** New users can discover and join communities.

**Tasks:**
1. Create `DiscoverCommunities` page (browse public communities)
2. Create `Onboarding` flow for new users (no communities)
3. Create community join request flow (for request-mode communities)
4. Create community invite acceptance flow
5. Add community directory with search and categories
6. Add "Create Community" wizard (full setup: name, slug, forum, weather, features)

**Deliverable:** New users can find and join communities; anyone can create one.

**Estimated effort:** 3-4 days

---

### Phase 10: Testing, Polish & Documentation

**Goal:** Production-ready multi-tenant platform.

**Tasks:**
1. End-to-end testing of multi-community flows (create, switch, data isolation)
2. Permission boundary testing (role escalation attempts, cross-community access)
3. Performance testing with multiple communities and users
4. Update all API documentation (docs/api/*)
5. Update database schema documentation (docs/database/*)
6. Create architecture decision records (ADRs) for key decisions
7. Create admin runbook for platform operations
8. Create community admin guide
9. Migrate existing data to production (after test database validation)
10. Deprecate dual-auth (remove MyBB bridge as login option)

**Deliverable:** Fully tested, documented, production-ready.

**Estimated effort:** 4-5 days

---

### Phase Summary

| Phase | Name | Effort | Dependencies |
|-------|------|--------|--------------|
| 0 | Preparation | 1-2 days | None |
| 1 | Auth Overhaul | 3-4 days | Phase 0 |
| 2 | Community Context & Routing | 3-4 days | Phase 1 |
| 3 | Backend Data Scoping | 4-5 days | Phase 0, 2 |
| 4 | Frontend Data Scoping | 5-6 days | Phase 2, 3 |
| 5 | Permission System | 4-5 days | Phase 2, 3 |
| 6 | Platform Admin | 3-4 days | Phase 5 |
| 7 | Notification Overhaul | 2-3 days | Phase 3 |
| 8 | Realtime Scoping | 2-3 days | Phase 4 |
| 9 | Discovery & Onboarding | 3-4 days | Phase 5 |
| 10 | Testing & Documentation | 4-5 days | All |

**Total estimated effort:** 34-46 days

---

## Architectural Decisions Summary

### Decision 1: Community as Tenant Boundary
Every piece of content belongs to exactly one community. The `community_id` is the tenant isolation key. No content query may execute without it.

### Decision 2: Two-Layer Permissions
Platform roles (owner, admin, support) are separate from community roles (owner, admin, moderator, trusted_member, member, guest). A user's platform role does not automatically grant community-level access, except for platform_admin who can access any community for support/administration.

### Decision 3: Native Identity Replaces MyBB
Platform identity is native (email + password + JWT). MyBB becomes an optional, swappable forum adapter configured per community. This decouples user identity from any specific forum software.

### Decision 4: URL-Based Community Context
Community context is in the URL (`/c/:slug/...`), not in localStorage. This enables deep linking, sharing, and browser navigation. The `CommunityContext` provider reads from the URL.

### Decision 5: Swappable Forum Adapter
Each community can choose its forum backend (MyBB, Discourse, native, none). The `CommunityForumConfig` entity stores the adapter type and connection details. All forum API calls route through the configured adapter.

### Decision 6: PushAlert Segments for Community Targeting
PushAlert subscriber segments/tags are used to target notifications per community. Each subscriber is tagged with their community IDs. Notification sends filter by community tag.

### Decision 7: Backend Authorization Enforcement
Permissions are enforced at the backend function level, not just the frontend. Every content-modifying function validates the user's role before executing. Frontend permission gates are a UX convenience, not a security boundary.

### Decision 8: Gradual Migration with Dual-Auth
The migration uses a dual-auth period where both MyBB bridge and native auth work simultaneously. This prevents breaking existing users during the transition. MyBB bridge is deprecated only after all users are migrated.

---

## Approval

This document is submitted for review. No code changes will be made until the architecture is approved. Please review each section and provide feedback or approval to proceed with Phase 0.