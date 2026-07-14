import React, { useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { Search, Edit2, Archive, Pin, Bell, Users, Mail } from "lucide-react";

function formatTimestamp(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

function getPreview(msg, isMe) {
  const prefix = isMe ? "You: " : "";
  if (msg.last_message_type === "image") return `${prefix}📷 Photo`;
  if (msg.last_message_type === "file") return `${prefix}📎 File`;
  return `${prefix}${msg.last_message_preview || "Say hello!"}`;
}

export default function MistConversationList({
  conversations, activeConversationId, unreadTotal, onlineUserIds,
  searchQuery, setSearchQuery, showArchived, setShowArchived,
  onSelect, onCompose,
}) {
  return (
    <div className="flex flex-col h-full bg-card">
      {/* Search bar */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-secondary border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={onCompose}
            className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" /> New Chat
          </button>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              showArchived ? "bg-primary/15 text-primary border border-primary/20" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Archive className="w-3.5 h-3.5" /> {showArchived ? "Active" : "Archived"}
          </button>
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Mail className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {showArchived ? "No archived conversations" : "No messages yet"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              {showArchived ? "Archived chats will appear here" : "Start a conversation with a member"}
            </p>
            {!showArchived && (
              <button
                onClick={onCompose}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                New Message
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const displayName = conv.type === "group"
                ? conv.title || "Group Chat"
                : conv.otherParticipants[0]?.user_name || "Unknown";
              const displayAvatar = conv.type === "group"
                ? conv.avatar_url
                : conv.otherParticipants[0]?.user_avatar;
              const otherUserId = conv.type === "direct" ? conv.otherParticipants[0]?.user_id : null;
              const isOnline = otherUserId && onlineUserIds.has(otherUserId);
              const isMe = conv.last_message_sender_id === conv.myParticipant?.user_id;
              const unread = conv.unreadCount || 0;

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 transition-colors text-left ${
                    isActive ? "bg-primary/10" : "hover:bg-secondary/50"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt={displayName} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                        {conv.type === "group" ? <Users className="w-5 h-5" /> : (displayName[0] || "?").toUpperCase()}
                      </div>
                    )}
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-success border-2 border-card" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {conv.isPinned && <Pin className="w-3 h-3 text-primary shrink-0" />}
                        <span className={`text-sm truncate ${unread > 0 ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                          {displayName}
                        </span>
                        {conv.isMuted && <Bell className="w-3 h-3 text-muted-foreground shrink-0" />}
                      </div>
                      <span className={`text-[10px] shrink-0 ${unread > 0 ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                        {formatTimestamp(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-xs truncate ${unread > 0 ? "text-foreground/70" : "text-muted-foreground"}`}>
                        {getPreview(conv, isMe)}
                      </p>
                      {unread > 0 && (
                        <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1 shrink-0">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}