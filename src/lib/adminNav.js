import {
  LayoutDashboard, BarChart3, Users, ShieldCheck, ClipboardList,
  MessageSquare, MessagesSquare, Mail, RadioTower, Radio, CalendarClock,
  Image, ShoppingCart, Award, Bell, Palette, LayoutGrid, Server,
  ShieldAlert, DatabaseBackup, Terminal,
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
      { label: "Groups & Permissions", path: "/platform/admin/roles", icon: ShieldCheck, minRole: 3 },
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
    ],
  },
  {
    title: "Content & Community",
    items: [
      { label: "Gallery", path: "/platform/admin/gallery", icon: Image, minRole: 2 },
      { label: "Marketplace", path: "/platform/admin/marketplace", icon: ShoppingCart, minRole: 2 },
      { label: "Badges & Achievements", path: "/platform/admin/badges", icon: Award, minRole: 2 },
      { label: "Notifications", path: "/platform/admin/notifications", icon: Bell, minRole: 2 },
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
    ],
  },
];