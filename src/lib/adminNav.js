import {
  LayoutDashboard, BarChart3, Users, ShieldCheck, ClipboardList,
  MessageSquare, MessagesSquare, Mail, RadioTower, Radio, CalendarClock,
  Building2, Image, ShoppingCart, Award, Bell, Palette, LayoutGrid, Server,
  ShieldAlert, DatabaseBackup, Terminal, LayoutTemplate, KeyRound, FlaskConical, Activity, CloudLightning,
  Home, User, Settings, CalendarDays, Crown,
} from "lucide-react";

// Role levels: platform_owner=3, platform_admin=2, platform_support=1
// Items with minRole are only visible to users whose max role level >= minRole.
// Items without minRole are visible to all admins (minRole=1).

export const adminNavSections = [
  {
    title: "Command Center",
    items: [
      { label: "Dashboard", path: "/platform/admin", icon: LayoutDashboard, end: true, minRole: 1 },
      { label: "Analytics", path: "/platform/admin/analytics", icon: BarChart3, minRole: 2 },
    ],
  },
  {
    title: "People",
    items: [
      { label: "User Management", path: "/platform/admin/users", icon: Users, minRole: 2 },
      { label: "Roles & Permissions", path: "/platform/admin/roles", icon: ShieldCheck, minRole: 3 },
    ],
  },
  {
    title: "Communities",
    items: [
      { label: "Community Management", path: "/platform/admin/communities", icon: Building2, minRole: 2 },
    ],
  },
  {
    title: "Moderation",
    items: [
      { label: "Reports & Queue", path: "/platform/admin/reports", icon: ClipboardList, minRole: 1 },
      { label: "Forum Management", path: "/platform/admin/forum", icon: MessageSquare, minRole: 1 },
      { label: "Live Chat Moderation", path: "/platform/admin/chat", icon: MessagesSquare, minRole: 1 },
      { label: "Private Messages", path: "/platform/admin/private-messages", icon: Mail, minRole: 2 },
    ],
  },
  {
    title: "Radio Operations",
    items: [
      { label: "Repeaters", path: "/platform/admin/repeaters", icon: RadioTower, minRole: 2 },
      { label: "RadioScope", path: "/platform/admin/radioscope", icon: Radio, minRole: 2 },
      { label: "Nets & Events", path: "/platform/admin/nets", icon: CalendarClock, minRole: 2 },
      { label: "Net Templates", path: "/platform/admin/net-templates", icon: LayoutTemplate, minRole: 2 },
      { label: "Scheduled Nets", path: "/platform/admin/scheduled-nets", icon: CalendarClock, minRole: 2 },
      { label: "Net Logs", path: "/platform/admin/net-logs", icon: ClipboardList, minRole: 1 },
    ],
  },
  {
    title: "Content & Community",
    items: [
      { label: "Gallery", path: "/platform/admin/gallery", icon: Image, minRole: 2 },
      { label: "Marketplace", path: "/platform/admin/marketplace", icon: ShoppingCart, minRole: 2 },
      { label: "Badges & Achievements", path: "/platform/admin/badges", icon: Award, minRole: 2 },
      { label: "Premium Badges", path: "/platform/admin/premium-badges", icon: Crown, minRole: 2 },
    ],
  },
  {
    title: "Notifications",
    items: [
      { label: "Analytics", path: "/platform/admin/notifications", icon: BarChart3, minRole: 2, end: true },
      { label: "Delivery Logs", path: "/platform/admin/notifications/logs", icon: ClipboardList, minRole: 2 },
      { label: "Test Console", path: "/platform/admin/notifications/test", icon: FlaskConical, minRole: 2 },
      { label: "Live Monitor", path: "/platform/admin/notifications/monitor", icon: Activity, minRole: 2 },
    ],
  },
  {
    title: "Weather",
    items: [
      { label: "Lightning", path: "/platform/admin/lightning", icon: CloudLightning, minRole: 2 },
    ],
  },
  {
    title: "Platform",
    items: [
      { label: "Theme Manager", path: "/platform/admin/theme-builder", icon: Palette, minRole: 3 },
      { label: "Customization", path: "/platform/admin/content", icon: LayoutGrid, minRole: 2 },
      { label: "System Settings", path: "/platform/admin/system", icon: Server, minRole: 3 },
      { label: "Security", path: "/platform/admin/audit-log", icon: ShieldAlert, minRole: 2 },
      { label: "Backup & Restore", path: "/platform/admin/backup", icon: DatabaseBackup, minRole: 3 },
      { label: "Developer Tools", path: "/platform/admin/developer", icon: Terminal, minRole: 3 },
      { label: "Secrets & Config", path: "/platform/admin/secrets", icon: KeyRound, minRole: 3 },
    ],
  },
];

/**
 * Application Navigation — links into the main MISST app (not the admin
 * console). `slug` is the active community slug (optional). When present,
 * community-scoped destinations point inside /c/:slug.
 */
export function getAppNavItems(slug) {
  const c = slug ? `/c/${slug}` : null;
  const items = [
    { label: "Return to Dashboard", path: "/", icon: LayoutDashboard },
  ];
  if (c) items.push({ label: "Community Home", path: c, icon: Home });
  items.push({ label: "My Communities", path: "/my-communities", icon: Users });
  items.push({ label: "RadioScope", path: "/radioscope", icon: Radio });
  items.push({ label: "Messages", path: "/messages", icon: Mail });
  if (c) items.push({ label: "Events", path: `${c}/events`, icon: CalendarDays });
  items.push({ label: "Members", path: "/members", icon: Users });
  items.push({ label: "Profile", path: "/profile", icon: User });
  items.push({ label: "Settings", path: "/settings", icon: Settings });
  return items;
}

/**
 * Flattened list of every admin destination (for the command palette).
 */
export function getAllAdminDestinations() {
  return adminNavSections.flatMap((s) => s.items.map((i) => ({ label: i.label, path: i.path, icon: i.icon, group: s.title })));
}