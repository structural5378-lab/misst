import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, MessageCircle, BellRing, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: MessageSquare, label: "Forum", path: "/community-forum" },
  { icon: null, label: "Add", path: "/add" }, // center action
  { icon: MessageCircle, label: "Chat", path: "/live-chat" },
  { icon: BellRing, label: "Messages", path: "/messages" },
];

export default function BottomNav() {
  const location = useLocation();
  const { mybbUser } = useMyBBAuth();

  const { data: unreadPMs = 0 } = useQuery({
    queryKey: ["unread-pms-badge", mybbUser?.username],
    queryFn: async () => {
      if (!mybbUser?.username || !mybbUser?.password) return 0;
      const res = await base44.functions.invoke("mybbMessages", {
        action: "get_pms",
        username: mybbUser.username,
        password: mybbUser.password,
      });
      return res.data?.unread_count || 0;
    },
    enabled: !!mybbUser?.password,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const [hasNewChat, setHasNewChat] = React.useState(false);
  const [hasNewPMs, setHasNewPMs] = React.useState(false);
  const isOnChat = location.pathname === "/live-chat";
  const isOnMessages = location.pathname === "/messages";
  const isOnChatRef = React.useRef(isOnChat);
  const myUidRef = React.useRef("");
  const prevUnreadRef = React.useRef(0);
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

  // Set PM glow on count increase; clear when all read
  React.useEffect(() => {
    if (unreadPMs > prevUnreadRef.current && !isOnMessages) {
      setHasNewPMs(true);
    }
    if (unreadPMs === 0) {
      setHasNewPMs(false);
    }
    prevUnreadRef.current = unreadPMs;
  }, [unreadPMs, isOnMessages]);

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
    <nav data-bottom-nav className="fixed bottom-0 left-0 right-0 z-[70] bg-background/95 backdrop-blur-xl border-t border-border transition-transform duration-300 ease-out will-change-transform">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = path === "/"
            ? location.pathname === "/"
            : location.pathname === path || location.pathname.startsWith(path + "/");
          const isAdd = label === "Add";
          const isMessages = label === "Messages";
          const isChat = label === "Chat";
          const hasUnread = isMessages && unreadPMs > 0;
          const badgeCount = isMessages ? unreadPMs : 0;
          const chatGlow = isChat && hasNewChat;
          const pmGlow = isMessages && hasNewPMs;

          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all ${
                isAdd ? "" : isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isAdd ? (
                <div className="relative -mt-5">
                  {/* Glow ring */}
                  <div className="absolute inset-0 rounded-full bg-primary blur-md opacity-50 scale-110" />
                  <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30 border-2 border-primary/30">
                    <Plus className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    {(chatGlow || pmGlow) && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-primary blur-xl chat-glow-flash" style={{borderRadius:'50%'}} />
                        <div className="absolute inset-0 rounded-full bg-white blur-md opacity-50 chat-glow-flash" style={{borderRadius:'50%'}} />
                      </>
                    )}
                    <Icon className={`w-5 h-5 transition-transform relative ${isActive ? "scale-110" : ""} ${(chatGlow || pmGlow) ? "text-white scale-125 chat-icon-flash" : ""}`} />
                    {hasUnread && (
                      <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-0.5 leading-none shadow-md">
                        {badgeCount > 9 ? "9+" : badgeCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? "text-primary" : ""}`}>
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