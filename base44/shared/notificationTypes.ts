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
  "badge_earned",
  "community_invite",
  "system",
  "mission_control",
  "radioscope_nearby",
  "weather_alert",
  "ai_assistant",
  "event_reminder",
];

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
  community_announcement:{ label: "Announcements",     color: "#F59E0B", icon: "Megaphone",      tag: "announce",  sound: true,  vibrate: [150],                    requireInteraction: false },
  mission_control:       { label: "Mission Control",   color: "#EF4444", icon: "Crosshair",      tag: "mission",   sound: true,  vibrate: [200, 100, 200],         requireInteraction: true  },
  net_starting:          { label: "Net Started",       color: "#10B981", icon: "Radio",          tag: "net",       sound: true,  vibrate: [120, 60, 120],          requireInteraction: false },
  net_ended:             { label: "Net Ended",         color: "#64748B", icon: "RadioTower",     tag: "net",       sound: false,                                    requireInteraction: false },
  radioscope_nearby:     { label: "RadioScope Nearby", color: "#06B6D4", icon: "MapPin",         tag: "radioscope",sound: false,                                    requireInteraction: false },
  emergency_alert:       { label: "Emergency Traffic", color: "#EF4444", icon: "ShieldAlert",    tag: "emergency", sound: true,  vibrate: [200, 100, 200, 100, 200], requireInteraction: true },
  weather_alert:         { label: "Weather Alerts",    color: "#3B82F6", icon: "CloudLightning", tag: "weather",   sound: true,  vibrate: [150, 100, 150],         requireInteraction: false },
  system:                { label: "System",            color: "#64748B", icon: "Bell",           tag: "system",    sound: false,                                    requireInteraction: false },
  ai_assistant:          { label: "AI Assistant",      color: "#D946EF", icon: "Sparkles",       tag: "ai",        sound: false,                                    requireInteraction: false },
  friend_request:        { label: "Friend Requests",   color: "#22C55E", icon: "UserPlus",       tag: "friends",   sound: true,  vibrate: [100],                    requireInteraction: false },
  badge_earned:          { label: "Badges",            color: "#F59E0B", icon: "Award",          tag: "badge",     sound: true,  vibrate: [80, 40, 80, 40, 80],    requireInteraction: false },
  community_invite:      { label: "Invites",           color: "#8B5CF6", icon: "UserCheck",      tag: "invite",    sound: true,  vibrate: [100],                    requireInteraction: false },
  user_mention:          { label: "Mentions",          color: "#06B6D4", icon: "AtSign",         tag: "mention",   sound: true,  vibrate: [80, 40, 80],             requireInteraction: false },
  event_reminder:        { label: "Event Reminders",   color: "#F97316", icon: "CalendarClock",  tag: "event",     sound: true,  vibrate: [150, 80, 150],          requireInteraction: false },
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