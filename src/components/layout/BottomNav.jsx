import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, MessageCircle, Mail, Plus, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMistUser } from "@/hooks/useMistUser";
import { useAuth } from "@/lib/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import AdminBadge from "@/components/admin/AdminBadge";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: MessageSquare, label: "Community", path: "/community-forum" },
  { icon: null, label: "Add", path: "/add" }, // center action
  { icon: MessageCircle, label: "Chat", path: "/live-chat" },
  { icon: Mail, label: "Messages", path: "/messages" },
];

export default function BottomNav() {
  const location = useLocation();
  const { mybbUser } = useMistUser();
  const { user } = useAuth();
  const { isAdmin } = useAdminAccess();

  const items = [
    ...navItems,
    ...(isAdmin ? [{ icon: Shield, label: "Admin", path: "/platform/admin", isAdmin: true }] : []),
  ];

  const [dmUnreadCount, setDmUnreadCount] = useState(0);
  const [forumUnreadCount, setForumUnreadCount] = useState(0);

  // Native MIST DM unread count (replaces MyBB PM badge)
  useEffect(() => {
    if (!user?.id) return;
    const loadUnread = async () => {
      try {
        const parts = await base44.entities.ConversationParticipant.filter({ user_id: user.id });
        const total = parts.reduce((sum, p) => sum + (p.unread_count || 0), 0);
        setDmUnreadCount(total);
      } catch {}
    };
    loadUnread();
    const unsub = base44.entities.ConversationParticipant.subscribe((event) => {
      if (event.data?.user_id === user.id) loadUnread();
    });
    return unsub;
  }, [user?.id]);

  // Native MIST Community forum unread count
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
  const [hasNewPMs, setHasNewPMs] = React.useState(false);
  const isOnChat = location.pathname === "/live-chat";
  const isOnMessages = location.pathname === "/messages";
  const isOnChatRef = React.useRef(isOnChat);
  const myUidRef = React.useRef("");
  const prevUnreadRef = React.useRef(0);
  const isFirstLoadRef = React.useRef(true);
  React.useEffect(() => { isOnChatRef.current = isOnChat; }, [isOnChat]);
  React.useEffect(() => { myUidRef.current = String(mybbUser?.uid || mybbUser?.username || ""); }, [mybbUser]);

  // Clear glow when user is on the chat page
  React.useEffect(() => {
    if (isOnChat) {
      localStorage.setItem("chat_last_seen", Date.now().toString());
      setHasNewChat(false);
    }
  }, [isOnChat]);

  // Clear PM glow when user is on the messages page
  React.useEffect(() => {
    if (isOnMessages) {
      localStorage.setItem("pms_last_seen", Date.now().toString());
      setHasNewPMs(false);
    }
  }, [isOnMessages]);

  // Set DM glow on count increase (skip initial load); clear when all read or viewing messages
  React.useEffect(() => {
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      prevUnreadRef.current = dmUnreadCount;
      return;
    }
    if (dmUnreadCount > prevUnreadRef.current && !isOnMessages) {
      setHasNewPMs(true);
    }
    if (dmUnreadCount === 0 || isOnMessages) {
      setHasNewPMs(false);
    }
    prevUnreadRef.current = dmUnreadCount;
  }, [dmUnreadCount, isOnMessages]);

  // Subscribe to new chat messages (single stable subscription via refs)
  React.useEffect(() => {
    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type === "create" && !isOnChatRef.current) {
        const senderUid = String(event.data?.sender_uid || "");
        if (senderUid !== myUidRef.current) {
          setHasNewChat(true);
        }
      }
    });
    return unsubscribe;
  }, []);



  return (
    <nav data-bottom-nav aria-label="Primary navigation" className="fixed bottom-0 left-0 right-0 z-[70] bg-background/80 backdrop-blur-2xl border-t border-white/[0.06] transition-transform duration-300 ease-out will-change-transform">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {items.map(({ icon: Icon, label, path }) => {
          const isActive = path === "/"
            ? location.pathname === "/"
            : location.pathname === path || location.pathname.startsWith(path + "/");
          const isAdd = label === "Add";
          const isMessages = label === "Messages";
          const isChat = label === "Chat";
          const isAdminItem = label === "Admin";
          const isCommunity = label === "Community";
          const hasUnread = (isMessages && dmUnreadCount > 0) || (isCommunity && forumUnreadCount > 0);
          const badgeCount = isMessages ? dmUnreadCount : (isCommunity ? forumUnreadCount : 0);
          const chatGlow = isChat && hasNewChat;
          const pmGlow = isMessages && hasNewPMs;

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
                <div className="relative -mt-6">
                  {/* Animated glowing halo */}
                  <div className="absolute inset-0 rounded-full bg-primary/60 blur-lg mist-fab-halo" />
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 blur-md opacity-70" />
                  <div className="relative rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/40 border border-white/20" style={{ width: 52, height: 52 }}>
                    <Plus className="w-6 h-6 text-primary-foreground" />
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
                    {pmGlow && (
                      <div className="absolute inset-0 rounded-full bg-primary/40 blur-md mist-nav-glow-ring" />
                    )}
                    <Icon className={`w-5 h-5 transition-transform relative ${isActive ? "scale-110" : ""} ${chatGlow ? "text-white scale-125 chat-icon-flash" : ""} ${pmGlow ? "text-primary mist-nav-pulse" : ""}`} />
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
      {/* iPhone safe area */}
      <div style={{ height: "env(safe-area-inset-bottom)" }} />
    </nav>
  );
}