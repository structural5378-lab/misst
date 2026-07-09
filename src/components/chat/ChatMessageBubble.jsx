import React, { useRef } from "react";
import { Check, AlertCircle, Clock } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import ChatAvatar from "./ChatAvatar";

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday " + format(d, "h:mm a");
  return format(d, "MMM d, h:mm a");
}

function parseReactions(str) {
  if (!str) return {};
  try { return JSON.parse(str); } catch { return {}; }
}

export default React.memo(function ChatMessageBubble({ msg, isMe, showSender, onLongPress, onReaction }) {
  const pressTimerRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const reactions = parseReactions(msg.reactions);
  const hasReactions = Object.keys(reactions).length > 0;

  const startPress = (e) => {
    const touch = e.touches?.[0];
    startPosRef.current = touch
      ? { x: touch.clientX, y: touch.clientY }
      : { x: 0, y: 0 };
    pressTimerRef.current = setTimeout(() => {
      try { navigator.vibrate?.(15); } catch {}
      onLongPress(msg);
    }, 450);
  };

  const cancelPress = (e) => {
    const touch = e.touches?.[0];
    if (touch) {
      const dx = Math.abs(touch.clientX - startPosRef.current.x);
      const dy = Math.abs(touch.clientY - startPosRef.current.y);
      if (dx > 10 || dy > 10) {
        clearTimeout(pressTimerRef.current);
      }
    } else {
      clearTimeout(pressTimerRef.current);
    }
  };

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2 my-0.5`}>
      {!isMe && (
        <div className="w-7 shrink-0">
          {showSender && <ChatAvatar src={msg.sender_avatar} name={msg.sender_name} size="w-7 h-7" />}
        </div>
      )}
      <div className={`max-w-[78%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        {showSender && !isMe && (
          <span className="text-[11px] font-medium text-violet-400 mb-0.5 ml-1">{msg.sender_name}</span>
        )}
        <div
          onTouchStart={startPress}
          onTouchEnd={() => clearTimeout(pressTimerRef.current)}
          onTouchMove={cancelPress}
          onContextMenu={(e) => { e.preventDefault(); onLongPress(msg); }}
          className={`px-3.5 py-2 text-sm leading-relaxed select-none ${
            isMe
              ? "bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-2xl rounded-br-md"
              : "bg-card border border-border text-foreground rounded-2xl rounded-bl-md"
          } ${msg._status === "failed" ? "border-red-500/50" : ""}`}
        >
          {msg.reply_to_id && (
            <div className={`border-l-2 pl-2 mb-1.5 text-xs ${isMe ? "border-white/40" : "border-violet-400"}`}>
              <p className={`font-semibold ${isMe ? "text-white/80" : "text-violet-400"}`}>{msg.reply_to_name}</p>
              <p className={`truncate ${isMe ? "text-white/60" : "text-muted-foreground"}`}>
                {msg.reply_to_content || (msg.reply_to_image ? "📷 Photo" : "")}
              </p>
            </div>
          )}
          {msg.image_url && (
            <img
              src={msg.image_url}
              alt="shared"
              loading="lazy"
              className="rounded-xl max-w-full mb-1 max-h-60 object-cover"
            />
          )}
          {msg.content && <span className="break-words whitespace-pre-wrap">{msg.content}</span>}
        </div>

        {hasReactions && (
          <div className={`flex gap-1 flex-wrap mt-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
            {Object.entries(reactions).map(([emoji, uids]) => (
              <button
                key={emoji}
                onClick={() => onReaction(msg.id, emoji)}
                className={`px-1.5 py-0.5 rounded-full text-xs flex items-center gap-0.5 border active:scale-110 transition-transform ${
                  isMe ? "bg-violet-500/20 border-violet-400/30" : "bg-secondary border-border"
                }`}
              >
                <span>{emoji}</span>
                <span className="text-muted-foreground">{uids.length}</span>
              </button>
            ))}
          </div>
        )}

        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMe ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] text-muted-foreground">{formatTime(msg.created_date)}</span>
          {isMe && msg._status && (
            <span className="text-muted-foreground">
              {msg._status === "sending" && <Clock className="w-3 h-3" />}
              {msg._status === "sent" && <Check className="w-3 h-3" />}
              {msg._status === "failed" && <AlertCircle className="w-3 h-3 text-red-400" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});