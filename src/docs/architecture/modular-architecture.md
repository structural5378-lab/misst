# MIST Modular Architecture Principle

> **Status:** APPROVED PRINCIPLE
> **Date:** 2026-07-10

## Core Principle

MIST is a platform built from **independent feature modules**. Every major feature is a self-contained module with its own database models, services, APIs, permissions, settings, UI components, navigation, and notifications.

Modules communicate only through **defined APIs or shared platform services** and never depend directly on another module's internal implementation.

## Module Definition

A module is a vertical slice of functionality that can be:
- **Enabled or disabled** per community by the community owner
- **Developed and deployed** independently of other modules
- **Added in the future** without requiring changes to existing modules
- **Removed** without breaking other modules

## Module Inventory

| Module | Status | Description |
|--------|--------|-------------|
| **Auth Module** | Phase 1 | Global identity, JWT, platform roles, community roles |
| **Forum Module** | Existing (refactor) | Threaded discussions, categories, swappable forum adapter |
| **Chat Module** | Existing (refactor) | Real-time messaging, presence, typing indicators |
| **Repeater Module** | Existing (refactor) | Repeater directory, maps, RepeaterBook integration |
| **Weather Module** | Existing (refactor) | Conditions, radar, storm tracking, propagation |
| **Maps Module** | Existing (refactor) | Geographic visualization of community data |
| **Gallery Module** | Existing (refactor) | Photo sharing, gathering albums |
| **Live Camera Module** | Existing (refactor) | Community-configured camera feeds |
| **Events Module** | Existing (refactor) | Event scheduling, reminders, check-ins |
| **Shopping Module** | Existing (refactor) | Community marketplace |
| **AI Module** | New | InvokeLLM, GenerateImage, per-community tracking |
| **File Manager Module** | New | Upload, storage, access control per community |
| **Notification Module** | Existing (refactor) | Push, email, in-app, per-community targeting |
| **Nets Module** | Existing (refactor) | Net sessions, check-ins, logging |

## Module Structure

Each module owns these layers:

```
Module
├── Database Models     — entities scoped to this module
├── Services            — business logic for this module
├── APIs                — backend functions exposed to frontend
├── Permissions         — role-based access for this module's actions
├── Settings            — per-community configuration for this module
├── UI Components       — React components for this module
├── Navigation          — nav items contributed to the community shell
└── Notifications       — notification types this module can fire
```

## Inter-Module Communication Rules

1. **No direct imports:** Module A may not import Module B's internal services or components. It may only call Module B's published API (backend function).

2. **Shared platform services only:** Modules share access to platform-level services (auth, file storage, notification dispatcher, AI integration) but never to each other's internal state.

3. **Event-based decoupling:** When Module A needs to react to something Module B did, Module B fires a platform event (entity automation), and Module A subscribes to it. Module B does not know Module A exists.

4. **No shared database entities:** Each module owns its entities. A module may reference another module's entity by ID (e.g., `community_id`) but may not query or modify another module's tables directly.

## Module Enable/Disable

Community owners can enable or disable modules individually:

- **Disabled module:** Its nav items are hidden, its pages are inaccessible, its backend functions reject calls, its notifications are not sent, its automations are paused.
- **Enabled module:** Full functionality as configured by the community owner.
- **Storage:** Module enabled/disabled state stored in `CommunitySettings.features_enabled` (JSON map).

**Enforcement:**
- Frontend: Nav items and routes check module enabled state from `CommunityContext`.
- Backend: Each module's backend functions check `features_enabled` for the community before executing.

## Adding New Modules

A new module can be added without touching existing modules:

1. Create the module's entity schemas
2. Create the module's backend functions
3. Create the module's UI components and pages
4. Register the module's nav items in the module manifest
5. Add the module to the `features_enabled` default map

No existing module's code changes. The platform shell reads the module manifest and renders nav items dynamically.

## Module Manifest (Future)

Each module will declare a manifest:

```json
{
  "module": "chat",
  "label": "Live Chat",
  "icon": "MessageCircle",
  "nav_items": [
    { "label": "Chat", "path": "/c/:slug/chat", "icon": "MessageCircle", "roles": ["member", "moderator", "community_admin", "community_owner"] }
  ],
  "default_enabled": true,
  "permissions": ["can_post_chat", "can_moderate_chat", "can_delete_own_message"],
  "settings": ["chat_enabled", "chat_history_retention_days"],
  "notifications": ["new_chat_message", "chat_mention"]
}
```

The platform shell reads all module manifests and assembles the community UI dynamically.

## Phase 1 Module: Auth

Phase 1 implements the **Auth Module** — the foundational module that all other modules depend on (via `community_id` and role resolution).

Auth Module owns:
- **Entities:** PlatformRole, CommunityRole, CommunityMember (existing), CommunityInvitation
- **Services:** Identity resolution, role resolution, permission checking
- **APIs:** platformAuth, platformRegister, assignPlatformRole, bootstrapPlatformOwner, createCommunity, inviteToCommunity, acceptInvitation
- **Permissions:** Platform-level (owner/admin/support) and community-level (owner/admin/moderator/trusted_member/member/guest)
- **Settings:** None (auth is always enabled)
- **UI Components:** Login, Register, ForgotPassword, ResetPassword, DualProtectedRoute, PlatformAuthContext
- **Navigation:** None (auth is infrastructure, not a feature tab)
- **Notifications:** Welcome email, invitation email, role-change notification