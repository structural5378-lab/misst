import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import {
  Home, LayoutGrid, MessageSquare, Inbox, Bookmark, Star,
  Mail, Bell, Calendar, Radio, Users, Trophy, Shield, Flame,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";

const NAV = [
  {
    group: "Community",
    items: [
      { icon: Home, label: "Community Home", path: "/community-forum" },
      { icon: LayoutGrid, label: "Categories", path: "/community-forum" },
      { icon: MessageSquare, label: "Recent Discussions", path: "/community-forum" },
      { icon: Inbox, label: "Unread Posts", path: "/community-forum", search: "unread" },
    ],
  },
  {
    group: "Your Stuff",
    items: [
      { icon: Bookmark, label: "Bookmarks", path: "/community-forum", search: "filter=bookmarks" },
      { icon: Star, label: "My Threads", path: "/community-forum", search: "filter=mine" },
      { icon: Flame, label: "Following", path: "/community-forum", search: "filter=subscribed" },
    ],
  },
  {
    group: "Activity",
    items: [
      { icon: Mail, label: "Private Messages", path: "/messages" },
      { icon: Bell, label: "Notifications", path: "/notifications" },
      { icon: Calendar, label: "Events", path: "/nets" },
      { icon: Radio, label: "Repeaters", path: "/repeaters" },
      { icon: Users, label: "Members", path: "/members" },
      { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
      { icon: Users, label: "Online Users", path: "/members" },
    ],
  },
];

function isActive(item, pathname, search) {
  if (item.search) return pathname === item.path && search.includes(item.search);
  return pathname === item.path;
}

export default function DesktopLeftNav() {
  const { isAdmin } = useAdminAccess();
  const loc = useLocation();
  const here = loc.pathname + loc.search;

  const [width, setWidth] = useState(() => Number(localStorage.getItem("mist-desktop-nav-width")) || 248);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("mist-desktop-nav-collapsed") === "true");
  const dragging = useRef(false);

  useEffect(() => { localStorage.setItem("mist-desktop-nav-width", String(width)); }, [width]);
  useEffect(() => { localStorage.setItem("mist-desktop-nav-collapsed", String(collapsed)); }, [collapsed]);

  const startDrag = (e) => {
    if (collapsed) return;
    dragging.current = true;
    const startX = e.clientX;
    const startW = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const move = (ev) => {
      if (!dragging.current) return;
      setWidth(Math.max(208, Math.min(360, startW + (ev.clientX - startX))));
    };
    const up = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const effectiveWidth = collapsed ? 64 : width;

  return (
    <aside
      className="shrink-0 h-full border-r border-border bg-card/40 flex flex-col relative"
      style={{ width: effectiveWidth }}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        title={collapsed ? "Expand" : "Collapse"}
        className="absolute -right-3 top-4 z-10 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 shadow-sm"
      >
        {collapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
      </button>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-hide">
        {NAV.map((section) => (
          <div key={section.group} className="space-y-0.5">
            {!collapsed && (
              <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                {section.group}
              </p>
            )}
            {section.items.map((item) => {
              const active = isActive(item, loc.pathname, loc.search);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.search ? `${item.path}?${item.search}` : item.path}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-lg transition-colors ${
                    collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"
                  } ${active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Admin / Moderation */}
        {isAdmin && (
          <div className="space-y-0.5 pt-2 border-t border-border/50">
            {!collapsed && (
              <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Administration
              </p>
            )}
            <Link
              to="/community-forum?filter=moderation"
              title={collapsed ? "Moderation Queue" : undefined}
              className={`flex items-center gap-3 rounded-lg transition-colors ${
                collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"
              } text-muted-foreground hover:text-foreground hover:bg-secondary/60`}
            >
              <Shield className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="text-sm font-medium truncate">Moderation Queue</span>}
            </Link>
            <Link
              to="/platform/admin"
              title={collapsed ? "Admin (RBAC)" : undefined}
              className={`flex items-center gap-3 rounded-lg transition-colors ${
                collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"
              } text-muted-foreground hover:text-foreground hover:bg-secondary/60`}
            >
              <Shield className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="text-sm font-medium truncate">Admin (RBAC)</span>}
            </Link>
          </div>
        )}
      </nav>

      {/* Resize handle */}
      {!collapsed && (
        <div
          onMouseDown={startDrag}
          className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-primary/30 transition-colors"
        />
      )}
    </aside>
  );
}