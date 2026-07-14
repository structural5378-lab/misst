import {
  LayoutDashboard, BarChart3, Users, Shield, Building, Building2,
  Award, Radio, MessageSquare, MessagesSquare, FileText, Palette,
  Image, MousePointerClick, Terminal, Server, Bell, Flag, ScrollText
} from "lucide-react";

export const adminNavSections = [
  {
    title: "Command Center",
    items: [
      { label: "Dashboard", path: "/platform/admin", icon: LayoutDashboard, end: true },
      { label: "Analytics", path: "/platform/admin/analytics", icon: BarChart3 },
    ]
  },
  {
    title: "User Management",
    items: [
      { label: "Users", path: "/platform/admin/users", icon: Users },
      { label: "Roles & Permissions", path: "/platform/admin/roles", icon: Shield },
    ]
  },
  {
    title: "Community",
    items: [
      { label: "Communities", path: "/platform/admin/communities", icon: Building },
      { label: "Clubs", path: "/platform/admin/clubs", icon: Building2 },
    ]
  },
  {
    title: "Content",
    items: [
      { label: "Content Manager", path: "/platform/admin/content", icon: FileText },
      { label: "Forum Moderation", path: "/platform/admin/forum", icon: MessageSquare },
      { label: "Chat Moderation", path: "/platform/admin/chat", icon: MessagesSquare },
      { label: "Badge System", path: "/platform/admin/badges", icon: Award },
    ]
  },
  {
    title: "Platform",
    items: [
      { label: "RadioScope", path: "/platform/admin/radioscope", icon: Radio },
      { label: "Theme Builder", path: "/platform/admin/theme-builder", icon: Palette },
      { label: "Media Library", path: "/platform/admin/media", icon: Image },
    ]
  },
  {
    title: "System",
    items: [
      { label: "Feature Flags", path: "/platform/admin/feature-flags", icon: Flag },
      { label: "Notifications", path: "/platform/admin/notifications", icon: Bell },
      { label: "Developer Tools", path: "/platform/admin/developer", icon: Terminal },
      { label: "System", path: "/platform/admin/system", icon: Server },
      { label: "Audit Log", path: "/platform/admin/audit-log", icon: ScrollText },
    ]
  },
  {
    title: "Builder",
    items: [
      { label: "App Builder", path: "/platform/admin/app-builder", icon: MousePointerClick },
    ]
  }
];