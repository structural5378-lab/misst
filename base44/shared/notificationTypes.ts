// MIST notification category metadata — single source of truth (server-side).
// Mirrored client-side by src/lib/notificationTypes.js. Drives FCM payload
// (sound, vibration, tag, requireInteraction, color), Notification Center
// presentation (icon, color, label), and deep-link resolution.

export const NOTIF_TYPES = [
  "direct_message",
  "community_chat",
  "community_announcement",
  "friend_request",
  "user_mention",
  "net_starting",
  "net_ended",
  "emergency_alert",
  "community_invite",
  "system",
  "mission_control",
  "radioscope_nearby",
  "weather_alert",
  "ai_assistant",
  "event_reminder",
  "forum_reply",
  "news",
  "repeater_added",
];

// Maps a Notification.type to the user-facing preference key in User.notif_settings
// (written by Settings > Notification Categories). Types without an entry have no
// user toggle and are always delivered (e.g. emergency_alert, system).
export const TYPE_TO_PREF_KEY: Record<string, string> = {
  forum_reply: "forum_replies",
  user_mention: "mentions",
  direct_message: "messages",
  friend_request: "friend_requests",
  event_reminder: "events",
  repeater_added: "repeaters",
  news: "news",
  community_announcement: "announcements",
  emergency_alert: "emergency_alerts",
  community_chat: "community_chat",
  system: "system",
};

// Mirrors DEFAULT_NOTIFS in src/hooks/useAccountPrefs.js so the engine's default
// behavior matches what the Settings UI shows when a user has no stored prefs.
// Per-category default channels: { push, inapp, sound, vibrate }. A category is
// fully disabled for a user only when BOTH push and inapp are false (no push, no
// in-app record, no badge). Emergency alerts are always delivered (sound/vibrate
// still respect preferences). Legacy flat booleans are tolerated by categoryPrefs.
export const DEFAULT_NOTIF_SETTINGS = {
  forum_replies: { push: true, inapp: true, sound: true, vibrate: true },
  mentions: { push: true, inapp: true, sound: true, vibrate: true },
  messages: { push: true, inapp: true, sound: true, vibrate: true },
  friend_requests: { push: true, inapp: true, sound: true, vibrate: true },
  events: { push: true, inapp: true, sound: true, vibrate: true },
  repeaters: { push: false, inapp: false, sound: true, vibrate: true },
  news: { push: true, inapp: true, sound: true, vibrate: true },
  announcements: { push: true, inapp: true, sound: true, vibrate: true },
  emergency_alerts: { push: true, inapp: true, sound: true, vibrate: true },
  community_chat: { push: true, inapp: true, sound: true, vibrate: true },
  system: { push: false, inapp: true, sound: false, vibrate: false },
  push: true,
  email: true,
  sms: false,
};

export const NOTIF_CATEGORIES: Record<string, {
  label: string;
  color: string;
  icon: string;
  tag: string;
  sound: boolean;
  vibrate?: number[];
  requireInteraction: boolean;
}> = {
  direct_message:        { label: "Direct Messages",   color: "#06B6D4", icon: "MessageSquare",  tag: "dm",        sound: true,  vibrate: [100, 50, 100],          requireInteraction: false },
  community_chat:        { label: "Community Chat",     color: "#8B5CF6", icon: "MessageSquare",  tag: "chat",      sound: true,  vibrate: [80, 40, 80],             requireInteraction: false },
  community_announcement:{ label: "Announcements",      color: "#F59E0B", icon: "Megaphone",      tag: "announce",  sound: true,  vibrate: [150],                    requireInteraction: false },
  mission_control:       { label: "Mission Control",   color: "#EF4444", icon: "Crosshair",      tag: "mission",   sound: true,  vibrate: [200, 100, 200],         requireInteraction: true  },
  net_starting:          { label: "Net Started",        color: "#10B981", icon: "Radio",          tag: "net",       sound: true,  vibrate: [120, 60, 120],          requireInteraction: false },
  net_ended:             { label: "Net Ended",          color: "#64748B", icon: "RadioTower",     tag: "net",       sound: false,                                    requireInteraction: false },
  radioscope_nearby:     { label: "RadioScope Nearby", color: "#06B6D4", icon: "MapPin",         tag: "radioscope",sound: false,                                    requireInteraction: false },
  emergency_alert:       { label: "Emergency Traffic",  color: "#EF4444", icon: "ShieldAlert",    tag: "emergency", sound: true,  vibrate: [200, 100, 200, 100, 200], requireInteraction: true },
  weather_alert:         { label: "Weather Alerts",     color: "#3B82F6", icon: "CloudLightning", tag: "weather",   sound: true,  vibrate: [150, 100, 150],         requireInteraction: false },
  system:                { label: "System",             color: "#64748B", icon: "Bell",           tag: "system",    sound: false,                                    requireInteraction: false },
  ai_assistant:          { label: "AI Assistant",       color: "#D946EF", icon: "Sparkles",       tag: "ai",        sound: false,                                    requireInteraction: false },
  friend_request:        { label: "Friend Requests",    color: "#22C55E", icon: "UserPlus",       tag: "friends",   sound: true,  vibrate: [100],                    requireInteraction: false },
  community_invite:      { label: "Invites",            color: "#8B5CF6", icon: "UserCheck",      tag: "invite",    sound: true,  vibrate: [100],                    requireInteraction: false },
  user_mention:          { label: "Mentions",           color: "#06B6D4", icon: "AtSign",         tag: "mention",   sound: true,  vibrate: [80, 40, 80],             requireInteraction: false },
  event_reminder:        { label: "Event Reminders",   color: "#F97316", icon: "CalendarClock",  tag: "event",     sound: true,  vibrate: [150, 80, 150],          requireInteraction: false },
  forum_reply:           { label: "Forum Replies",      color: "#8B5CF6", icon: "MessageSquare",  tag: "forum",     sound: true,  vibrate: [100, 50, 100],          requireInteraction: false },
  news:                  { label: "News",               color: "#0EA5E9", icon: "Newspaper",     tag: "news",      sound: true,  vibrate: [100],                    requireInteraction: false },
  repeater_added:        { label: "Repeaters",          color: "#10B981", icon: "Radio",          tag: "repeater",  sound: true,  vibrate: [120, 60, 120],          requireInteraction: false },
};

export function getCategoryMeta(type: string) {
  return (
    NOTIF_CATEGORIES[type] || {
      label: "Notification",
      color: "#8B5CF6",
      icon: "Bell",
      tag: "mist",
      sound: true,
      requireInteraction: false,
    }
  );
}