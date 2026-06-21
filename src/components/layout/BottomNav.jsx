import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, MessageCircle, Bell, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: MessageSquare, label: "Forum", path: "/community-forum" },
  { icon: null, label: "Add", path: "/add" }, // center action
  { icon: MessageCircle, label: "Chat", path: "/live-chat" },
  { icon: Bell, label: "Alerts", path: "/alerts" },
];

export default function BottomNav() {
  const location = useLocation();
  const { mybbUser } = useMyBBAuth();

  const { data: unreadAlerts = 0 } = useQuery({
    queryKey: ["unread-alerts-badge"],
    queryFn: async () => {
      const alerts = await base44.entities.Alert.filter({ is_read: false });
      return alerts.filter(a => !a.title?.startsWith("__")).length;
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const [hasNewChat, setHasNewChat] = React.useState(false);
  const isOnChat = location.pathname === "/live-chat";

  // Clear glow when user is on the chat page
  React.useEffect(() => {
    if (isOnChat) {
      localStorage.setItem("chat_last_seen", Date.now().toString());
      setHasNewChat(false);
    }
  }, [isOnChat]);

  // Subscribe to new chat messages
  React.useEffect(() => {
    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type === "create" && !isOnChat) {
        const myUid = String(mybbUser?.uid || mybbUser?.username || "");
        const senderUid = String(event.data?.sender_uid || "");
        // Only glow if someone else posted
        if (senderUid !== myUid) {
          setHasNewChat(true);
        }
      }
    });
    return unsubscribe;
  }, [isOnChat, mybbUser]);



  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[hsl(210,30%,7%)]/95 backdrop-blur-xl border-t border-white/[0.06]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = path === "/"
            ? location.pathname === "/"
            : location.pathname === path || location.pathname.startsWith(path + "/");
          const isAdd = label === "Add";
          const isAlerts = label === "Alerts";
          const isChat = label === "Chat";
          const hasUnread = isAlerts && unreadAlerts > 0;
          const badgeCount = isAlerts ? unreadAlerts : 0;
          const chatGlow = isChat && hasNewChat;

          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all ${
                isAdd ? "" : isActive ? "text-violet-400" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isAdd ? (
                <div className="relative -mt-5">
                  {/* Glow ring */}
                  <div className="absolute inset-0 rounded-full bg-violet-500 blur-md opacity-50 scale-110" />
                  <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-xl shadow-violet-900/60 border-2 border-violet-400/30">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    {chatGlow && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-violet-400 blur-xl chat-glow-flash" style={{borderRadius:'50%'}} />
                        <div className="absolute inset-0 rounded-full bg-white blur-md opacity-50 chat-glow-flash" style={{borderRadius:'50%'}} />
                      </>
                    )}
                    <Icon className={`w-5 h-5 transition-transform relative ${isActive ? "scale-110" : ""} ${chatGlow ? "text-white scale-125 chat-icon-flash" : ""}`} />
                    {hasUnread && (
                      <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-0.5 leading-none shadow-md">
                        {badgeCount > 9 ? "9+" : badgeCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? "text-violet-400" : ""}`}>
                    {label}
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </div>
      {/* iPhone safe area */}
      <div className="h-safe-area-inset-bottom bg-transparent" />
    </nav>
  );
}