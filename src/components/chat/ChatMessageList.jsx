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
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const initialScrollDoneRef = useRef(false);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    isNearBottomRef.current = nearBottom;
    setShowScrollBtn(!nearBottom && messages.length > 6);
  }, [messages.length]);

  // Scroll to bottom on new messages (only when near bottom)
  useEffect(() => {
    if (!initialScrollDoneRef.current) return; // initial scroll handled separately
    if (isNearBottomRef.current) {
      requestAnimationFrame(() => scrollToBottom());
    }
  }, [messages.length, scrollToBottom]);

  // Initial scroll to bottom after first render (component mounts after loading is done)
  useEffect(() => {
    if (!initialScrollDoneRef.current && messages.length > 0) {
      initialScrollDoneRef.current = true;
      requestAnimationFrame(() => scrollToBottom());
    }
  }, [messages.length, scrollToBottom]);

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
        className="h-full overflow-y-auto overscroll-contain px-3 py-3 scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {renderItems.map(({ msg, isMe, showDate, showSender, showUnread }) => (
          <div key={msg.id}>
            {showDate && <ChatDateSeparator date={msg.created_date} />}
            {showUnread && (
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-violet-500/30" />
                <span className="text-[10px] text-violet-400 font-semibold px-2">New Messages</span>
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
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-violet-600 text-white shadow-lg shadow-violet-900/40 flex items-center justify-center z-10 fade-in"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}