import {
  Bell,
  MessageSquare,
  Megaphone,
  UserPlus,
  AtSign,
  Radio,
  AlertTriangle,
  Award,
  UserCheck,
} from "lucide-react";

// Canonical notification types + their Notification Center presentation.
// Mirrors base44/shared/notifications.ts (NOTIF_TYPES). "all" is a UI-only filter.
export const NOTIF_FILTERS = [
  { id: "all", label: "All", icon: Bell },
  { id: "direct_message", label: "Messages", icon: MessageSquare },
  { id: "community_chat", label: "Chat", icon: MessageSquare },
  { id: "community_announcement", label: "Announcements", icon: Megaphone },
  { id: "friend_request", label: "Friend Requests", icon: UserPlus },
  { id: "user_mention", label: "Mentions", icon: AtSign },
  { id: "net_starting", label: "Nets", icon: Radio },
  { id: "emergency_alert", label: "Alerts", icon: AlertTriangle },
  { id: "badge_earned", label: "Badges", icon: Award },
  { id: "community_invite", label: "Invites", icon: UserCheck },
];

export const NOTIF_TYPE_META = Object.fromEntries(
  NOTIF_FILTERS.filter((f) => f.id !== "all").map((f) => [f.id, f])
);