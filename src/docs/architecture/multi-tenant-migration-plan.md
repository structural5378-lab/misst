# MIST SaaS Platform — Architecture Document

> **Status:** DRAFT — Awaiting Approval
> **Author:** Lead Software Architect
> **Date:** 2026-07-10
> **Decision Required:** Do NOT implement until this document is reviewed and approved.

---

## Table of Contents

1. [Current Architecture Audit](#1-current-architecture-audit)
2. [SaaS Platform Requirements](#2-saas-platform-requirements)
3. [Required Database Changes](#3-required-database-changes)
4. [Required API Changes](#4-required-api-changes)
5. [Required Authentication Changes](#5-required-authentication-changes)
6. [Required Routing Changes](#6-required-routing-changes)
7. [Required UI Changes](#7-required-ui-changes)
8. [Required Permission Changes](#8-required-permission-changes)
9. [Migration Risks](#9-migration-risks)
10. [Implementation Phases](#10-implementation-phases)
11. [Future-Proofing Design](#11-future-proofing-design)

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

**Critical problems for SaaS:**
1. **No native identity system** — users don't exist outside MyBB
2. **Password stored in localStorage** in plaintext (security risk)
3. **No concept of platform-level vs community-level identity**
4. **Single MyBB instance** — can't support multiple communities with different forums
5. **No JWT/token-based auth** — session is a localStorage blob
6. **No role separation** — `mybbUser.role` is a single string with no platform vs community distinction
7. **No global account** — identity is tied to one forum installation

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

## 2. SaaS Platform Requirements

### 2.1 Core SaaS Principles

MIST is designed as a **true SaaS platform**, not a multi-community application. The distinction:

| Multi-Community App | SaaS Platform (MIST) |
|---------------------|----------------------|
| One app, multiple groups | One platform, unlimited independent tenants |
| Shared data, grouped by field | Complete data isolation per tenant |
| Single auth, role per group | Global identity + per-tenant role matrix |
| Fixed feature set | Per-tenant feature configuration |
| One deployment | Multi-tenant, horizontally scalable |
| Admin manages all | Platform admin separate from community admin |

### 2.2 Requirement 1: Global MIST Account

Every user has exactly **one global MIST account** that exists independently of any community.

- **Identity is platform-level:** A user registers once on MIST with email + password. This account never changes regardless of how many communities they join or leave.
- **Profile is platform-level:** The user's display name, avatar, bio, callsign, and preferences belong to their global account, not to any community.
- **Community profiles are separate:** A user may have a per-community display name, callsign, or role that differs from their global profile. The global profile is the default; community profiles override where configured.
- **Account portability:** If a user leaves a community, their global account and profile remain intact. They can join other communities without re-registering.

### 2.3 Requirement 2: Unlimited Community Membership

One user may belong to **unlimited communities** simultaneously.

- **Membership is a join table:** `CommunityMember` links a global user to a community with a role. There is no limit on the number of memberships.
- **Active community:** At any given time, one community is "active" in the user's session. The user can switch between communities instantly. All data, navigation, and context reflect the active community.
- **Cross-community inbox:** The user has a unified notification inbox that aggregates notifications across all their communities, with community badges for identification.
- **No re-authentication on switch:** Switching communities does not require re-login. The user's JWT is valid platform-wide; community membership is resolved from the token claims or a separate membership lookup.

### 2.4 Requirement 3: Multiple Community Ownership

One user may **own multiple communities**.

- **Ownership is a role:** `CommunityRole` with `role = "community_owner"` links a user to a community they own. There is no limit on how many communities a user can own.
- **Ownership transfer:** A community owner can transfer ownership to another member. The previous owner becomes a community_admin.
- **Ownership delegation:** A community owner can assign multiple community_admins but there is exactly one community_owner at a time (for accountability).

### 2.5 Requirement 4: Complete Community Isolation

Every community is **completely isolated** from every other community except where explicitly shared.

- **Data isolation:** No query can cross community boundaries unless explicitly designed to (e.g., platform-shared repeater directory). Every content query includes `community_id` as a mandatory filter.
- **No data leakage:** A member of Community A cannot see, query, or subscribe to any data from Community B. This is enforced at the backend, not just the frontend.
- **Explicit sharing:** The only cross-community data is:
  - Platform-wide shared repeater directory (flagged with `is_public_platform = true`)
  - Platform-wide propagation and solar data (physics is global)
  - Platform admin views (for administration only, not regular users)
- **File isolation:** Uploaded files (avatars, gallery photos, etc.) are scoped to the community that owns them. File URLs include community context for access control.
- **Notification isolation:** Push notifications, emails, and in-app notifications only reach members of the originating community.

### 2.6 Requirement 5: Every Feature is Community-Aware

Every feature in MIST belongs to a community. No feature operates at the platform level except platform admin tools.

| Feature | Community-Aware Design |
|---------|----------------------|
| **Forums** | Each community configures its own forum adapter (MyBB, Discourse, native, none). Forum categories, threads, and posts are scoped to the community. |
| **Live Chat** | Chat messages, presence, and typing indicators are scoped to the community. A user in Community A's chat cannot see Community B's chat. |
| **Repeaters** | Repeaters belong to a community. A community can optionally share repeaters to the platform-wide directory (`is_public_platform = true`). |
| **Weather** | Each community configures its default location, radar settings, and storm tracking preferences. Weather data is fetched for the community's location. |
| **Maps** | Maps show the active community's repeaters, members (who opt in), events, and location shares. No cross-community data on the map. |
| **Gallery** | Photos belong to a community. Gallery groups (e.g., "June 2026 Gathering") are scoped to the community. |
| **Live Cameras** | Each community configures its own live camera list. No hardcoded camera lists. |
| **Shopping** | Marketplace items belong to a community. A community can configure whether its marketplace is members-only or public. |
| **Events** | Events belong to a community. Event reminders only notify community members. |
| **Files** | All file uploads (photos, avatars, attachments) are scoped to the community. File access is validated against community membership. |
| **Notifications** | Notifications are scoped to the community. PushAlert segments/tags per community. Notification preferences are per-community. |
| **AI Features** | AI features (InvokeLLM, GenerateImage, etc.) operate within the community context. AI prompts can include community-specific data. AI usage is tracked per-community for billing. |

### 2.7 Requirement 6: Community Owner Customization

Community Owners can **fully customize their community** without platform admin involvement.

| Customization | Scope | Storage |
|---------------|-------|---------|
| **Logo** | Header, favicon, loading screen | `Community.logo_url` |
| **Banner** | Dashboard hero, login page (if public) | `Community.banner_url` (NEW field) |
| **Theme colors** | Primary, accent, background across all community pages | `CommunitySettings.primary_color`, `accent_color`, `theme_override` |
| **Home page widgets** | Dashboard layout — which widgets to show, order, visibility | `CommunitySettings.dashboard_widgets` (JSON array) |
| **Navigation** | Bottom nav items, order, visibility per role | `CommunitySettings.nav_config` (JSON) |
| **Forum structure** | Categories, order, permissions | `ForumCategory` entities scoped to community |
| **Roles** | Custom roles beyond the 6 built-in, with custom permissions | `CommunityCustomRole` entity (NEW) |
| **Permissions** | Fine-grained permission overrides per role | `CommunityRolePermission` entity (NEW) |
| **Public/Private visibility** | Whether community is listed publicly, join mode | `CommunitySettings.is_public`, `join_mode` |

### 2.8 Requirement 7: Hidden Master Admin Dashboard

The Platform Owner has a **hidden Master Admin dashboard** that is completely separate from every community.

- **Separate route namespace:** `/platform/admin/*` — completely separate from `/c/:slug/*`
- **Separate auth gate:** `PlatformAdminRoute` checks `PlatformRole`, not `CommunityRole`
- **No community context:** The master admin dashboard does not load community branding, navigation, or data. It has its own layout, navigation, and styling.
- **Platform-level data only:** The dashboard shows platform-wide metrics: total communities, total users, platform health, billing, audit log.
- **Hidden from regular users:** No link to `/platform/admin` appears in the regular UI. Only users with a `PlatformRole` see the link in their settings.
- **Bootstrap:** The first platform_owner is bootstrapped via a secure, one-time setup function. Subsequent platform roles are assigned by existing platform_owners.

### 2.9 Requirement 8: Future-Proof Architecture

The architecture must support future expansion **without database redesign**:

| Future Feature | How Architecture Supports It |
|----------------|------------------------------|
| **Subscription plans** | `Community.plan` field (free/pro/enterprise) + `Subscription` entity (NEW, ready for billing integration). Feature flags in `CommunitySettings.features_enabled` gate features by plan. |
| **Custom domains** | `CommunityCustomDomain` entity (NEW) maps domain → community. Routing middleware resolves domain before URL routing. |
| **API integrations** | `CommunityIntegration` entity (NEW) stores per-community external API configs (Slack, Discord, webhooks, etc.). Backend functions read config per community. |
| **Plugins** | `CommunityPlugin` entity (NEW) tracks installed plugins per community. Plugin system uses event hooks — plugins register handlers for entity events. |
| **Mobile applications** | API-first design means all functionality is accessible via REST API. Mobile apps authenticate with JWT and pass `X-Community-Id` header. No frontend coupling. |
| **Enterprise organizations** | `Organization` entity (NEW, optional parent of communities) allows grouping multiple communities under an enterprise account with shared billing and admin. |

### 2.10 Requirement 9: Globally Unique IDs & Horizontal Scaling

Every database entity uses **globally unique IDs** and is designed for horizontal scaling.

- **ID strategy:** All entities use Base44's built-in `id` field, which is a UUID — globally unique across the entire platform. No auto-increment integers that could collide across shards.
- **No sequential IDs:** No entity relies on sequential numbering (e.g., `checkin_number` in NetLog is a display field, not a primary key).
- **Shard-ready:** All queries include `community_id` as a filter, which is a natural shard key. Data for a community can be co-located on the same shard.
- **No cross-entity sequential dependencies:** No entity depends on another entity's sequential ID. All references use UUID.
- **Index strategy:** Every content entity has an index on `community_id` + `created_date` for efficient scoped pagination.
- **Future migration path:** If MIST outgrows Base44's database, the UUID-based schema can be migrated to a sharded PostgreSQL or MongoDB cluster without ID conflicts.

---

## 3. Required Database Changes

### 3.1 New Entities Required

#### 3.1.1 PlatformRole
```
Purpose: Stores platform-level role assignments (separate from community roles)
Fields:
  - user_id: string (required) — references User.id (UUID)
  - user_email: string
  - role: enum ["platform_owner", "platform_admin", "platform_support"]
  - assigned_by: string — User.id of assigner
  - assigned_date: date-time
  - is_active: boolean
Required: [user_id, role]
```

#### 3.1.2 CommunityRole
```
Purpose: Stores per-community role assignments for each member
Fields:
  - user_id: string (required) — global MIST user ID (UUID)
  - user_email: string
  - community_id: string (required) — references Community.id
  - role: enum ["community_owner", "community_admin", "moderator", "trusted_member", "member", "guest"]
  - assigned_by: string
  - assigned_date: date-time
  - is_active: boolean
Required: [user_id, community_id, role]
```

#### 3.1.3 CommunityCustomRole
```
Purpose: Allows community owners to create custom roles beyond the 6 built-in roles
Fields:
  - community_id: string (required)
  - role_name: string (required) — e.g. "Net Control Operator", "Event Coordinator"
  - role_key: string (required) — URL-safe key, unique within community
  - base_role: enum ["community_admin", "moderator", "trusted_member", "member", "guest"]
  - description: string
  - color: string — badge color
  - is_active: boolean
Required: [community_id, role_name, role_key, base_role]
```

#### 3.1.4 CommunityRolePermission
```
Purpose: Fine-grained permission overrides per role per community
Fields:
  - community_id: string (required)
  - role_key: string (required) — references built-in or custom role
  - permission: string (required) — e.g. "can_create_alert", "can_moderate_chat"
  - is_granted: boolean — true = explicitly granted, false = explicitly denied
Required: [community_id, role_key, permission]
```

#### 3.1.5 CommunityForumConfig
```
Purpose: Stores per-community forum adapter configuration (supports swappable forums)
Fields:
  - community_id: string (required)
  - forum_type: enum ["mybb", "discourse", "native", "none"]
  - forum_url: string
  - bridge_url: string — API endpoint for forum bridge
  - bridge_secret_ref: string — reference to secret, not plaintext
  - bot_username: string
  - bot_password_secret_ref: string — reference to secret
  - is_active: boolean
Required: [community_id, forum_type]
```

#### 3.1.6 CommunityWeatherConfig
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

#### 3.1.7 CommunityLiveCamConfig
```
Purpose: Stores per-community live camera configurations
Fields:
  - community_id: string (required)
  - cameras: string (JSON array of {name, location, url, type, youtubeId})
  - is_active: boolean
Required: [community_id]
```

#### 3.1.8 CommunityNotificationConfig
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

#### 3.1.9 CommunitySettings
```
Purpose: Stores per-community general settings, feature flags, and customization
Fields:
  - community_id: string (required)
  - features_enabled: string (JSON: {chat: true, forum: true, weather: true, ...})
  - dashboard_widgets: string (JSON array: [{widget: "alerts", order: 1, visible: true}, ...])
  - nav_config: string (JSON: [{icon: "Home", label: "Home", path: "/", order: 1, roles: ["member", "moderator", ...]}, ...])
  - primary_color: string
  - accent_color: string
  - theme_override: string
  - banner_url: string
  - max_members: number
  - is_public: boolean — can non-members see this community?
  - join_mode: enum ["open", "invite", "request", "closed"]
  - marketplace_public: boolean
  - created_date: date-time
Required: [community_id]
```

#### 3.1.10 CommunityModerationLog
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

#### 3.1.11 CommunityInvitation
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

#### 3.1.12 PlatformAuditLog
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

#### 3.1.13 Subscription (future-ready)
```
Purpose: Tracks community subscription plans and billing (ready for future billing integration)
Fields:
  - community_id: string (required)
  - plan: enum ["free", "pro", "enterprise"]
  - status: enum ["active", "trialing", "past_due", "canceled", "suspended"]
  - billing_email: string
  - trial_ends_at: date-time
  - current_period_start: date-time
  - current_period_end: date-time
  - seats: number — number of member licenses included
  - stripe_customer_id: string (future)
  - stripe_subscription_id: string (future)
  - created_date: date-time
Required: [community_id, plan, status]
```

#### 3.1.14 CommunityCustomDomain (future-ready)
```
Purpose: Maps custom domains to communities
Fields:
  - community_id: string (required)
  - domain: string (required, unique) — e.g. "mist.myclub.com"
  - is_verified: boolean
  - verified_at: date-time
  - ssl_status: enum ["pending", "active", "failed"]
  - created_date: date-time
Required: [community_id, domain]
```

#### 3.1.15 CommunityIntegration (future-ready)
```
Purpose: Stores per-community external API integration configurations
Fields:
  - community_id: string (required)
  - integration_type: enum ["slack", "discord", "webhook", "zapier", "custom"]
  - config: string (JSON — integration-specific config)
  - secret_ref: string — reference to stored secret
  - is_active: boolean
  - created_date: date-time
Required: [community_id, integration_type]
```

#### 3.1.16 CommunityPlugin (future-ready)
```
Purpose: Tracks installed plugins per community
Fields:
  - community_id: string (required)
  - plugin_id: string — global plugin registry ID
  - plugin_name: string
  - plugin_version: string
  - config: string (JSON)
  - is_active: boolean
  - installed_by: string
  - installed_date: date-time
Required: [community_id, plugin_id]
```

#### 3.1.17 Organization (future-ready)
```
Purpose: Optional parent entity for grouping communities under an enterprise account
Fields:
  - name: string (required)
  - slug: string (required, unique)
  - owner_id: string — User.id
  - owner_email: string
  - billing_email: string
  - is_active: boolean
  - created_date: date-time
Required: [name, slug, owner_id]
```

#### 3.1.18 OrganizationMember (future-ready)
```
Purpose: Links communities to an organization
Fields:
  - organization_id: string (required)
  - community_id: string (required)
  - is_active: boolean
  - joined_date: date-time
Required: [organization_id, community_id]
```

### 3.2 Existing Entities — Required Modifications

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

### 3.3 Community Entity — Required Enhancements

The existing Community entity needs additional fields:

```
Current fields: name, callsign, description, logo_url, primary_color,
                founder_uid, founder_name, is_active, member_count, created_date

ADD:
  - slug: string (required, unique) — URL-safe identifier for routing
  - banner_url: string — dashboard hero banner
  - status: enum ["active", "suspended", "pending", "archived"]
  - plan: enum ["free", "pro", "enterprise"] — subscription tier
  - max_members: number (default 1000)
  - is_listed: boolean — appears in public community directory
  - organization_id: string (optional) — parent organization for enterprise
  - suspended_reason: string
  - suspended_date: date-time
  - platform_owner_id: string — platform admin who approved
```

### 3.4 User Entity — Required Enhancements

The built-in User entity needs additional fields for global SaaS identity:

```
Current built-in: id, created_date, full_name, email, role

ADD (via write_file on User.jsonc):
  - avatar_url: string — global profile avatar
  - bio: string — global profile bio
  - callsign: string — global radio callsign (can be overridden per community)
  - location: string — global location
  - radios: string (JSON array) — radio equipment list
  - last_active: date-time
  - notification_preferences: string (JSON) — global notification settings
  - is_platform_suspended: boolean — platform admin can suspend a user
```

### 3.5 Data Isolation Model

**Rule:** Every database query for content entities MUST include `community_id` in its filter. The ONLY exceptions are:
- Platform-level entities (PlatformRole, PlatformAuditLog, Community, Organization)
- Cross-community shared repeaters (flagged with `is_public_platform = true`)
- Global physics data (propagation, solar weather — not stored, fetched live)

**Enforcement:** This is enforced at the service/repository layer, not at the UI level. The frontend passes `community_id` from a context provider; the backend validates it against the user's membership.

---

## 4. Required API Changes

### 4.1 New API Modules Required

#### 4.1.1 Platform Admin API
```
POST   /api/platform/roles/assign          — Assign platform role (platform_owner only)
DELETE /api/platform/roles/:userId          — Revoke platform role
GET    /api/platform/roles                  — List all platform roles
GET    /api/platform/communities            — List all communities (paginated)
PATCH  /api/platform/communities/:id/status — Suspend/activate/archive community
GET    /api/platform/users                   — List all platform users
PATCH  /api/platform/users/:id/status        — Suspend/activate user
GET    /api/platform/audit-log               — Platform audit log
GET    /api/platform/stats                   — Platform-wide statistics
GET    /api/platform/subscriptions           — All subscriptions (future)
```

#### 4.1.2 Community Management API
```
POST   /api/communities                     — Create community
GET    /api/communities                      — List user's communities
GET    /api/communities/:slug                — Get community by slug
GET    /api/communities/discover             — Browse public communities
PATCH  /api/communities/:id                  — Update community (community_admin+)
DELETE /api/communities/:id                  — Delete community (community_owner only)
POST   /api/communities/:id/transfer         — Transfer ownership (community_owner only)
POST   /api/communities/:id/invite           — Send invitation
POST   /api/communities/:id/join             — Join via invite token
POST   /api/communities/:id/request-join     — Request to join (request mode)
DELETE /api/communities/:id/members/:userId  — Remove member (moderator+)
PATCH  /api/communities/:id/members/:userId   — Change member role (community_admin+)
GET    /api/communities/:id/members           — List community members
GET    /api/communities/:id/settings         — Get community settings
PATCH  /api/communities/:id/settings          — Update settings (community_admin+)
GET    /api/communities/:id/roles             — List roles (built-in + custom)
POST   /api/communities/:id/roles             — Create custom role (community_owner only)
PATCH  /api/communities/:id/roles/:key        — Update custom role
DELETE /api/communities/:id/roles/:key        — Delete custom role
GET    /api/communities/:id/permissions       — Get permission matrix
PATCH  /api/communities/:id/permissions       — Update permission overrides (community_owner only)
GET    /api/communities/:id/moderation-log    — Moderation log (moderator+)
```

#### 4.1.3 Community-Scoped Content APIs
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
POST   /api/communities/:slug/files                   — Upload file (scoped)
GET    /api/communities/:slug/ai/invoke               — AI invocation (scoped, tracked)
```

### 4.2 Existing Backend Functions — Required Changes

Every backend function must be modified to accept `community_id` and scope all operations.

| Function | Current Behavior | Required Change |
|----------|-----------------|-----------------|
| `mybbAuth` | Authenticates against single MyBB | Deprecated as login; becomes forum-linking utility per community |
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
| `uploadAvatar` | No community context | Acceptable — avatars are platform-level (global user identity) |

### 4.3 New Backend Functions Required

| Function | Purpose |
|----------|---------|
| `platformAuth` | Native login → JWT issuance (replaces mybbAuth as login) |
| `platformRegister` | Native registration with email + password + OTP |
| `platformRefresh` | Refresh token rotation |
| `createCommunity` | Full community setup: create Community, CommunitySettings, CommunityForumConfig, CommunityWeatherConfig, assign founder as community_owner |
| `inviteToCommunity` | Generate invite token, send email |
| `acceptInvitation` | Validate token, create CommunityMember + CommunityRole |
| `assignCommunityRole` | Change member's role within community |
| `removeCommunityMember` | Remove member from community |
| `transferCommunityOwnership` | Transfer ownership to another member |
| `getCommunityConfig` | Aggregate all community config for frontend context |
| `createCustomRole` | Create custom community role |
| `updatePermissionOverride` | Override a permission for a role |
| `assignPlatformRole` | Platform-level role assignment (platform_owner only) |
| `suspendCommunity` | Platform admin suspends a community |
| `suspendUser` | Platform admin suspends a user |
| `getPlatformStats` | Platform-wide dashboard data |
| `discoverCommunities` | Browse public communities with search/filter |
| `requestToJoin` | Request to join a request-mode community |
| `approveJoinRequest` | Community admin approves a join request |
| `moderateContent` | Create moderation log entry, take action on content |
| `trackAIUsage` | Track AI feature usage per community for future billing |

---

## 5. Required Authentication Changes

### 5.1 Identity System Overhaul

**Current:** MyBB bridge → localStorage blob (no tokens, password in plaintext)

**Required:** Two-layer identity system

#### Layer 1: Platform Identity (Native, Global)
- Users register with email + password on MIST platform directly — **one global account**
- JWT-based authentication (access token + refresh token)
- Platform identity is independent of any forum system or community
- Stores: email, password_hash, full_name, avatar, callsign, bio, platform_role
- This replaces the MyBB bridge as the primary auth mechanism
- A user's global account persists across all communities

#### Layer 2: Community Membership
- After platform authentication, user's community memberships are resolved
- Each membership includes a community role (built-in or custom)
- User can belong to **unlimited communities** simultaneously
- One community is "active" at a time (stored in session/context)
- Community profiles (display name, callsign) can override global profile where configured

### 5.2 Auth Flow — New Design

```
Registration (creates global MIST account):
  User enters email + password
    → Platform creates User record (unverified)
    → OTP sent to email
    → User verifies OTP
    → Platform identity established
    → User can now discover/join/create communities

Login (global, not community-specific):
  User enters email + password
    → Platform validates credentials
    → Returns JWT access token (contains user_id, email, platform_role)
    → Frontend stores token (httpOnly cookie or secure storage)
    → Frontend fetches user's community memberships
    → If user has communities → set active community → load dashboard
    → If user has no communities → show community discovery/onboarding

Community Context (per request):
  On every API call, frontend includes:
    - Authorization: Bearer <jwt>
    - X-Community-Id: <active_community_id>
  Backend validates:
    1. JWT is valid
    2. User is member of X-Community-Id
    3. User's role in that community permits the requested action

Community Switching (no re-auth):
  User taps community switcher → selects different community
    → Frontend updates active community in context
    → Frontend updates URL to /c/:new-slug/...
    → All queries re-fetch with new community_id
    → No re-authentication required (JWT is platform-wide)
```

### 5.3 MyBB Forum Bridge — New Role

MyBB becomes an **optional, swappable forum adapter** per community:
- A community can choose: MyBB, Discourse, native forum, or no forum
- If MyBB is selected, the community admin configures the bridge URL and credentials
- Forum auth is linked to platform identity (not separate credentials)
- The `mybbAuth` function is deprecated as a login mechanism; it becomes a forum-linking utility

### 5.4 Session Management

| Aspect | Current | Required |
|--------|---------|----------|
| Token storage | localStorage (plaintext password) | httpOnly cookie or in-memory token |
| Token type | None (localStorage blob) | JWT (access + refresh) |
| Session expiry | Never (until logout) | Access token: 15min; Refresh token: 7 days |
| Multi-community | Not supported | Unlimited memberships; active community in context |
| Platform roles | Not supported | PlatformRole entity |
| Community roles | Single string in MyBB user | CommunityRole entity per community |
| Global account | Not supported | One global User per person |

### 5.5 Migration Considerations for Existing Users

Existing MyBB users must be migrated to platform identity:
1. **Migration function** reads all MyBB users
2. Creates platform User records with email from MyBB (deduplicates by email)
3. Sets a temporary password (forces reset on first login)
4. Links MyBB account as forum adapter for the migrated community
5. Existing MyBB roles map to community roles: MyBB admin → community_admin, MyBB moderator → moderator, MyBB member → member
6. All existing MyBB users are added as members of the original "Insomniacs GMRS" community

---

## 6. Required Routing Changes

### 6.1 Current Routing

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

### 6.2 Required Routing — SaaS Platform Structure

```
PLATFORM AUTH (no community context)
/login
/register
/forgot-password
/reset-password

PLATFORM-LEVEL (authenticated, no community required)
/onboarding                    — New user, no communities yet
/discover                      — Browse public communities
/settings                      — Global account settings (profile, security, notifications)
/notifications                 — Unified cross-community notification inbox
/tools                         — Stateless calculators (no community needed)

COMMUNITY-SCOPED (authenticated + community member)
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
/c/:slug/settings              — Community settings (community_admin+)
/c/:slug/members/manage        — Member management (community_admin+)
/c/:slug/moderation            — Moderation log (moderator+)

PLATFORM ADMIN (hidden, platform role required)
/platform/admin                — Master admin dashboard
/platform/admin/communities    — Manage all communities
/platform/admin/users          — Manage all platform users
/platform/admin/roles          — Manage platform roles
/platform/admin/audit-log      — Platform action history
/platform/admin/subscriptions  — Subscription management (future)
/platform/admin/billing        — Platform billing (future)
```

### 6.3 Route Protection Layers

```javascript
// Layer 1: Platform auth — user must be logged in
<Route element={<PlatformAuthRoute />}>
  <Route path="/onboarding" element={<Onboarding />} />
  <Route path="/discover" element={<DiscoverCommunities />} />
  <Route path="/settings" element={<PlatformSettings />} />
  <Route path="/notifications" element={<UnifiedNotifications />} />
  <Route path="/tools" element={<Tools />} />

  // Layer 2: Community auth — user must be member of :slug community
  <Route element={<CommunityAuthRoute />}>
    <Route path="/c/:slug" element={<Dashboard />} />
    <Route path="/c/:slug/chat" element={<LiveChat />} />
    // ... all community-scoped routes
  </Route>

  // Layer 3: Platform admin — user must have platform role (hidden)
  <Route element={<PlatformAdminRoute />}>
    <Route path="/platform/admin" element={<PlatformAdminDashboard />} />
    // ... platform admin routes
  </Route>
</Route>
```

### 6.4 Community Context Provider

A new `CommunityContext` replaces the current localStorage-based approach:

```
CommunityContext {
  community: Community          — full community object
  communityId: string           — convenience (UUID)
  communitySlug: string         — for routing
  communitySettings: object     — features, nav config, theme, widgets
  memberRole: string            — user's role in this community
  customRole: object | null     — custom role details if applicable
  permissions: string[]         — resolved permission list (built-in + overrides)
  switchCommunity(slug): void   — switch active community (no re-auth)
  refresh(): void               — re-fetch community data
}
```

This context is populated by `CommunityAuthRoute` from the URL `:slug` parameter. All community-scoped pages consume this context instead of reading localStorage.

### 6.5 Custom Domain Resolution (Future-Ready)

When custom domains are implemented:
1. Request arrives at `mist.myclub.com`
2. Middleware checks `CommunityCustomDomain` for domain match
3. Resolves to community slug
4. Rewrites internal route to `/c/:slug/...`
5. Community branding applied from resolved community

---

## 7. Required UI Changes

### 7.1 New Screens Required

| Screen | Route | Purpose |
|--------|-------|---------|
| Onboarding | `/onboarding` | New user with no communities — discover or create |
| DiscoverCommunities | `/discover` | Browse public communities, search, request to join |
| PlatformSettings | `/settings` | Global account settings (profile, security, connected accounts, notification preferences) |
| UnifiedNotifications | `/notifications` | Cross-community notification inbox with community badges |
| CommunitySettings | `/c/:slug/settings` | Community admin settings (features, appearance, forum config, weather config, cam config, nav, widgets) |
| CommunityMembersManage | `/c/:slug/members/manage` | Member list with role management (community_admin+) |
| CommunityModeration | `/c/:slug/moderation` | Moderation log and actions (moderator+) |
| CommunityRoles | `/c/:slug/settings/roles` | Custom role management (community_owner only) |
| PlatformAdminDashboard | `/platform/admin` | Master admin — platform overview, total communities, users, health |
| PlatformCommunities | `/platform/admin/communities` | Manage all communities (suspend, activate, archive) |
| PlatformUsers | `/platform/admin/users` | Manage platform users, assign platform roles, suspend |
| PlatformAuditLog | `/platform/admin/audit-log` | Platform action history |

### 7.2 Modified Screens

| Screen | Current | Required Change |
|--------|---------|-----------------|
| Dashboard | Global data | All queries filtered by `community_id` from context; header shows community name/logo/banner; widgets from community settings |
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
| Profile | Platform user only | Global profile + per-community profile overrides |
| Messages | Single MyBB PMs | Community-scoped messaging (if forum adapter supports PMs) |
| AddContent | No community context | Pre-fills `community_id` from context on all create flows |
| CreateCommunity | Basic creation | Full setup wizard: name, slug, forum config, weather config, features, nav, theme |
| AppLayout | Hardcoded branding | Dynamic branding from active community (logo, banner, colors, nav, widgets) |
| BottomNav | Global subscriptions | Subscriptions scoped to active community; nav items from community settings |
| CommunitySelector | localStorage only | Drives CommunityContext; triggers route change to `/c/:slug`; no page reload |

### 7.3 Dynamic Community Branding

The app shell dynamically adapts to the active community:
- Logo in header → community logo
- Banner on dashboard → community banner
- Primary color → community primary_color (CSS variable override)
- Accent color → community accent_color
- App name in header → community name
- Favicon → community favicon (if configured)
- Bottom nav items → from community nav_config
- Dashboard widgets → from community dashboard_widgets config

### 7.4 Community Switcher

The community switcher is prominent and accessible:
- In the header (current position, enhanced)
- Shows all communities user belongs to with logos
- Shows unread notification counts per community
- Switching changes the route AND the context AND refreshes all data
- No page reload (unlike current `window.location.reload()`)
- Quick-switch with long-press for power users

### 7.5 Empty States

Every community-scoped screen needs community-aware empty states:
- "No messages yet — start the conversation" (Chat)
- "No repeaters added — add your first repeater" (Repeaters)
- "No upcoming nets — create a net" (Nets)
- "No photos — upload gathering memories" (Gallery)
- "No alerts — all clear" (Alerts)
- "No events scheduled — create one" (Events)
- "No marketplace listings — list an item" (Shopping)
- "No members yet — invite people" (Members)

### 7.6 Permission-Gated UI

UI elements show/hide based on resolved permissions (built-in + overrides):
- "Create Alert" button → only visible if `can_create_alert`
- "Create Event" button → only visible if `can_create_event`
- "Create Net" button → only visible if `can_create_net`
- "Delete message" option → only for message author or `can_moderate_chat`
- "Manage Members" → only if `can_manage_members`
- "Community Settings" → only if `can_manage_settings`
- "Custom Roles" → only if `is_community_owner`
- "Platform Admin" link → only if `is_platform_admin`
- "Moderation Log" → only if `can_moderate_chat` or `can_moderate_forum`

### 7.7 Master Admin Dashboard UI

The `/platform/admin/*` pages have a **completely separate UI**:
- Separate layout component (no community branding, no bottom nav)
- Platform-level navigation sidebar
- Platform-level metrics dashboard
- Platform-level data tables (communities, users, audit log)
- No community context provider
- Distinct visual style (neutral, admin-focused — not community-themed)

---

## 8. Required Permission Changes

### 8.1 Two-Layer Permission System

#### Layer 1: Platform Permissions

| Role | Permissions |
|------|-------------|
| **Platform Owner** | Full platform control: create/suspend/archive communities, assign platform roles, access platform audit log, platform billing, platform settings, bootstrap first owner |
| **Platform Administrator** | Manage all communities (suspend/activate), manage users (suspend/activate), view audit log, support communities, view all community data for support |
| **Platform Support** | View-only access to communities and users for support purposes; cannot modify |

**Enforcement:** PlatformRole entity + `PlatformAdminRoute` component + backend function checks.

#### Layer 2: Community Permissions

| Role | Permissions |
|------|-------------|
| **Community Owner** | Full community control: delete community, transfer ownership, assign community_admin, create custom roles, override permissions, all community settings, all content moderation, customize branding/nav/widgets |
| **Community Administrator** | Manage members (invite, remove, change roles up to moderator), manage all community settings (except deletion/transfer/custom roles), moderate all content, create alerts/events/nets |
| **Moderator** | Moderate chat (delete messages, mute users), moderate forum (delete threads/posts, lock threads), create nets, view moderation log |
| **Trusted Member** | Create forum threads, upload gallery photos, post in chat, create marketplace listings, check into nets |
| **Member** | Read all community content, post in chat, reply to forum threads, check into nets |
| **Guest** | Read-only access to public community content (if community is_public = true); cannot post |

### 8.2 Custom Roles & Permission Overrides

Community Owners can create **custom roles** and **override permissions**:

- **Custom roles** extend a built-in base role with a custom name and color. They inherit the base role's permissions unless overridden.
- **Permission overrides** allow a community owner to grant or deny specific permissions per role. For example, a community owner could create a "Event Coordinator" custom role based on "trusted_member" but with `can_create_event = true` (which is normally a community_admin permission).
- **Resolution order:** Custom role overrides → Built-in role permissions → Default role permissions.

### 8.3 Permission Resolution

```
For any action, the system checks:

1. Is the user authenticated at the platform level?
   NO → 401 Unauthorized

2. Is the user platform-suspended?
   YES → 403 Forbidden

3. Does the user have a platform role that grants this action?
   YES → Allow (platform-level actions only)

4. Does the user have a community role for the active community?
   NO → 403 Forbidden

5. Are there permission overrides for this role + action?
   YES → Use override (grant or deny)

6. Does the community role permit this action?
   NO → 403 Forbidden

7. Allow
```

### 8.4 Permission Matrix — Actions to Roles

| Action | Minimum Community Role | Platform Override | Customizable |
|--------|----------------------|-------------------|-------------|
| View community content (public) | Guest | — | No |
| View community content (private) | Member | Platform Admin | No |
| Post in chat | Member | — | Yes |
| Delete own chat message | Member | — | Yes |
| Delete any chat message | Moderator | Platform Admin | Yes |
| Mute/kick community member | Moderator | Platform Admin | Yes |
| Create forum thread | Trusted Member | — | Yes |
| Reply to forum thread | Member | — | Yes |
| Delete forum thread | Moderator | Platform Admin | Yes |
| Create net | Moderator | — | Yes |
| Check into net | Member | — | Yes |
| Create alert | Community Admin | Platform Admin | Yes |
| Create event | Community Admin | — | Yes |
| Upload gallery photo | Trusted Member | — | Yes |
| Create marketplace listing | Trusted Member | — | Yes |
| Invite members | Community Admin | — | Yes |
| Change member roles | Community Admin | — | Yes |
| Manage community settings | Community Admin | — | Yes |
| Create custom roles | Community Owner | — | No |
| Override permissions | Community Owner | — | No |
| Customize branding/nav/widgets | Community Owner | — | No |
| Delete community | Community Owner | Platform Owner | No |
| Transfer ownership | Community Owner | — | No |
| Suspend community | N/A | Platform Admin | No |
| Assign platform roles | N/A | Platform Owner | No |
| View platform audit log | N/A | Platform Admin | No |
| Suspend platform user | N/A | Platform Admin | No |

### 8.5 Permission Context Provider

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
  canTransferOwnership: boolean,
  canCreateCustomRoles: boolean,
  canOverridePermissions: boolean,
  canCustomizeBranding: boolean,
  canInviteMembers: boolean,
  canUploadPhotos: boolean,
  canCreateListings: boolean,
  canCreateThreads: boolean,
  isCommunityOwner: boolean,
  isCommunityAdmin: boolean,
  isModerator: boolean,
  isTrustedMember: boolean,
  isMember: boolean,
  isGuest: boolean,
}

PlatformPermissions = {
  isPlatformOwner: boolean,
  isPlatformAdmin: boolean,
  isPlatformSupport: boolean,
  canAccessAdminDashboard: boolean,
  canManageAllCommunities: boolean,
  canManageUsers: boolean,
  canAssignPlatformRoles: boolean,
  canViewAuditLog: boolean,
}
```

These are computed from the role + overrides and provided via context to avoid repeated lookups.

---

## 9. Migration Risks

### 9.1 Critical Risks

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
| **Global account collision** — same email on multiple MyBB users | High | Deduplicate by email during migration; merge accounts if same email |

### 9.2 Performance Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Query performance with community_id filter** — every query now has an additional filter | Medium | Add database indexes on community_id for all content entities |
| **Community context resolution on every request** — extra DB lookups | Medium | Cache community context in the frontend (TanStack Query with staleTime); cache membership in JWT claims |
| **PushAlert segment lookups** — checking community membership before each push | Low | Pre-compute community → subscriber mapping; cache in memory on function warm |
| **Realtime subscription volume** — thousands of communities × active users | High | Move to room-based WebSocket subscriptions (join room = community_id); only receive events for active community |
| **AI usage tracking overhead** — tracking every AI call per community | Low | Async fire-and-forget tracking; don't block AI response on tracking |

### 9.3 Backwards Compatibility Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Existing URLs break** — flat routes → community-scoped routes | High | Redirect old routes to `/c/insomniacs-gmrs/...` (the original community slug) |
| **Existing API consumers break** — if any external integrations call functions directly | Low | Version the API; keep old function signatures working with default community during transition |
| **MyBB deep links break** — forum thread links point to old URLs | Medium | Keep MyBB links working; they're external URLs that don't change |
| **Existing localStorage sessions break** — old format without community context | Medium | Detect old session format on load; force re-authentication |

### 9.4 Data Migration Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Existing ChatMessage records have community_id but it may be empty or wrong** | High | Migration script: set all existing messages to the original community_id |
| **Entities without community_id field** — Repeater, Net, Alert, etc. | High | Schema migration: add community_id with default to original community; backfill all records |
| **User accounts only in MyBB** — no platform User records | High | Migration script: create platform User for every MyBB user; link via email; temporary password |
| **CommunityMember records may be stale** — created during testing | Low | Clean up orphaned memberships during migration |
| **Duplicate emails across MyBB users** | High | Deduplicate during migration; merge community memberships under one global account |

---

## 10. Implementation Phases

### Phase 0: Preparation (No user-facing changes)

**Goal:** Set up the database foundation without breaking existing functionality.

**Tasks:**
1. Create all new entity schemas:
   - PlatformRole, CommunityRole, CommunityCustomRole, CommunityRolePermission
   - CommunityForumConfig, CommunityWeatherConfig, CommunityLiveCamConfig, CommunityNotificationConfig
   - CommunitySettings, CommunityModerationLog, CommunityInvitation, PlatformAuditLog
   - Subscription, CommunityCustomDomain, CommunityIntegration, CommunityPlugin
   - Organization, OrganizationMember
2. Add `community_id` field to all existing content entities (Repeater, Net, NetSession, NetCheckIn, NetLog, Event, Alert, GatheringPhoto, MarketplaceItem, ForumPost, ForumCategory, FollowedThread, ChatPresence)
3. Add `slug`, `status`, `plan`, `max_members`, `is_listed`, `banner_url`, `organization_id` to Community entity
4. Add `scope` field to Alert entity
5. Enhance User entity with `avatar_url`, `bio`, `callsign`, `location`, `radios`, `last_active`, `notification_preferences`, `is_platform_suspended`
6. Create the original "Insomniacs GMRS" community record with slug `insomniacs-gmrs`
7. Run data migration: set `community_id` on all existing records to the original community ID
8. Add database indexes on `community_id` for all content entities

**Deliverable:** All schemas updated, data migrated, no UI changes yet.

**Estimated effort:** 2-3 days

---

### Phase 1: Authentication Overhaul — Global Identity

**Goal:** Replace MyBB bridge auth with native platform identity (one global account per user).

**Tasks:**
1. Create `platformAuth` backend function: login → JWT issuance
2. Create `platformRegister` backend function: email + password + OTP
3. Create `platformRefresh` backend function: refresh token rotation
4. Modify `Login.jsx` to use native auth (keep MyBB as optional "link forum account" flow)
5. Create new `Register.jsx` flow: email → password → OTP → verified
6. Create `PlatformAuthContext` replacing `MyBBAuthContext`
7. Create migration function: MyBB users → platform Users (email dedup, temp password)
8. Dual-auth period: both MyBB and native auth work simultaneously
9. Create `PlatformRole` assignment function (platform_owner bootstrap)
10. Create `assignPlatformRole` backend function (platform_owner only)

**Deliverable:** Users have one global MIST account; existing MyBB users are migrated.

**Estimated effort:** 3-4 days

---

### Phase 2: Community Context & Routing

**Goal:** Make the app community-aware with scoped routing.

**Tasks:**
1. Create `CommunityContext` provider (reads from URL, not localStorage)
2. Create `CommunityAuthRoute` component (validates membership)
3. Create `PlatformAuthRoute` component
4. Create `PlatformAdminRoute` component (hidden)
5. Restructure `App.jsx` routes to SaaS pattern:
   - `/login`, `/register`, `/forgot-password`, `/reset-password`
   - `/onboarding`, `/discover`, `/settings`, `/notifications`, `/tools`
   - `/c/:slug/*` (all community-scoped routes)
   - `/platform/admin/*` (hidden master admin)
6. Add redirect from old flat routes to `/c/insomniacs-gmrs/...`
7. Modify `CommunitySelector` to drive route changes (not localStorage + reload)
8. Modify `AppLayout` to consume `CommunityContext` for branding
9. Create `useCommunity` hook v2: reads from context, not localStorage
10. Create onboarding flow for users with no communities
11. Create `discoverCommunities` page for browsing public communities

**Deliverable:** All routes are community-scoped; community switcher works without reload; branding adapts.

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
19. Create `transferCommunityOwnership` function
20. Create `getCommunityConfig` function
21. Create `trackAIUsage` function for per-community AI tracking

**Deliverable:** All backend functions scope data by community.

**Estimated effort:** 4-5 days

---

### Phase 4: Data Scoping — Frontend Pages

**Goal:** All frontend pages consume `CommunityContext` and scope queries.

**Tasks:**
1. Modify `useChat` hook to accept `communityId`; filter all queries
2. Modify `Dashboard.jsx` — all queries filtered by `community_id`; widgets from community settings
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
17. Modify `BottomNav` subscriptions to be community-scoped; nav items from community config
18. Modify `AlertPoller` to filter by community
19. Modify `SimplexRequestPoller` to filter by community

**Deliverable:** All pages show only the active community's data.

**Estimated effort:** 5-6 days

---

### Phase 5: Permission System

**Goal:** Two-layer permission system with custom roles and overrides is enforced everywhere.

**Tasks:**
1. Create `usePermissions` hook (resolves platform + community permissions + overrides)
2. Create `PermissionGate` component (conditionally render based on permissions)
3. Modify all create/delete/moderation buttons to use `PermissionGate`
4. Create `CommunityMembersManage` page with role management
5. Create `CommunitySettings` page (forum config, weather config, cam config, features, nav, widgets, theme)
6. Create `CommunityRoles` page (custom role management — community_owner only)
7. Create `CommunityModeration` page (moderation log)
8. Create `assignCommunityRole` backend function with authorization checks
9. Create `removeCommunityMember` backend function with authorization checks
10. Create `createCustomRole` backend function (community_owner only)
11. Create `updatePermissionOverride` backend function (community_owner only)
12. Add backend authorization checks to all content-modifying functions
13. Create `CommunityInvitation` flow (invite, accept, decline)
14. Create `requestToJoin` and `approveJoinRequest` functions

**Deliverable:** Permissions are enforced on both frontend and backend; custom roles work.

**Estimated effort:** 5-6 days

---

### Phase 6: Community Customization

**Goal:** Community owners can fully customize their community.

**Tasks:**
1. Create theme/color customization in `CommunitySettings` (primary, accent, banner)
2. Create dashboard widget configuration (drag-to-reorder, toggle visibility)
3. Create navigation customization (reorder nav items, toggle visibility per role)
4. Create forum structure management (categories, order, permissions)
5. Implement dynamic CSS variable override from community theme
6. Implement dynamic nav rendering from community nav_config
7. Implement dynamic dashboard widget rendering from community dashboard_widgets
8. Create community logo/banner upload in settings
9. Create public/private visibility toggle
10. Create join mode configuration (open, invite, request, closed)

**Deliverable:** Community owners can customize branding, nav, widgets, and forum structure.

**Estimated effort:** 4-5 days

---

### Phase 7: Master Admin Dashboard

**Goal:** Platform administrators have a hidden, separate master admin dashboard.

**Tasks:**
1. Create `PlatformAdminLayout` component (separate from community layout, no branding)
2. Create `PlatformAdminDashboard` page (total communities, users, health metrics)
3. Create `PlatformCommunities` page (list, suspend, activate, archive)
4. Create `PlatformUsers` page (list, assign platform roles, suspend)
5. Create `PlatformAuditLog` page
6. Create `suspendCommunity` backend function (platform_admin+)
7. Create `suspendUser` backend function (platform_admin+)
8. Create `getPlatformStats` backend function
9. Add hidden platform admin link in settings (visible only to platform role users)
10. Bootstrap first platform_owner account via secure one-time setup

**Deliverable:** Master admin dashboard is functional and completely separate from communities.

**Estimated effort:** 3-4 days

---

### Phase 8: Notification System Overhaul

**Goal:** Notifications are community-scoped.

**Tasks:**
1. Configure PushAlert segments/tags per community
2. Modify all notification-sending functions to target community segment
3. Create `UnifiedNotifications` inbox (cross-community, with community badges)
4. Modify `NotificationManager` to register with community tags
5. Add per-community notification preferences in community settings
6. Add global notification preferences in platform settings
7. Add quiet hours per community
8. Modify `NotificationPrompt` to explain community-scoped notifications

**Deliverable:** Notifications only go to community members; unified inbox works.

**Estimated effort:** 2-3 days

---

### Phase 9: Realtime Scoping

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

### Phase 10: Community Discovery & Onboarding

**Goal:** New users can discover and join communities; anyone can create one.

**Tasks:**
1. Create `DiscoverCommunities` page (browse public communities with search/filter)
2. Create `Onboarding` flow for new users (no communities)
3. Create community join request flow (for request-mode communities)
4. Create community invite acceptance flow
5. Add community directory with search and categories
6. Create "Create Community" wizard (full setup: name, slug, forum, weather, features, theme, nav)
7. Create community setup checklist for new community owners

**Deliverable:** New users can find and join communities; anyone can create one with full setup.

**Estimated effort:** 3-4 days

---

### Phase 11: Testing, Polish & Documentation

**Goal:** Production-ready SaaS platform.

**Tasks:**
1. End-to-end testing of multi-community flows (create, switch, data isolation)
2. Permission boundary testing (role escalation attempts, cross-community access)
3. Custom role and permission override testing
4. Platform admin dashboard testing
5. Performance testing with multiple communities and users
6. Update all API documentation (docs/api/*)
7. Update database schema documentation (docs/database/*)
8. Create architecture decision records (ADRs) for key decisions
9. Create platform admin runbook
10. Create community owner guide
11. Create SaaS onboarding guide for new communities
12. Migrate existing data to production (after test database validation)
13. Deprecate dual-auth (remove MyBB bridge as login option)

**Deliverable:** Fully tested, documented, production-ready SaaS platform.

**Estimated effort:** 4-5 days

---

### Phase Summary

| Phase | Name | Effort | Dependencies |
|-------|------|--------|--------------|
| 0 | Preparation | 2-3 days | None |
| 1 | Auth Overhaul — Global Identity | 3-4 days | Phase 0 |
| 2 | Community Context & Routing | 3-4 days | Phase 1 |
| 3 | Backend Data Scoping | 4-5 days | Phase 0, 2 |
| 4 | Frontend Data Scoping | 5-6 days | Phase 2, 3 |
| 5 | Permission System | 5-6 days | Phase 2, 3 |
| 6 | Community Customization | 4-5 days | Phase 5 |
| 7 | Master Admin Dashboard | 3-4 days | Phase 5 |
| 8 | Notification Overhaul | 2-3 days | Phase 3 |
| 9 | Realtime Scoping | 2-3 days | Phase 4 |
| 10 | Discovery & Onboarding | 3-4 days | Phase 5, 6 |
| 11 | Testing & Documentation | 4-5 days | All |

**Total estimated effort:** 40-52 days

---

## 11. Future-Proofing Design

### 11.1 Subscription Plans (Ready, Not Implemented)

The `Subscription` entity and `Community.plan` field are designed for future billing integration:
- `plan` field on Community: free, pro, enterprise
- `Subscription` entity tracks billing status, trial periods, seats
- `stripe_customer_id` and `stripe_subscription_id` fields ready for Stripe integration
- Feature flags in `CommunitySettings.features_enabled` gate features by plan
- No database redesign needed when billing is added — just integrate Stripe and update feature flags

### 11.2 Custom Domains (Ready, Not Implemented)

The `CommunityCustomDomain` entity maps custom domains to communities:
- Domain verification flow (DNS TXT record check)
- SSL certificate management
- Routing middleware resolves domain → community before URL routing
- No database redesign needed — just add middleware and verification flow

### 11.3 API Integrations (Ready, Not Implemented)

The `CommunityIntegration` entity stores per-community external API configs:
- Integration types: Slack, Discord, webhook, Zapier, custom
- Config stored as JSON (flexible per integration type)
- Secrets stored via reference (not plaintext)
- Backend functions read integration config per community
- No database redesign needed — just add integration-specific functions

### 11.4 Plugins (Ready, Not Implemented)

The `CommunityPlugin` entity tracks installed plugins per community:
- Plugin registry (global) defines available plugins
- Communities install/activate plugins per their needs
- Plugin system uses event hooks — plugins register handlers for entity events
- No database redesign needed — just build plugin registry and hook system

### 11.5 Mobile Applications (API-First)

The API-first design means all functionality is accessible via REST API:
- Mobile apps authenticate with JWT (same as web)
- Mobile apps pass `X-Community-Id` header (same as web)
- No frontend coupling — all business logic is in backend functions
- Mobile apps can be built without any backend changes

### 11.6 Enterprise Organizations (Ready, Not Implemented)

The `Organization` and `OrganizationMember` entities allow grouping communities:
- An organization can own multiple communities
- Shared billing across communities
- Enterprise admin manages all communities in the organization
- No database redesign needed — just add organization management UI

### 11.7 Horizontal Scaling

- All entities use UUID primary keys (globally unique, no shard collision)
- `community_id` is a natural shard key for data partitioning
- All queries include `community_id` filter (shard-ready)
- No cross-shard joins needed for content queries
- Platform-level entities (PlatformRole, PlatformAuditLog) can be on a separate shard

---

## Architectural Decisions Summary

### Decision 1: SaaS Platform, Not Multi-Community App
MIST is a true SaaS platform with complete tenant isolation, global user identity, and per-tenant customization. Communities are tenants, not groups within a shared app.

### Decision 2: Global Identity, Unlimited Memberships
Every user has one global MIST account. A user can join unlimited communities and own multiple communities. Identity is platform-level; community membership is a separate layer.

### Decision 3: Complete Community Isolation
Every community is completely isolated. No data crosses community boundaries except explicitly shared platform resources. This is enforced at the backend, not just the frontend.

### Decision 4: Two-Layer Permissions
Platform roles (owner, admin, support) are separate from community roles (owner, admin, moderator, trusted_member, member, guest). Community owners can create custom roles and override permissions.

### Decision 5: Native Identity Replaces MyBB
Platform identity is native (email + password + JWT). MyBB becomes an optional, swappable forum adapter configured per community.

### Decision 6: URL-Based Community Context
Community context is in the URL (`/c/:slug/...`), enabling deep linking, sharing, and browser navigation. The `CommunityContext` provider reads from the URL.

### Decision 7: Hidden Master Admin Dashboard
The platform owner has a completely separate admin dashboard at `/platform/admin/*` with its own layout, navigation, and styling. No community context is loaded.

### Decision 8: Swappable Forum Adapter
Each community chooses its forum backend (MyBB, Discourse, native, none). The `CommunityForumConfig` entity stores the adapter type and connection details.

### Decision 9: Community Owner Full Customization
Community owners can customize logo, banner, theme, nav, widgets, forum structure, roles, permissions, and visibility without platform admin involvement.

### Decision 10: Future-Ready Schema
All future features (subscriptions, custom domains, integrations, plugins, enterprise) have entity schemas ready. No database redesign is needed to add these features.

### Decision 11: Globally Unique IDs
All entities use UUID primary keys. No sequential IDs that could collide across shards. The schema is ready for horizontal scaling.

### Decision 12: Gradual Migration with Dual-Auth
The migration uses a dual-auth period where both MyBB bridge and native auth work simultaneously. This prevents breaking existing users. MyBB bridge is deprecated only after all users are migrated.

---

## Approval

This document is submitted for review. No code changes will be made until the architecture is approved. Please review each section and provide feedback or approval to proceed with Phase 0.