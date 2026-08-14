import {
  Bell,
  MessageSquare,
  Megaphone,
  UserPlus,
  AtSign,
  Radio,
  RadioTower,
  AlertTriangle,
  ShieldAlert,
  UserCheck,
  Crosshair,
  MapPin,
  CloudLightning,
  Sparkles,
  CalendarClock,
  Newspaper,
} from "lucide-react";

// Canonical notification categories + their presentation metadata.
// Mirrors base44/shared/notificationTypes.ts (NOTIF_CATEGORIES). "all" is a UI-only filter.
export const NOTIF_CATEGORIES = {
  direct_message:        { label: "Direct Messages",   color: "#06B6D4", icon: MessageSquare,  tag: "dm",        sound: true,  requireInteraction: false },
  community_chat:        { label: "Community Chat",     color: "#8B5CF6", icon: MessageSquare,  tag: "chat",      sound: true,  requireInteraction: false },
  community_announcement:{ label: "Announcements",      color: "#F59E0B", icon: Megaphone,      tag: "announce",  sound: true,  requireInteraction: false },
  mission_control:       { label: "Mission Control",   color: "#EF4444", icon: Crosshair,      tag: "mission",   sound: true,  requireInteraction: true  },
  net_starting:          { label: "Net Started",        color: "#10B981", icon: Radio,          tag: "net",       sound: true,  requireInteraction: false },
  net_ended:             { label: "Net Ended",          color: "#64748B", icon: RadioTower,     tag: "net",       sound: false, requireInteraction: false },
  radioscope_nearby:     { label: "RadioScope Nearby", color: "#06B6D4", icon: MapPin,         tag: "radioscope",sound: false, requireInteraction: false },
  emergency_alert:       { label: "Emergency Traffic",  color: "#EF4444", icon: ShieldAlert,    tag: "emergency", sound: true,  requireInteraction: true  },
  weather_alert:         { label: "Weather Alerts",     color: "#3B82F6", icon: CloudLightning, tag: "weather",   sound: true,  requireInteraction: false },
  system:                { label: "System",             color: "#64748B", icon: Bell,           tag: "system",    sound: false, requireInteraction: false },
  ai_assistant:          { label: "AI Assistant",       color: "#D946EF", icon: Sparkles,       tag: "ai",        sound: false, requireInteraction: false },
  friend_request:        { label: "Friend Requests",    color: "#22C55E", icon: UserPlus,       tag: "friends",   sound: true,  requireInteraction: false },
  community_invite:      { label: "Invites",            color: "#8B5CF6", icon: UserCheck,      tag: "invite",    sound: true,  requireInteraction: false },
  user_mention:           { label: "Mentions",          color: "#06B6D4", icon: AtSign,         tag: "mention",   sound: true,  requireInteraction: false },
  event_reminder:         { label: "Event Reminders",   color: "#F97316", icon: CalendarClock,  tag: "event",     sound: true,  requireInteraction: false },
  forum_reply:             { label: "Forum Replies",    color: "#8B5CF6", icon: MessageSquare,  tag: "forum",     sound: true,  requireInteraction: false },
  news:                    { label: "News",              color: "#0EA5E9", icon: Newspaper,      tag: "news",      sound: true,  requireInteraction: false },
  repeater_added:          { label: "Repeaters",         color: "#10B981", icon: Radio,          tag: "repeater",  sound: true,  requireInteraction: false },
};

export const NOTIF_FILTERS = [
  { id: "all", label: "All", icon: Bell },
  ...Object.entries(NOTIF_CATEGORIES).map(([id, c]) => ({ id, label: c.label, icon: c.icon })),
];

export function getNotifMeta(type) {
  return NOTIF_CATEGORIES[type] || { label: "Notification", color: "#8B5CF6", icon: Bell, sound: false, requireInteraction: false };
}

export const NOTIF_TYPE_META = Object.fromEntries(
  Object.entries(NOTIF_CATEGORIES).map(([id, c]) => [id, { id, label: c.label, icon: c.icon, color: c.color }])
);