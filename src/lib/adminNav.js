import {
  LayoutDashboard, BarChart3, Users, Shield, Building, Building2,
  Award, Radio, MessageSquare, MessagesSquare, FileText, Palette,
  Image, MousePointerClick, Terminal, Server, Bell, Flag, ScrollText,
  Stethoscope, ClipboardList, RadioTower, CalendarClock, Newspaper,
  DatabaseBackup
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
    ]
  },
  {
    title: "User Management",
    items: [
      { label: "Users", path: "/platform/admin/users", icon: Users, minRole: 2 },
      { label: "Roles & Permissions", path: "/platform/admin/roles", icon: Shield, minRole: 3 },
    ]
  },
  {
    title: "Moderation",
    items: [
      { label: "Reports & Queue", path: "/platform/admin/reports", icon: ClipboardList, minRole: 1 },
      { label: "Forum Moderation", path: "/platform/admin/forum", icon: MessageSquare, minRole: 1 },
      { label: "Chat Moderation", path: "/platform/admin/chat", icon: MessagesSquare, minRole: 1 },
    ]
  },
  {
    title: "Community",
    items: [
      { label: "Communities", path: "/platform/admin/communities", icon: Building, minRole: 2 },
      { label: "Clubs", path: "/platform/admin/clubs", icon: Building2, minRole: 2 },
    ]
  },
  {
    title: "Content",
    items: [
      { label: "Content Manager", path: "/platform/admin/content", icon: FileText, minRole: 1 },
      { label: "News Management", path: "/platform/admin/news", icon: Newspaper, minRole: 2 },
      { label: "Badge System", path: "/platform/admin/badges", icon: Award, minRole: 2 },
    ]
  },
  {
    title: "Radio Operations",
    items: [
      { label: "RadioScope", path: "/platform/admin/radioscope", icon: Radio, minRole: 2 },
      { label: "Repeater Management", path: "/platform/admin/repeaters", icon: RadioTower, minRole: 2 },
      { label: "Nets Management", path: "/platform/admin/nets", icon: CalendarClock, minRole: 2 },
    ]
  },
  {
    title: "Platform",
    items: [
      { label: "Theme Builder", path: "/platform/admin/theme-builder", icon: Palette, minRole: 3 },
      { label: "Theme Diagnostic", path: "/platform/admin/theme-diagnostic", icon: Stethoscope, minRole: 3 },
      { label: "Media Library", path: "/platform/admin/media", icon: Image, minRole: 2 },
    ]
  },
  {
    title: "System",
    items: [
      { label: "Feature Flags", path: "/platform/admin/feature-flags", icon: Flag, minRole: 3 },
      { label: "Notifications", path: "/platform/admin/notifications", icon: Bell, minRole: 2 },
      { label: "Backup & Restore", path: "/platform/admin/backup", icon: DatabaseBackup, minRole: 3 },
      { label: "Developer Tools", path: "/platform/admin/developer", icon: Terminal, minRole: 3 },
      { label: "System", path: "/platform/admin/system", icon: Server, minRole: 3 },
      { label: "Audit Log", path: "/platform/admin/audit-log", icon: ScrollText, minRole: 2 },
    ]
  },
  {
    title: "Builder",
    items: [
      { label: "App Builder", path: "/platform/admin/app-builder", icon: MousePointerClick, minRole: 3 },
    ]
  }
];