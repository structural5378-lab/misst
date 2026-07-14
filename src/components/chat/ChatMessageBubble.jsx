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
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2 my-1`}>
      {!isMe && (
        <div className="w-9 shrink-0">
          {showSender && <ChatAvatar src={msg.sender_avatar} name={msg.sender_name} size="w-9 h-9" />}
        </div>
      )}
      <div className={`max-w-[80%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        {showSender && !isMe && (
          <span className="text-xs font-medium text-primary mb-0.5 ml-1">{msg.sender_name}</span>
        )}
        <div
          onTouchStart={startPress}
          onTouchEnd={() => clearTimeout(pressTimerRef.current)}
          onTouchMove={cancelPress}
          onContextMenu={(e) => { e.preventDefault(); onLongPress(msg); }}
          className={`px-4 py-2.5 text-[15px] leading-[1.5] select-none ${
            isMe
              ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
              : "bg-card border border-border text-foreground rounded-2xl rounded-bl-md"
          } ${msg._status === "failed" ? "border-destructive/50" : ""}`}
        >
          {msg.reply_to_id && (
            <div className={`border-l-2 pl-2 mb-1.5 text-xs ${isMe ? "border-primary-foreground/40" : "border-primary"}`}>
              <p className={`font-semibold ${isMe ? "text-primary-foreground/80" : "text-primary"}`}>{msg.reply_to_name}</p>
              <p className={`truncate ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                {msg.reply_to_content || (msg.reply_to_image ? "📷 Photo" : "")}
              </p>
            </div>
          )}
          {msg.image_url && (
            <img
              src={msg.image_url}
              alt="shared"
              loading="lazy"
              decoding="async"
              className="rounded-xl max-w-full mb-1.5 max-h-64 object-cover"
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
                className={`px-2 py-1 rounded-full text-sm flex items-center gap-1 border active:scale-110 transition-transform ${
                  isMe ? "bg-primary/20 border-primary/30" : "bg-secondary border-border"
                }`}
              >
                <span>{emoji}</span>
                <span className="text-muted-foreground">{uids.length}</span>
              </button>
            ))}
          </div>
        )}

        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMe ? "flex-row-reverse" : ""}`}>
          <span className="text-[11px] text-muted-foreground">{formatTime(msg.created_date)}</span>
          {isMe && msg._status && (
            <span className="text-muted-foreground">
              {msg._status === "sending" && <Clock className="w-3.5 h-3.5" />}
              {msg._status === "sent" && <Check className="w-3.5 h-3.5" />}
              {msg._status === "failed" && <AlertCircle className="w-3.5 h-3.5 text-destructive" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});