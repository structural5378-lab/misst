import {
  Hash, MessageSquare, Megaphone, CalendarDays, ShoppingCart, Siren, Radio,
  Coffee, Users, Bell, Lock, Pin, Star, Volume2, BookOpen, AlertTriangle, Flame,
} from "lucide-react";

// Curated icon set for community rooms. Keep names in sync with the
// DEFAULT_ROOMS in base44/shared/communityRooms.ts and ManageRoomDialog.
const ICONS = {
  Hash, MessageSquare, Megaphone, CalendarDays, ShoppingCart, Siren, Radio,
  Coffee, Users, Bell, Lock, Pin, Star, Volume2, BookOpen, AlertTriangle, Flame,
};

export const ICON_CHOICES = Object.keys(ICONS);

export default function RoomIcon({ name, className = "w-4 h-4" }) {
  const I = ICONS[name] || Hash;
  return <I className={className} />;
}