import React, { useRef, useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { ChevronLeft, Info, Search, X, Users, Phone } from "lucide-react";
import MistMessageBubble from "./MistMessageBubble";
import MistChatComposer from "./MistChatComposer";

function DateSeparator({ date }) {
  return (
    <div className="flex items-center justify-center my-3">
      <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-3 py-1 rounded-full">
        {format(new Date(date), "MMMM d, yyyy")}
      </span>
    </div>
  );
}

export default function MistChatView({
  conversation, messages, messagesLoading, onlineUserIds, typingUsers, currentUserId,
  onSend, onTyping, onReply, onEdit, onDelete, onBack, onToggleInfo,
  messageSearchQuery, setMessageSearchQuery,
}) {
  const [replyTo, setReplyTo] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const scrollRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, conversation?.id]);

  // Clear reply/edit when switching conversations
  useEffect(() => {
    setReplyTo(null);
    setEditTarget(null);
    setShowSearch(false);
  }, [conversation?.id]);

  const isGroup = conversation?.type === "group";
  const otherUser = !isGroup ? conversation?.otherParticipants?.[0] : null;
  const displayName = isGroup ? conversation?.title : otherUser?.user_name || "Unknown";
  const displayAvatar = isGroup ? conversation?.avatar_url : otherUser?.user_avatar;
  const isOnline = otherUser && onlineUserIds.has(otherUser.user_id);

  // Typing indicator
  const typingInConv = typingUsers[conversation?.id] || {};
  const typingNames = Object.entries(typingInConv)
    .filter(([uid, ts]) => uid !== currentUserId && Date.now() - new Date(ts).getTime() < 3000)
    .map(([uid]) => {
      const p = conversation?.participants?.find((part) => part.user_id === uid);
      return p?.user_name || "Someone";
    });

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups = [];
    let lastDate = null;
    messages.forEach((msg) => {
      const msgDate = msg.created_date?.split("T")[0];
      if (msgDate !== lastDate) {
        groups.push({ type: "separator", date: msg.created_date, id: `sep-${msgDate}` });
        lastDate = msgDate;
      }
      groups.push({ type: "message", data: msg, id: msg.id });
    });
    return groups;
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Phone className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-bold text-foreground">Your Messages</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Select a conversation to start messaging, or start a new chat with a community member.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-card">
        {onBack && (
          <button onClick={onBack} className="p-1.5 text-muted-foreground hover:text-foreground lg:hidden">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="relative shrink-0">
          {displayAvatar ? (
            <img src={displayAvatar} alt={displayName} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold">
              {isGroup ? <Users className="w-4 h-4" /> : (displayName[0] || "?").toUpperCase()}
            </div>
          )}
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-card" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-foreground truncate">{displayName}</h2>
          <p className="text-xs text-muted-foreground truncate">
            {typingNames.length > 0
              ? <span className="text-primary">{typingNames.join(", ")} typing...</span>
              : isGroup
                ? `${conversation.participants.length} members`
                : isOnline ? "Online" : "Offline"}
          </p>
        </div>
        <button onClick={() => setShowSearch(!showSearch)} className="p-2 text-muted-foreground hover:text-foreground">
          <Search className="w-5 h-5" />
        </button>
        <button onClick={onToggleInfo} className="p-2 text-muted-foreground hover:text-foreground">
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* Message search bar */}
      {showSearch && (
        <div className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={messageSearchQuery}
            onChange={(e) => setMessageSearchQuery(e.target.value)}
            placeholder="Search in conversation..."
            autoFocus
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button onClick={() => { setShowSearch(false); setMessageSearchQuery(""); }} className="p-1 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-1">
        {messagesLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : groupedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">Send the first message!</p>
          </div>
        ) : (
          groupedMessages.map((item) =>
            item.type === "separator" ? (
              <DateSeparator key={item.id} date={item.date} />
            ) : (
              <MistMessageBubble
                key={item.id}
                message={item.data}
                isMe={item.data.sender_id === currentUserId}
                isGroup={isGroup}
                senderName={item.data.sender_name}
                senderAvatar={item.data.sender_avatar}
                onReply={(msg) => { setReplyTo(msg); setEditTarget(null); }}
                onEdit={(msg) => { setEditTarget(msg); setReplyTo(null); }}
                onDelete={onDelete}
              />
            )
          )
        )}
      </div>

      {/* Composer */}
      <MistChatComposer
        onSend={(text, img, file, reply) => {
          onSend(text, img, file, reply);
          setReplyTo(null);
        }}
        onTyping={onTyping}
        replyTo={replyTo}
        editTarget={editTarget}
        onCancelReply={() => setReplyTo(null)}
        onCancelEdit={() => setEditTarget(null)}
        onEditSave={(id, content) => {
          onEdit(id, content);
          setEditTarget(null);
        }}
      />
    </div>
  );
}