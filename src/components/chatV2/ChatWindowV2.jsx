import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, CheckCheck, Flag, PanelRight } from "lucide-react";
import { mist } from '@/api/mist';
import { useChatV2 } from "@/hooks/useChatV2";
import { otherParticipant } from "@/lib/chatV2/chatV2Api";
import { formatDayLabel, isSameDay, isTypingNow } from "@/lib/chatV2/chatV2Utils";
import { scrollToBottom } from "@/lib/chatV2/scrollToBottom";
import ChatHeaderV2 from "./ChatHeaderV2";
import MessageBubbleV2 from "./MessageBubbleV2";
import MessageComposerV2 from "./MessageComposerV2";
import TypingIndicatorV2 from "./TypingIndicatorV2";
import ConnectionBannerV2 from "./ConnectionBannerV2";
import ChatV2EmptyState from "./ChatV2EmptyState";

// ChatWindowV2 — the message stream for one conversation. Wires the realtime
// hook to the redesigned header/bubble/composer, and owns reply state,
// scroll-to-message, jump-to-newest, in-chat search, and the more menu.
export default function ChatWindowV2({
  conversationId, conversation, participant, user, presenceByUser,
  setTyping, setActiveConversation, online, reconnecting, onBack, onToggleMute, onOpenInfo, forceBack,
}) {
  const {
    messages, loading, loadingMore, hasMore, atBottom, setAtBottom,
    loadMore, send, retry, markRead, editMessage, deleteMessage, react, scrollRef,
  } = useChatV2({ conversationId, user });

  const [replyTo, setReplyTo] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const bottomRef = useRef(null);
  const initialScrollDoneRef = useRef(false);
  const atBottomRef = useRef(true);

  const other = conversation ? otherParticipant(conversation, user.id) : null;
  const name = conversation?.is_group ? (conversation?.name || "Group") : (other?.name || "Unknown");
  const presence = conversation && !conversation.is_group ? presenceByUser[other?.id] : null;
  const typingNames = useMemo(() => {
    if (!conversation) return [];
    return Object.values(presenceByUser)
      .filter((p) => p.user_id !== user.id && isTypingNow(p, conversationId))
      .map((p) => p.user_name || "Someone");
  }, [presenceByUser, conversationId, conversation, user.id]);
  const typingText = typingNames.length
    ? (typingNames.length === 1 ? `${typingNames[0]} is typing…` : "multiple typing…")
    : "";

  // Active conversation (push suppression) + clear on unmount.
  useEffect(() => {
    setActiveConversation(conversationId);
    return () => setActiveConversation("");
  }, [conversationId, setActiveConversation]);

  // Mark read on open.
  useEffect(() => { if (conversationId) markRead(); /* eslint-disable-next-line */ }, [conversationId]);

  // Auto-scroll + mark read when at bottom and new incoming message arrives.
  const lastLenRef = useRef(0);
  useEffect(() => {
    if (!scrollRef.current) return;
    if (atBottom && messages.length > lastLenRef.current) {
      scrollToBottom(scrollRef.current);
    }
    lastLenRef.current = messages.length;
    if (atBottom && messages.length) {
      const last = messages[messages.length - 1];
      if (last.sender_id !== user.id) markRead();
    }
  }, [messages, atBottom, markRead, user.id]);

  // Force scroll to bottom on conversation open. Pin to the bottom, then keep
  // pinning every animation frame until the content height stops changing.
  // This catches every async layout shift (images, markdown, flex/dvh height
  // settling) that a fixed-timeout approach can miss. loadMore is gated until
  // the loop ends so infinite-scroll can't yank the view away from the bottom.
  useLayoutEffect(() => {
    if (loading) return;
    initialScrollDoneRef.current = false;
    atBottomRef.current = true;
    setAtBottom(true);
    const el = scrollRef.current;
    if (!el) return;
    scrollToBottom(el);
    let lastH = el.scrollHeight;
    let raf;
    const tick = () => {
      if (atBottomRef.current && el.scrollHeight !== lastH) {
        lastH = el.scrollHeight;
        scrollToBottom(el);
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    const t = setTimeout(() => { initialScrollDoneRef.current = true; cancelAnimationFrame(raf); }, 1500);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [conversationId, loading, setAtBottom]);

  const onScroll = (e) => {
    const el = e.currentTarget;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    atBottomRef.current = bottom;
    setAtBottom(bottom);
    if (initialScrollDoneRef.current && el.scrollTop < 80 && hasMore && !loadingMore) loadMore();
  };

  const scrollToMessage = (id) => {
    if (!id || !scrollRef.current) return;
    const node = scrollRef.current.querySelector(`[data-msg-id="${id}"]`);
    if (!node) return;
    node.scrollIntoView({ block: "center", behavior: "smooth" });
    setHighlightId(id);
    setTimeout(() => setHighlightId(null), 1800);
  };

  const jumpToNewest = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    setAtBottom(true);
  };

  const doSearch = (e) => {
    e.preventDefault();
    const q = searchQ.toLowerCase().trim();
    if (!q) return;
    const found = messages.find((m) => (m.body || "").toLowerCase().includes(q) && m.id);
    if (found) scrollToMessage(found.id);
  };

  const handleSend = async (body, attachment) => {
    let attachmentMeta = null;
    if (attachment?.file) {
      try {
        const res = await mist.integrations.Core.UploadFile({ file: attachment.file });
        attachmentMeta = { url: res.file_url, name: attachment.name, type: attachment.type, size: attachment.size };
      } catch (e) {
        console.error("[chat] attachment upload failed", e);
        throw e; // composer keeps the text + attachment so the user can retry
      }
    }
    send(body, {
      replyTo: replyTo?.id && !replyTo.id.startsWith("tmp_") ? replyTo.id : "",
      replyToPreview: (replyTo?.body || "").slice(0, 120),
      attachment: attachmentMeta,
    });
    setReplyTo(null);
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col h-full min-w-0 flex-1 bg-background">
      <ChatHeaderV2
        name={name}
        avatar={conversation?.is_group ? conversation.avatar_url : other?.avatar}
        isGroup={conversation?.is_group}
        presence={presence}
        typingText={typingText}
        muted={!!participant?.muted}
        onBack={onBack}
        onToggleMute={onToggleMute}
        onSearch={() => setShowSearch((v) => !v)}
        onMore={() => setMoreOpen((v) => !v)}
        forceBack={forceBack}
      />

      {moreOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)}>
          <div
            className="sheet-fade absolute top-14 right-3 w-44 rounded-xl border border-border bg-popover shadow-xl py-1"
            onClick={(e) => e.stopPropagation()}
          >
            {onOpenInfo && (
              <button onClick={() => { onOpenInfo(); setMoreOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-muted/60">
                <PanelRight className="w-4 h-4" /> Conversation info
              </button>
            )}
            <button onClick={() => { markRead(); setMoreOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-muted/60">
              <CheckCheck className="w-4 h-4" /> Mark as read
            </button>
            <button onClick={() => { onToggleMute?.(); setMoreOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-muted/60">
              <Flag className="w-4 h-4" /> {participant?.muted ? "Unmute" : "Mute"}
            </button>
          </div>
        </div>
      )}

      {showSearch && (
        <form onSubmit={doSearch} className="px-3 py-2 border-b border-border bg-background/60">
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search in this conversation…"
            autoFocus
            className="w-full rounded-xl bg-secondary/50 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </form>
      )}

      <ConnectionBannerV2 online={online} reconnecting={reconnecting} />

      {/* Messages */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto py-3 relative">
        {loadingMore && (
          <div className="flex justify-center py-2"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        )}
        {messages.length === 0 ? (
          <ChatV2EmptyState variant="no-messages" />
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1];
            const showDay = !prev || !isSameDay(prev.created_date, m.created_date);
            const showAvatar = !prev || prev.sender_id !== m.sender_id || showDay;
            return (
              <div key={m.id || m.client_temp_id} className={highlightId === (m.id || m.client_temp_id) ? "msg-highlight rounded-lg" : ""}>
                {showDay && (
                  <div className="flex justify-center my-3">
                    <span className="text-[11px] font-medium text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">{formatDayLabel(m.created_date)}</span>
                  </div>
                )}
                <MessageBubbleV2
                  message={m}
                  isMine={m.sender_id === user.id}
                  myId={user.id}
                  showAvatar={showAvatar}
                  onRetry={retry}
                  onEdit={editMessage}
                  onDelete={deleteMessage}
                  onReact={react}
                  onReply={setReplyTo}
                  onReplyJump={scrollToMessage}
                />
              </div>
            );
          })
        )}
        {/* Jump to newest */}
        {!atBottom && (
          <button
            onClick={jumpToNewest}
            className="sticky bottom-3 left-full ml-auto mr-3 flex items-center gap-1.5 text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full shadow-lg hover:bg-secondary/80 transition-colors"
            aria-label="Jump to newest"
          >
            <ArrowDown className="w-3.5 h-3.5" /> Latest
          </button>
        )}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {typingNames.length > 0 && <TypingIndicatorV2 names={typingNames} />}

      <MessageComposerV2
        onSend={handleSend}
        onTyping={(v) => setTyping(conversationId, v)}
        disabled={!conversationId}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}