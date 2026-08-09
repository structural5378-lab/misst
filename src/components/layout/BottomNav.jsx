import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, MessageCircle, Plus, Shield, Radio } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useNetControlAccess } from "@/hooks/useNetControlAccess";
import AdminBadge from "@/components/admin/AdminBadge";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: MessageSquare, label: "Community", path: "/community-forum" },
  { icon: null, label: "Add", path: "/add" }, // center action
  { icon: MessageCircle, label: "Chat", path: "/messages" },
];

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useAdminAccess();
  const { canControl } = useNetControlAccess();

  const items = [
    ...navItems,
    ...(canControl ? [{ icon: Radio, label: "Mission", path: "/net-control", isMission: true }] : []),
    ...(isAdmin ? [{ icon: Shield, label: "Admin", path: "/platform/admin", isAdmin: true }] : []),
  ];

  const [chatUnread, setChatUnread] = useState(0);
  const [forumUnreadCount, setForumUnreadCount] = useState(0);

  // Chat V2 unread (DMs via ChatV2Participant + community rooms via ChatV2RoomMembership)
  useEffect(() => {
    if (!user?.id) return;
    const loadUnread = async () => {
      try {
        const [parts, rooms] = await Promise.all([
          base44.entities.ChatV2Participant.filter({ user_id: user.id }),
          base44.entities.ChatV2RoomMembership.filter({ user_id: user.id }),
        ]);
        const dm = (parts || []).reduce((s, p) => s + (p.unread_count || 0), 0);
        const room = (rooms || []).reduce((s, m) => s + (m.unread_count || 0), 0);
        setChatUnread(dm + room);
      } catch {}
    };
    loadUnread();
    const unsubA = base44.entities.ChatV2Participant.subscribe((e) => { if (e.data?.user_id === user.id) loadUnread(); });
    const unsubB = base44.entities.ChatV2RoomMembership.subscribe((e) => { if (e.data?.user_id === user.id) loadUnread(); });
    return () => { unsubA(); unsubB(); };
  }, [user?.id]);

  // Community forum unread
  useEffect(() => {
    if (!user?.id) return;
    const loadForumUnread = async () => {
      try {
        const subs = await base44.entities.ForumSubscription.filter({ user_id: user.id });
        const total = subs.reduce((sum, s) => sum + (s.unread_count || 0), 0);
        setForumUnreadCount(total);
      } catch {}
    };
    loadForumUnread();
    const unsub = base44.entities.ForumSubscription.subscribe((event) => {
      if (event.data?.user_id === user.id) loadForumUnread();
    });
    return unsub;
  }, [user?.id]);

  const [hasNewChat, setHasNewChat] = React.useState(false);
  const isOnChat = location.pathname.startsWith("/messages") || location.pathname.startsWith("/chat-v2");
  const prevUnreadRef = React.useRef(0);
  const isFirstLoadRef = React.useRef(true);

  // Glow on unread increase; clear when viewing chat or all read
  React.useEffect(() => {
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      prevUnreadRef.current = chatUnread;
      return;
    }
    if (chatUnread > prevUnreadRef.current && !isOnChat) setHasNewChat(true);
    if (chatUnread === 0 || isOnChat) setHasNewChat(false);
    prevUnreadRef.current = chatUnread;
  }, [chatUnread, isOnChat]);

  React.useEffect(() => {
    if (isOnChat) setHasNewChat(false);
  }, [isOnChat]);

  return (
    <nav data-bottom-nav aria-label="Primary navigation" className="fixed bottom-0 left-0 right-0 z-[70] mist-nav-bar transition-transform duration-300 ease-out will-change-transform">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {items.map(({ icon: Icon, label, path }) => {
          const isActive = path === "/"
            ? location.pathname === "/"
            : location.pathname === path || location.pathname.startsWith(path + "/") ||
              (label === "Mission" && /\/nets\/[^/]+\/(control|ops|display|wallboard)/.test(location.pathname));
          const isAdd = label === "Add";
          const isChat = label === "Chat";
          const isAdminItem = label === "Admin";
          const isCommunity = label === "Community";
          const hasUnread = (isChat && chatUnread > 0) || (isCommunity && forumUnreadCount > 0);
          const badgeCount = isChat ? chatUnread : (isCommunity ? forumUnreadCount : 0);
          const chatGlow = isChat && hasNewChat;

          return (
            <Link
              key={path}
              to={path}
              aria-current={isActive ? "page" : undefined}
              aria-label={isAdd ? "Add content" : label}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all ${
                isAdd ? "" : isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isAdd ? (
                <div className="relative -mt-7">
                  {/* Layered glowing halo */}
                  <div className="absolute inset-0 rounded-full bg-primary/50 blur-lg mist-fab-halo" />
                  <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-violet-500/40 to-cyan-400/40 blur-md opacity-80" />
                  <div className="relative rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-violet-500/50 border-2 border-white/25" style={{ width: 58, height: 58 }}>
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    {chatGlow && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-primary blur-xl chat-glow-flash" style={{borderRadius:'50%'}} />
                        <div className="absolute inset-0 rounded-full bg-white blur-md opacity-50 chat-glow-flash" style={{borderRadius:'50%'}} />
                      </>
                    )}
                    <Icon className={`w-5 h-5 transition-transform relative ${isActive ? "scale-110" : ""} ${chatGlow ? "text-white scale-125 chat-icon-flash" : ""}`} />
                    {hasUnread && (
                      <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1 leading-none shadow-md ring-2 ring-background">
                        {badgeCount > 9 ? "9+" : badgeCount}
                      </span>
                    )}
                    {isAdminItem && <AdminBadge />}
                  </div>
                  <span className={`relative text-[10px] font-medium ${isActive ? "text-primary" : ""}`}>
                    {isActive && <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-[0_0_6px_rgba(139,92,246,0.8)]" />}
                    {label}
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </div>
      {/* iPhone safe area + home indicator clearance */}
      <div style={{ height: "max(env(safe-area-inset-bottom), 8px)" }} />
    </nav>
  );
}