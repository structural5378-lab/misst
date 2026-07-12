import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import ChatMessageBubble from "./ChatMessageBubble";
import ChatDateSeparator from "./ChatDateSeparator";
import ChatTypingBubble from "./ChatTypingBubble";

function shouldShowDate(prev, curr) {
  if (!prev) return true;
  return new Date(prev.created_date).toDateString() !== new Date(curr.created_date).toDateString();
}

function shouldShowSender(prev, curr) {
  if (!prev) return true;
  if (prev.sender_uid !== curr.sender_uid) return true;
  return new Date(curr.created_date) - new Date(prev.created_date) > 5 * 60 * 1000;
}

export default function ChatMessageList({ messages, myUid, typingUsers, onLongPress, onReaction, lastSeenTs }) {
  const scrollRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const initialScrollDoneRef = useRef(false);
  const prevCountRef = useRef(0);
  const lastMsgRef = useRef(null);
  const scrollRafRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Debounced scroll handler — uses requestAnimationFrame to avoid excessive state updates
  const handleScroll = useCallback(() => {
    if (scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = scrollRef.current;
      if (!el) return;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      isNearBottomRef.current = nearBottom;
      setShowScrollBtn(!nearBottom && messages.length > 6);
      if (nearBottom) setNewMessageCount(0);
    });
  }, [messages.length]);

  // Track last message in a ref (avoids putting `messages` in scroll effect deps)
  useEffect(() => {
    lastMsgRef.current = messages[messages.length - 1] || null;
  }, [messages]);

  // Initial scroll to bottom — opens at the newest message
  useEffect(() => {
    if (!initialScrollDoneRef.current && messages.length > 0) {
      initialScrollDoneRef.current = true;
      prevCountRef.current = messages.length;
      requestAnimationFrame(() => scrollToBottom(false));
    }
  }, [messages.length, scrollToBottom]);

  // New message scroll behavior
  useEffect(() => {
    if (!initialScrollDoneRef.current) return;
    if (messages.length <= prevCountRef.current) {
      prevCountRef.current = messages.length;
      return;
    }
    const newCount = messages.length - prevCountRef.current;
    prevCountRef.current = messages.length;
    const lastMsg = lastMsgRef.current;
    const isMyMessage = String(lastMsg?.sender_uid || "") === myUid;

    if (isMyMessage) {
      // Always smooth-scroll to bottom when I send a message
      setNewMessageCount(0);
      setShowScrollBtn(false);
      requestAnimationFrame(() => scrollToBottom(true));
    } else if (isNearBottomRef.current) {
      // Auto-scroll to bottom when receiving and already near bottom
      setNewMessageCount(0);
      requestAnimationFrame(() => scrollToBottom(true));
    } else {
      // User scrolled up — don't force them down, show "New" button with count
      setNewMessageCount((prev) => prev + newCount);
    }
  }, [messages.length, myUid, scrollToBottom]);

  // Handle viewport resize (keyboard open/close, orientation change)
  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(() => {
        if (isNearBottomRef.current) {
          scrollToBottom(false);
        }
      });
    };
    window.visualViewport?.addEventListener("resize", handleResize);
    window.addEventListener("resize", handleResize);
    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.removeEventListener("resize", handleResize);
    };
  }, [scrollToBottom]);

  // Cleanup pending RAF on unmount
  useEffect(() => {
    return () => {
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    };
  }, []);

  // Compute render metadata without spreading messages (preserves reference equality for React.memo)
  const renderItems = useMemo(() => {
    let unreadShown = false;
    return messages.map((msg, i) => {
      const prev = messages[i - 1];
      const isMe = String(msg.sender_uid) === myUid;
      const showDate = shouldShowDate(prev, msg);
      const showSender = shouldShowSender(prev, msg);
      const showUnread = !unreadShown && lastSeenTs &&
        new Date(msg.created_date) > new Date(lastSeenTs) && !isMe;
      if (showUnread) unreadShown = true;
      return { msg, isMe, showDate, showSender, showUnread };
    });
  }, [messages, myUid, lastSeenTs]);

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto overscroll-contain px-3 py-4 scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {renderItems.map(({ msg, isMe, showDate, showSender, showUnread }) => (
          <div key={msg.id}>
            {showDate && <ChatDateSeparator date={msg.created_date} />}
            {showUnread && (
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-violet-500/30" />
                <span className="text-[11px] text-violet-400 font-semibold px-2">New Messages</span>
                <div className="flex-1 h-px bg-violet-500/30" />
              </div>
            )}
            <ChatMessageBubble
              msg={msg}
              isMe={isMe}
              showSender={showSender}
              onLongPress={onLongPress}
              onReaction={onReaction}
            />
          </div>
        ))}
        {typingUsers.length > 0 && (
          <ChatTypingBubble
            name={typingUsers[0].user_name}
            avatar={typingUsers[0].user_avatar}
          />
        )}
        <div className="h-2" />
      </div>

      {showScrollBtn && (
        <button
          onClick={() => {
            setNewMessageCount(0);
            setShowScrollBtn(false);
            scrollToBottom(true);
          }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-violet-600 text-white shadow-lg shadow-violet-900/40 z-10 fade-in active:scale-95 transition-transform"
        >
          {newMessageCount > 0 && (
            <span className="text-xs font-bold bg-white/25 rounded-full px-1.5 min-w-[20px] h-5 flex items-center justify-center">
              {newMessageCount}
            </span>
          )}
          <span className="text-xs font-semibold">New</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}