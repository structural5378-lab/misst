# MIST Mobile App — Navigation Architecture

## Overview

MIST is a mobile-first PWA designed for the GMRS radio community. The navigation follows a **bottom-tab + stack** pattern common to native mobile apps, with contextual deep-navigation via pushed screens and modal sheets.

---

## Navigation Pattern

### Primary Navigation: Bottom Tab Bar

The app uses a persistent bottom navigation bar with 5 tabs, always visible on top-level screens. Deep screens (thread views, repeater details, settings sub-pages) hide the bottom bar and use a back button in the header.

```
┌──────────────────────────────────────────┐
│                                          │
│           Active Screen Content          │
│                                          │
├──────────────────────────────────────────┤
│  [Home]  [Chat]  [+]  [Forum]  [More]    │
└──────────────────────────────────────────┘
```

### Tab Definitions

| Tab | Label | Icon | Route | Purpose |
|-----|-------|------|-------|---------|
| 1 | Home | House | `/` | Dashboard — at-a-glance status, alerts, quick access |
| 2 | Chat | MessageCircle | `/live-chat` | Real-time community chat |
| 3 | Add (center FAB) | Plus | `/add` | Quick-create hub (thread, alert, event, repeater, photo) |
| 4 | Forum | MessageSquare | `/community-forum` | Forum categories and threads |
| 5 | More | Menu/Grid | `/more` | Secondary features menu (Repeaters, Weather, Maps, Events, Emergency, Gallery, Profile, Settings, Notifications) |

### Navigation Types

| Type | Usage | Example |
|------|-------|---------|
| **Tab Switch** | Tapping a bottom tab | Home → Chat |
| **Push (Stack)** | Drilling into detail | Forum → Thread View |
| **Modal Sheet** | Quick actions from bottom | Long-press chat message → action sheet |
| **Full Modal** | Create/edit flows | Add → Create Event |
| **Overlay** | System-level UI | Emergency alert banner, notification toast |

---

## Screen Inventory

### 1. Home (Dashboard)

**Route:** `/`
**Tab:** Home
**Bottom Bar:** Visible

#### Screen Description

The Home screen is the user's command center. It provides an at-a-glance view of everything happening in the MIST community. The screen is a single scrollable column with the following sections, top to bottom:

1. **Identity Header** — User avatar, display name, callsign, community badge, and current online status. A weather condition chip (temperature + icon) sits to the right. The logout and alert icons are positioned at the bottom-right of this section.

2. **Emergency Alert Banner** (conditional) — If an active emergency alert exists, a full-width red banner appears below the header with the alert title, severity icon, and a tap target to view full details. Dismissible with an X.

3. **Marquee Activity Strip** — A horizontally scrolling strip showing the latest forum thread titles and the next scheduled net, with a subtle marquee animation. Tapping any item navigates to that content.

4. **Quick Access Grid** — A 4-column grid of icon tiles providing one-tap access to: Repeaters, Weather, Maps, Events, Gallery, Forum, Chat, Members. Each tile shows an icon, label, and a small badge if there's unread content.

5. **Active Alerts Section** — Lists the 3 most recent non-emergency alerts (info/warning/system). Each shows an icon, title, timestamp, and tap target. A "View All" link navigates to the Notifications screen.

6. **Propagation Gauge** — A circular gauge showing current RF propagation conditions (good/fair/poor) based on solar flux and geomagnetic data. Tap reveals a detail sheet with Kp index, solar wind speed, and sunspot number.

7. **Storm Tracker Card** (conditional) — If any tropical systems are active in the Atlantic/Gulf, a card shows the nearest storm name, category, and distance. Tap navigates to Weather → Storm Tracker.

8. **User Stats Bar** — Compact row showing: messages sent, forum posts, nets checked in, events attended. Tap navigates to Profile → Stats.

9. **Online Members Strip** — Horizontal scroll of avatars showing currently online community members. Tap navigates to Members → Member Profile.

10. **Upcoming Events Preview** — Lists the next 2 upcoming events with date, time, and title. Tap navigates to Events → Event Detail.

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Tap identity header | Tap on avatar/name | Navigate to Profile |
| Tap weather chip | Tap on temperature | Navigate to Weather |
| Tap alert banner | Tap on emergency banner | Navigate to Emergency → Alert Detail |
| Dismiss alert banner | Tap X icon | Banner collapses, stored as read |
| Tap marquee item | Tap on scrolling item | Navigate to Thread View or Net Detail |
| Tap quick access tile | Tap any grid icon | Navigate to corresponding screen |
| Tap alert item | Tap on alert row | Navigate to alert detail |
| Tap "View All" alerts | Tap link | Navigate to Notifications |
| Tap propagation gauge | Tap on gauge | Open propagation detail sheet |
| Tap storm card | Tap on card | Navigate to Weather → Storm Tracker |
| Tap stats bar | Tap on stats | Navigate to Profile → Stats |
| Tap online member | Tap on avatar | Navigate to Member Profile |
| Tap event preview | Tap on event row | Navigate to Event Detail |
| Pull to refresh | Swipe down from top | Re-fetch all dashboard data |
| Tap logout icon | Tap on icon | Confirm dialog → logout → Login screen |

---

### 2. Chat (Live Chat)

**Route:** `/live-chat`
**Tab:** Chat
**Bottom Bar:** Visible

#### Screen Description

A full-screen real-time chat interface styled after WhatsApp/Telegram. The screen fills the viewport between the header and the bottom navigation bar.

**Header:** Back arrow (to Home), MIST logo avatar, "MIST Live Chat" title, and a subtitle showing either "X online" (green dot) or "Name typing..." (animated dots).

**Online Members Strip:** A horizontal scroll of online member avatars with names below each. Limited to 20 visible avatars. Tap navigates to Member Profile.

**Message List:** A scrollable list of message bubbles. Messages from the current user are right-aligned with a violet gradient. Messages from others are left-aligned with a card background. Features include:

- **Date separators** — "Today", "Yesterday", or full date labels between message groups
- **Sender avatars** — Shown for the first message in a group from a new sender
- **Sender names** — Displayed above grouped messages from other users
- **Reply context** — If a message is a reply, a compact preview of the original message appears above the reply
- **Image messages** — Full-width images with rounded corners, tap to enlarge
- **Reactions** — Emoji reactions appear below the message bubble with count
- **Unread separator** — A "New Messages" divider line appears at the first unread message
- **Typing indicator** — An animated three-dot bubble appears at the bottom of the list when users are typing
- **Scroll-to-bottom button** — A floating button appears when scrolled up, tap to jump to latest

**Composer:** A fixed input area at the bottom with:
- Reply preview bar (when replying) — Shows original message snippet and a cancel X
- Image preview thumbnail (when attaching) — Shows selected image with a remove button
- Text input field — Auto-growing textarea
- Emoji button — Opens emoji picker grid
- Image attach button — Opens device file picker
- Send button — Violet circle with arrow icon, disabled when input is empty

**Message Actions Sheet (long-press):** A bottom sheet with:
- Reaction row — 6 emoji buttons to quickly react
- Reply button — Sets reply context in composer
- Copy button — Copies message text to clipboard
- Delete button (own messages only) — Removes the message

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Send message | Type text + tap send | Message appears immediately (optimistic), broadcasts via WebSocket |
| Send image | Tap attach → pick file → tap send | Image uploads, message with image appears |
| Reply to message | Long-press → tap Reply | Reply preview appears in composer, next send includes reply context |
| React to message | Long-press → tap emoji | Reaction appears below message, toggles if already reacted |
| Copy message | Long-press → tap Copy | Text copied to clipboard, toast confirmation |
| Delete message | Long-press → tap Delete (own only) | Message removed from list |
| View online member | Tap avatar in strip | Navigate to Member Profile |
| Scroll to bottom | Tap floating button | Smooth scroll to latest message |
| Enlarge image | Tap on image message | Full-screen image viewer with pinch-zoom |
| Start typing | Type in input field | Typing indicator broadcasts to other users |
| Stop typing | Clear input or send | Typing indicator clears after 3s debounce |
| Pull to refresh | Swipe down from top | Re-fetch recent messages |
| Tap back arrow | Tap chevron | Navigate to Home |

---

### 3. Forum

**Route:** `/community-forum`
**Tab:** Forum
**Bottom Bar:** Visible

#### Screen Description

A mobile-optimized forum browser with two view modes toggleable via a segmented control at the top: **Recent Activity** and **Categories**.

**Header:** Page title "Community Forum", a search icon (opens search overlay), and a "New Thread" button (pencil icon).

**Recent Activity View (default):** A chronological list of the most recently active threads across all categories. Each thread row shows:
- Category color bar (left edge)
- Thread title (bold, 2-line max)
- Author name + callsign
- Category name badge
- Reply count, view count
- Last reply timestamp (relative: "5m ago", "2h ago")
- Pinned indicator (pin icon) for sticky threads

**Categories View:** A vertical list of forum categories. Each category card shows:
- Category icon
- Category name (bold)
- Description (1-line)
- Thread count
- Last activity timestamp

**Search Overlay:** A full-screen search with a text input at the top and live results below. Results show matching thread titles with highlighted search terms.

**Empty State:** If no threads exist, a centered illustration with "No threads yet" and a "Start a Discussion" button.

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Switch view mode | Tap segmented control | Toggle between Recent and Categories |
| Open thread | Tap thread row | Navigate to Thread View |
| Open category | Tap category card | Navigate to Category View (filtered threads) |
| Search | Tap search icon | Open search overlay |
| Type search query | Type in search field | Live-filtered results appear |
| Tap search result | Tap result row | Navigate to Thread View |
| Create new thread | Tap pencil button | Navigate to New Thread screen |
| Pull to refresh | Swipe down | Re-fetch forum data |
| Tap back arrow | Tap chevron | Navigate to Home |

---

### 3a. Thread View (Pushed Screen)

**Route:** `/forums/thread/:id`
**Bottom Bar:** Hidden (back button in header)

#### Screen Description

A full thread reader showing the original post and all replies in a scrollable list.

**Header:** Back arrow, thread title (truncated), and a "Follow" toggle button (bell icon).

**Original Post Card:** Author avatar, name, callsign, timestamp, category badge, and full post body (rendered from BBCode/Markdown). An image gallery if attached.

**Reply List:** Each reply shows author avatar, name, callsign, timestamp, and body. Replies are in chronological order. The current user's replies have a subtle violet left border.

**Reply Composer (bottom):** A text input with a send button. Supports basic formatting (bold, italic, link) via a toolbar above the keyboard.

**Follow Indicator:** When following, the bell icon is filled. New replies trigger a notification.

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Follow/unfollow thread | Tap bell icon | Toggle follow state, toast confirmation |
| Post reply | Type + tap send | Reply appears at bottom, followers notified |
| Tap author avatar | Tap on avatar | Navigate to Member Profile |
| Scroll through replies | Swipe up/down | Navigate thread |
| Tap back arrow | Tap chevron | Return to Forum |
| Share thread | Tap share icon (if shown) | Open system share sheet |

---

### 3b. New Thread (Modal)

**Route:** `/forums/new`
**Bottom Bar:** Hidden

#### Screen Description

A form to create a new forum thread. Fields:
- Category selector (dropdown)
- Title input (required)
- Body editor (rich text with toolbar: bold, italic, underline, link, image)
- Post button (disabled until title + body + category are valid)

Padding ensures the form is visible above the bottom navigation on mobile.

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Select category | Tap dropdown | Category picker sheet appears |
| Type title | Type in field | Character count updates |
| Format body | Tap toolbar button | Selected text gets formatted |
| Insert image | Tap image button | File picker opens, image inserted into body |
| Post thread | Tap Post button | Thread created, navigate to Thread View |
| Cancel | Tap back arrow | Confirm discard dialog → return to Forum |

---

### 4. Repeaters

**Route:** `/repeaters`
**Tab:** More → Repeaters
**Bottom Bar:** Visible (on list), Hidden (on detail)

#### Screen Description

A repeater directory with search, filter, and map views.

**Header:** Title "Repeaters", search icon, map toggle button, and add button (+).

**List View (default):** A scrollable list of repeater cards. Each card shows:
- Callsign (bold, large)
- Frequency (monospace, with offset and tone)
- Location (city, state)
- Status badge (online=green, offline=red, busy=amber)
- Distance from user (if location enabled)
- Favorite star (tap to toggle)

**Filter Bar:** A horizontal scroll of filter chips: All, Online, Favorites, By Band (UHF/VHF/HF), By Distance (10/25/50/100mi).

**Map View:** Tapping the map icon switches to a full-screen map with repeater pins. Tap a pin to see a mini-card, tap the mini-card to open full detail.

**Search:** Tapping the search icon opens a search bar. Results filter live by callsign, location, or frequency.

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Search repeaters | Type in search bar | List filters live |
| Apply filter | Tap filter chip | List updates to matching repeaters |
| Toggle favorite | Tap star icon | Repeater added/removed from favorites |
| Open repeater detail | Tap repeater card | Navigate to Repeater Detail |
| Switch to map view | Tap map icon | Full-screen map with pins |
| Tap map pin | Tap pin on map | Mini-card appears |
| Open from mini-card | Tap mini-card | Navigate to Repeater Detail |
| Add repeater | Tap + button | Navigate to Add Repeater form |
| Pull to refresh | Swipe down | Re-fetch repeater list |

---

### 4a. Repeater Detail (Pushed)

**Route:** `/repeaters/:id`
**Bottom Bar:** Hidden

#### Screen Description

Full details for a single repeater:
- Hero image (if available) or gradient header with callsign
- Full frequency info (TX, RX, offset, tone)
- Location with mini-map
- Owner callsign
- Description
- Status indicator
- Favorite toggle
- "Open in Map" button (navigates to Maps with this repeater centered)
- "Share" button

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Toggle favorite | Tap star | Favorite state updates |
| Open in map | Tap button | Navigate to Maps centered on repeater |
| Share | Tap share | System share sheet |
| Tap back | Tap chevron | Return to Repeaters list |

---

### 5. Weather

**Route:** `/weather`
**Tab:** More → Weather
**Bottom Bar:** Visible

#### Screen Description

A weather dashboard for radio operators, focused on propagation and storm conditions.

**Sections (top to bottom):**

1. **Current Conditions Card** — Location name, temperature, condition icon, wind speed/direction, humidity, barometric pressure. Tap to refresh.

2. **Propagation Gauge** — Large circular gauge showing overall propagation quality (Good/Fair/Poor). Below: Kp index, solar wind speed, sunspot number, X-class flare probability. Tap for detailed breakdown sheet.

3. **Storm Tracker** (conditional) — If active tropical systems exist, a card per storm showing: storm name, category (icon), sustained winds, movement direction/speed, and distance from user. Tap for full storm detail page with forecast cone.

4. **Radar Map** — A mini radar map showing precipitation over the user's area. Tap to expand to full-screen radar with animation controls.

5. **Forecast** — 3-day forecast strip (horizontal scroll) with day, high/low, condition icon, and precipitation chance.

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Refresh conditions | Tap current card or pull down | Re-fetch weather data |
| View propagation detail | Tap gauge | Detail sheet with solar metrics |
| Open storm detail | Tap storm card | Navigate to Storm Detail (forecast cone, advisories) |
| Expand radar | Tap radar map | Full-screen radar with play/pause animation |
| Scroll forecast | Swipe horizontally | Browse 3-day forecast |
| Change location | Tap location name | Location picker sheet |

---

### 6. Maps

**Route:** `/map`
**Tab:** More → Maps
**Bottom Bar:** Visible

#### Screen Description

An interactive map showing repeaters, online members (who opt in), and active location shares.

**Map Layer Toggle:** A floating control with toggle buttons for:
- Repeaters (pins)
- Online Members (avatars)
- Location Shares (pulsing dots)
- Events (calendar pins)

**User Location:** Blue dot showing the user's current position with accuracy circle.

**Location Share Banner (conditional):** If someone has requested to share location with the user, a banner appears: "K4ABC wants to share location — Accept / Decline".

**Active Location Share Panel:** If the user is sharing location with someone, a bottom panel shows the other person's name, distance, and a "Stop Sharing" button.

**Tap Interactions:** Tapping any pin/marker opens a mini info card. Tapping the card navigates to the corresponding detail screen.

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Pan map | Drag with finger | Move map view |
| Zoom map | Pinch or +/- buttons | Zoom in/out |
| Toggle layer | Tap toggle button | Show/hide layer |
| Tap repeater pin | Tap pin | Mini-card → tap card → Repeater Detail |
| Tap member marker | Tap avatar | Mini-card → tap card → Member Profile |
| Tap event pin | Tap pin | Mini-card → tap card → Event Detail |
| Accept location share | Tap Accept on banner | Location share becomes active, panel appears |
| Decline location share | Tap Decline on banner | Banner dismisses, request marked declined |
| Stop sharing | Tap Stop Sharing | Location share ends, panel closes |
| Center on user | Tap location button | Map centers on user's GPS position |

---

### 7. Events

**Route:** `/events`
**Tab:** More → Events
**Bottom Bar:** Visible (list), Hidden (detail)

#### Screen Description

A community event calendar and listing.

**View Toggle:** Segmented control between "Upcoming" and "Past" events.

**Event List:** Each event card shows:
- Event title (bold)
- Date and time (with relative label: "Tomorrow", "In 3 days")
- Location
- Status badge (upcoming=blue, active=green, delayed=amber, ended=gray)
- Attendee count with stacked avatars
- RSVP toggle (Going / Not Going / Maybe)

**Create Event Button:** A FAB or header button (+) to create a new event (admin only).

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Switch upcoming/past | Tap segmented control | List updates |
| Open event detail | Tap event card | Navigate to Event Detail |
| RSVP | Tap Going/Not Going | RSVP state updates, attendee count adjusts |
| Create event | Tap + button (admin) | Navigate to Create Event form |
| Pull to refresh | Swipe down | Re-fetch events |

---

### 7a. Event Detail (Pushed)

**Route:** `/events/:id`
**Bottom Bar:** Hidden

#### Screen Description

Full event details:
- Event title, date/time, location with mini-map
- Description (rich text)
- Status badge (with "Delayed until X" if delayed)
- Attendee list (avatars + names)
- RSVP buttons (Going / Not Going / Maybe)
- "Add to Calendar" button (device calendar)
- "Get Directions" button (opens maps app)
- Admin controls: Delay, Activate, End event

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| RSVP | Tap RSVP button | State updates, list refreshes |
| Add to calendar | Tap button | Event added to device calendar |
| Get directions | Tap button | Opens native maps app with directions |
| Delay event (admin) | Tap Delay | Prompt for new time, status updates |
| Activate event (admin) | Tap Activate | Status → active, notifications sent |
| End event (admin) | Tap End | Status → ended |
| Tap attendee | Tap avatar | Navigate to Member Profile |

---

### 7b. Create Event (Modal)

**Route:** `/events/create`
**Bottom Bar:** Hidden

#### Screen Description

Form to create a new event:
- Title (required)
- Description (rich text)
- Date and time picker
- Location (text + map pin)
- Category (dropdown: net, gathering, training, emergency drill)
- Create button (disabled until valid)

---

### 8. Emergency

**Route:** `/emergency`
**Tab:** More → Emergency
**Bottom Bar:** Visible

#### Screen Description

The Emergency screen serves two purposes: viewing active emergency alerts and creating new emergency alerts (admin only).

**Active Alerts Section:** If any emergency-level alerts are active, they appear as full-width red cards at the top:
- Alert title (bold, large)
- Severity icon (warning triangle)
- Alert message
- Timestamp
- "View Details" tap target

**Alert History:** Below active alerts, a chronological list of past emergency alerts (collapsed, tap to expand).

**Create Emergency Alert (admin):** A red button at the bottom: "Issue Emergency Alert". Tapping opens the Create Alert flow.

**Quick Actions:** A row of emergency quick-dial buttons:
- "Call Net Control" (if a net is active)
- "View Emergency Net" (if one exists)
- "Share Location" (quick-share with community)

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| View active alert | Tap alert card | Navigate to Alert Detail |
| Expand past alert | Tap collapsed row | Alert expands with full message |
| Issue alert (admin) | Tap red button | Navigate to Create Alert flow |
| Call net control | Tap quick-dial | Initiate call (if capable) or show info |
| View emergency net | Tap button | Navigate to Net Control for emergency net |
| Quick share location | Tap button | Start location share with community |

---

### 8a. Create Alert (Modal)

**Route:** `/alerts/create`
**Bottom Bar:** Hidden

#### Screen Description

Form to create an emergency alert (admin only):
- Alert type (info, warning, emergency, system)
- Title (required)
- Message (required, rich text)
- Link (optional, to a thread or event)
- "Broadcast" button — sends push notification to all users immediately
- Confirmation dialog before broadcast: "This will notify ALL users. Continue?"

---

### 9. Gallery

**Route:** `/gallery`
**Tab:** More → Gallery
**Bottom Bar:** Visible

#### Screen Description

A community photo gallery organized by gathering/event labels.

**Group Headers:** Photos are grouped by month/year label (e.g., "June 2026 Gathering"). Each group has a header with the label and photo count.

**Photo Grid:** A 3-column grid of square thumbnails within each group. Tap to open full-screen viewer.

**Upload Button:** A header button (+) to upload a new photo. Opens file picker, then a caption form.

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Open photo | Tap thumbnail | Full-screen viewer with swipe navigation |
| Swipe between photos | Swipe left/right | Navigate between photos in group |
| Upload photo | Tap + button | File picker → caption form → upload |
| Tap group header | Tap header | Collapse/expand group |
| Long-press photo | Long-press | Option to delete (if uploader or admin) |

---

### 10. Profile

**Route:** `/profile`
**Tab:** More → Profile
**Bottom Bar:** Visible

#### Screen Description

The user's own profile page.

**Profile Header:**
- Avatar (large, tap to change)
- Display name
- Callsign
- Community badge
- Member since date
- Bio (editable)
- Edit Profile button

**Stats Bar:**
- Messages sent
- Forum posts
- Nets checked in
- Events attended
- Days active

**Quick Links:**
- My Forum Threads
- My Repeater Favorites
- My Event RSVPs
- My Photos

**Settings Link:** Navigates to Settings.

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Change avatar | Tap avatar | File picker → upload → avatar updates |
| Edit profile | Tap Edit button | Navigate to Edit Profile form |
| Edit bio | Tap bio text | Inline edit mode |
| View my threads | Tap link | Navigate to Forum filtered by user |
| View favorites | Tap link | Navigate to Repeaters filtered by favorites |
| View my RSVPs | Tap link | Navigate to Events filtered by RSVP |
| View my photos | Tap link | Navigate to Gallery filtered by user |
| Open settings | Tap link | Navigate to Settings |

---

### 11. Settings

**Route:** `/settings`
**Tab:** More → Settings
**Bottom Bar:** Hidden

#### Screen Description

A grouped settings list with sections:

**Account:**
- Email
- Change Password
- Connected Accounts (Google, Apple)
- Sessions (active devices)
- API Tokens

**Notifications:**
- Push Notifications (toggle)
- Notification Preferences (per-type toggles: chat, forum, events, alerts, mentions)
- Quiet Hours (start/end time picker)

**Privacy:**
- Show Online Status (toggle)
- Show Location on Map (toggle)
- Allow Direct Messages (toggle: everyone, friends, off)
- Profile Visibility (toggle: public, members, friends)

**Appearance:**
- Theme (system, light, dark)
- Font Size (small, medium, large)

**Community:**
- Current Community (selector)
- Create Community
- Leave Community

**Forum:**
- Forum Bridge Status
- Forum Username
- Re-link Forum Account

**About:**
- App Version
- Privacy Policy
- Terms of Service
- Contact Support
- Logout

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Change email | Tap Email | Edit form with verification |
| Change password | Tap Change Password | Password change form |
| Toggle push | Tap toggle | Push subscription updates |
| Toggle notification type | Tap per-type toggle | Preference saved |
| Set quiet hours | Tap time pickers | Time wheel picker appears |
| Toggle privacy | Tap any privacy toggle | Preference saved immediately |
| Change theme | Tap theme option | App theme updates immediately |
| Change font size | Tap size option | Font scales update immediately |
| Select community | Tap selector | Community list sheet |
| Create community | Tap Create | Navigate to Create Community |
| View sessions | Tap Sessions | List of active sessions with revoke buttons |
| Logout | Tap Logout | Confirm dialog → logout → Login screen |

---

### 12. Notifications

**Route:** `/notifications`
**Tab:** More → Notifications
**Bottom Bar:** Visible

#### Screen Description

A unified notification inbox showing all notification types in a single chronological list.

**Filter Tabs:** All, Unread, Mentions, Alerts

**Notification Row:** Each row shows:
- Icon (varies by type: chat, forum, event, alert, system)
- Title
- Preview text (1-line)
- Timestamp (relative)
- Unread indicator (blue dot on left)
- Tap target to navigate to the source content

**Mark All Read:** A header button to mark all notifications as read.

**Empty State:** "No notifications" with a bell illustration.

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Open notification | Tap row | Navigate to source (thread, event, alert, chat) |
| Mark all read | Tap header button | All notifications marked read, dots clear |
| Filter | Tap filter tab | List filters by type/read state |
| Swipe to dismiss | Swipe left on row | Notification marked read and dismissed |
| Pull to refresh | Swipe down | Re-fetch notifications |

---

### 13. More (Menu Hub)

**Route:** `/more`
**Tab:** More
**Bottom Bar:** Visible

#### Screen Description

A menu screen listing all secondary features not in the bottom tab bar. Each item is a row with icon, label, and optional badge count.

**Menu Items:**
| Icon | Label | Route | Badge |
|------|-------|-------|-------|
| Radio | Repeaters | `/repeaters` | — |
| Cloud | Weather | `/weather` | — |
| MapPin | Maps | `/map` | — |
| Calendar | Events | `/events` | — |
| Siren | Emergency | `/emergency` | (red dot if active) |
| Images | Gallery | `/gallery` | — |
| Users | Members | `/members` | — |
| User | Profile | `/profile` | — |
| Settings | Settings | `/settings` | — |
| Bell | Notifications | `/notifications` | (unread count) |
| Wrench | Tools | `/tools` | — |
| ShoppingBag | Marketplace | `/shopping` | — |

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Open feature | Tap any row | Navigate to corresponding screen |

---

### 14. Add (Quick-Create Hub)

**Route:** `/add`
**Tab:** Add (center FAB)
**Bottom Bar:** Visible

#### Screen Description

A hub for creating new content. Presented as a grid of large action cards:

| Card | Icon | Label | Navigates To |
|------|------|-------|--------------|
| 1 | MessageSquare | New Thread | `/forums/new` |
| 2 | Siren | Emergency Alert | `/alerts/create` (admin only) |
| 3 | Calendar | New Event | `/events/create` (admin only) |
| 4 | Radio | Add Repeater | `/repeaters/add` |
| 5 | Images | Upload Photo | Gallery upload flow |
| 6 | Radio | Create Net | `/nets/create` (admin only) |
| 7 | Users | Create Community | `/community/create` |

Non-admin users see admin-only cards grayed out or hidden.

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Create content | Tap any card | Navigate to the corresponding create form |

---

## User Flow Diagrams

### Flow 1: New User Registration → First Dashboard

```
Login Screen
  → Tap "Register"
    → Register Screen (email, password, confirm)
      → Submit
        → OTP Verification Screen (6-digit code)
          → Enter code → Submit
            → Dashboard (Home)
```

### Flow 2: Read Forum → Reply → Follow

```
Home (Dashboard)
  → Tap "Forum" tab
    → Forum (Recent Activity)
      → Tap thread row
        → Thread View
          → Read posts
          → Tap Follow (bell icon)
          → Type reply in composer
            → Tap Send
              → Reply appears, followers notified
          → Tap Back
        → Return to Forum
```

### Flow 3: Emergency Alert Broadcast (Admin)

```
Home (Dashboard)
  → Tap "Add" (center FAB)
    → Add Hub
      → Tap "Emergency Alert"
        → Create Alert
          → Select type: Emergency
          → Enter title + message
          → Tap "Broadcast"
            → Confirmation dialog: "Notify ALL users?"
              → Tap "Confirm"
                → Alert broadcast, all users receive push
                → Return to Emergency screen with active alert
```

### Flow 4: Location Share Request

```
User A: Maps screen
  → Tap "Share Location" (if available)
    → Select target user (User B)
    → Location share request created (status: pending)

User B: Receives push notification
  → Tap notification
    → Maps screen with banner: "User A wants to share location"
      → Tap "Accept"
        → Location share active
        → Both users see each other on map
        → User B taps "Stop Sharing" to end
```

### Flow 5: Net Check-In

```
Home (Dashboard)
  → Tap "Events" or "Nets"
    → Nets list
      → Tap active net
        → Net Control screen
          → Tap "Check In"
            → Check-in form (callsign, location, signal report)
              → Submit
                → Check-in recorded, appears in log
```

### Flow 6: Chat Message with Image

```
Chat tab
  → Chat screen
    → Tap attach (image icon)
      → Device file picker
        → Select image
          → Image preview thumbnail in composer
            → Type optional caption
            → Tap Send
              → Image uploads
              → Message with image appears in list
              → Other users see image in real-time
```

### Flow 7: Settings → Change Notification Preferences

```
More tab
  → More menu
    → Tap "Settings"
      → Settings
        → Tap "Notification Preferences"
          → Toggle off "Forum Notifications"
            → Preference saved immediately
          → Tap "Quiet Hours"
            → Set 22:00 – 07:00
              → Saved, push suppressed during quiet hours
        → Tap Back
      → Return to Settings
```

### Flow 8: View Repeater on Map

```
More tab
  → Tap "Repeaters"
    → Repeaters list
      → Tap repeater card
        → Repeater Detail
          → Tap "Open in Map"
            → Maps screen, centered on repeater
              → User can pan/zoom to see nearby repeaters
```

---

## Navigation State Management

### Stack Architecture

The app maintains a single navigation stack with tab-switching:

```
Root
├── Tab: Home (/)
├── Tab: Chat (/live-chat)
├── Tab: Add (/add) — modal presentation
├── Tab: Forum (/community-forum)
│   └── Push: Thread View (/forums/thread/:id)
│   └── Push: New Thread (/forums/new) — modal
└── Tab: More (/more)
    ├── Push: Repeaters (/repeaters)
    │   └── Push: Repeater Detail (/repeaters/:id)
    ├── Push: Weather (/weather)
    ├── Push: Maps (/map)
    ├── Push: Events (/events)
    │   └── Push: Event Detail (/events/:id)
    │   └── Push: Create Event (/events/create) — modal
    ├── Push: Emergency (/emergency)
    │   └── Push: Create Alert (/alerts/create) — modal
    ├── Push: Gallery (/gallery)
    ├── Push: Profile (/profile)
    ├── Push: Settings (/settings)
    └── Push: Notifications (/notifications)
```

### Tab State Preservation

Each tab maintains its own scroll position and internal stack state. Switching tabs and returning preserves the user's place. For example:
- User scrolls to thread #15 in Forum, switches to Chat, returns to Forum → still at thread #15.
- User opens Repeater Detail from More, switches to Home, returns to More → Repeater Detail is still open.

### Deep Linking

All routes support deep linking from push notifications and external links:
- Push notification tap → navigate directly to the source content
- URL like `mist.insomniacsgmrs.com/repeaters/123` → open Repeater Detail directly

### Back Navigation

- **Within a tab stack:** Back arrow returns to the previous screen in that tab's stack.
- **From a pushed screen to a different tab:** Back returns to the tab's root, not the previous tab.
- **Modal screens:** Back/dismiss returns to the screen that presented the modal.
- **Hardware back (Android):** Mirrors the back arrow behavior.

---

## Notification-Driven Navigation

Push notifications and in-app notifications navigate users directly to relevant content:

| Notification Type | Tap Destination |
|-------------------|-----------------|
| New chat message | Chat screen |
| New PM | Messages screen → thread |
| Forum reply | Thread View |
| Event reminder | Event Detail |
| Emergency alert | Emergency screen → alert detail |
| Location share request | Maps screen |
| Followed thread reply | Thread View |
| Mention | Thread View (scrolled to mention) |

---

## Accessibility & Touch Considerations

- **Minimum tap target:** 44×44pt for all interactive elements
- **Bottom bar height:** 64pt + safe area inset
- **Header height:** 56pt + safe area inset
- **Touch-action:** `manipulation` to prevent double-tap zoom
- **Pinch-zoom:** Disabled for native app feel
- **Safe areas:** `env(safe-area-inset-*)` for notches and home indicators
- **Scroll behavior:** Native momentum scrolling, no custom scroll libraries
- **Haptic feedback:** On message send, reaction toggle, long-press actions

---

## Empty, Loading & Error States

Every screen handles three non-happy-path states:

| State | Presentation |
|-------|-------------|
| **Loading** | Skeleton placeholders matching the content layout, or centered spinner |
| **Empty** | Centered illustration + descriptive text + primary action button |
| **Error** | Centered error icon + message + "Retry" button |

Loading and error states never block the entire screen if partial data is available — they show inline within the affected section only.