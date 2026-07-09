import React, { useRef, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    isNearBottomRef.current = nearBottom;
    setShowScrollBtn(!nearBottom && messages.length > 6);
  };

  const scrollToBottom = (smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    if (isNearBottomRef.current) scrollToBottom();
  }, [messages.length, typingUsers.length]);

  const grouped = useMemo(() => messages.map((msg, i) => {
    const prev = messages[i - 1];
    return {
      ...msg,
      isMe: String(msg.sender_uid) === myUid,
      showDate: shouldShowDate(prev, msg),
      showSender: shouldShowSender(prev, msg),
    };
  }), [messages, myUid]);

  let unreadDividerShown = false;

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto overscroll-contain px-3 py-3"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {grouped.map((msg) => {
          const showUnreadDivider = !unreadDividerShown && lastSeenTs &&
            new Date(msg.created_date) > new Date(lastSeenTs) && !msg.isMe;
          if (showUnreadDivider) unreadDividerShown = true;
          return (
            <div key={msg.id}>
              {msg.showDate && <ChatDateSeparator date={msg.created_date} />}
              {showUnreadDivider && (
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-violet-500/30" />
                  <span className="text-[10px] text-violet-400 font-semibold px-2">New Messages</span>
                  <div className="flex-1 h-px bg-violet-500/30" />
                </div>
              )}
              <ChatMessageBubble
                msg={msg}
                onLongPress={onLongPress}
                onReaction={onReaction}
              />
            </div>
          );
        })}
        {typingUsers.length > 0 && <ChatTypingBubble name={typingUsers[0].user_name} />}
        <div className="h-2" />
      </div>

      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-violet-600 text-white shadow-lg shadow-violet-900/40 flex items-center justify-center z-10"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}