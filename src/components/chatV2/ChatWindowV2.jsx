import { useEffect, useMemo, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { useChatV2 } from "@/hooks/useChatV2";
import { otherParticipant } from "@/lib/chatV2/chatV2Api";
import { formatDayLabel, isSameDay, isTypingNow, presenceStatus } from "@/lib/chatV2/chatV2Utils";
import MessageBubbleV2 from "./MessageBubbleV2";
import MessageComposerV2 from "./MessageComposerV2";
import TypingIndicatorV2 from "./TypingIndicatorV2";
import PresenceDotV2 from "./PresenceDotV2";
import ConnectionBannerV2 from "./ConnectionBannerV2";

// ChatWindowV2 — the message stream for one conversation. Handles auto-scroll
// (only when the user is at the bottom), older-message pagination that
// preserves scroll position, typing indicators, and read-receipt syncing.
function Avatar({ name, avatar }) {
  if (avatar) return <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />;
  const initials = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-secondary-foreground">{initials}</div>;
}

export default function ChatWindowV2({ conversationId, conversation, user, presenceByUser, setTyping, setActiveConversation, online, reconnecting, onBack }) {
  const {
    messages, loading, loadingMore, hasMore, atBottom, setAtBottom,
    loadMore, send, retry, markRead, editMessage, deleteMessage, scrollRef,
  } = useChatV2({ conversationId, user });

  const other = conversation ? otherParticipant(conversation, user.id) : null;
  const name = conversation?.is_group ? (conversation?.name || "Group") : (other?.name || "Unknown");
  const presence = conversation && !conversation.is_group ? presenceByUser[other?.id] : null;
  const typingNames = useMemo(() => {
    if (!conversation) return [];
    return Object.values(presenceByUser)
      .filter((p) => p.user_id !== user.id && isTypingNow(p, conversationId))
      .map((p) => p.user_name || "Someone");
  }, [presenceByUser, conversationId, conversation, user.id]);

  // Mark active conversation + clear on unmount (suppresses push while viewing).
  useEffect(() => {
    setActiveConversation(conversationId);
    return () => setActiveConversation("");
  }, [conversationId, setActiveConversation]);

  // Mark read on open.
  useEffect(() => { if (conversationId) markRead(); /* eslint-disable-next-line */ }, [conversationId]);

  // Auto-scroll to bottom when new messages arrive IF the user is at the bottom.
  const lastLenRef = useRef(0);
  useEffect(() => {
    if (!scrollRef.current) return;
    if (atBottom && messages.length > lastLenRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    lastLenRef.current = messages.length;
    // If the newest message is from someone else and we're at the bottom, mark read.
    if (atBottom && messages.length) {
      const last = messages[messages.length - 1];
      if (last.sender_id !== user.id) markRead();
    }
  }, [messages, atBottom, markRead, user.id]);

  const onScroll = (e) => {
    const el = e.currentTarget;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setAtBottom(bottom);
    if (el.scrollTop < 80 && hasMore && !loadingMore) loadMore();
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col h-full min-w-0 flex-1 bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
        {onBack && (
          <button onClick={onBack} className="md:hidden p-1.5 -ml-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="relative shrink-0">
          <Avatar name={name} avatar={conversation?.is_group ? conversation.avatar_url : other?.avatar} />
          {!conversation?.is_group && (
            <span className="absolute -bottom-0.5 -right-0.5"><PresenceDotV2 presence={presence} /></span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-sm text-foreground truncate">{name}</h2>
          {typingNames.length ? (
            <p className="text-[11px] text-primary truncate">{typingNames.length === 1 ? `${typingNames[0]} is typing…` : "multiple people typing…"}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground truncate capitalize">{conversation?.is_group ? "group chat" : (presenceStatus(presence))}</p>
          )}
        </div>
      </div>

      <ConnectionBannerV2 online={online} reconnecting={reconnecting} />

      {/* Messages */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto py-3">
        {loadingMore && (
          <div className="flex justify-center py-2"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        )}
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-center px-6">
            <p className="text-sm text-muted-foreground">No messages yet. Say hello 👋</p>
          </div>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const showDay = !prev || !isSameDay(prev.created_date, m.created_date);
          const showAvatar = !prev || prev.sender_id !== m.sender_id || showDay;
          return (
            <div key={m.id || m.client_temp_id}>
              {showDay && (
                <div className="flex justify-center my-3">
                  <span className="text-[11px] font-medium text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">{formatDayLabel(m.created_date)}</span>
                </div>
              )}
              <MessageBubbleV2
                message={m}
                isMine={m.sender_id === user.id}
                showAvatar={showAvatar}
                onRetry={retry}
                onEdit={editMessage}
                onDelete={deleteMessage}
              />
            </div>
          );
        })}
        {!atBottom && (
          <div className="sticky bottom-2 flex justify-center pointer-events-none">
            <span className="pointer-events-auto text-[11px] bg-secondary text-secondary-foreground px-3 py-1 rounded-full shadow">New messages ↓</span>
          </div>
        )}
      </div>

      {typingNames.length > 0 && (
        <TypingIndicatorV2 names={typingNames} />
      )}

      <MessageComposerV2
        onSend={(body) => send(body)}
        onTyping={(v) => setTyping(conversationId, v)}
        disabled={!conversationId}
      />
    </div>
  );
}