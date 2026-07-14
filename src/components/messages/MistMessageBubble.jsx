import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Reply, Edit2, Trash2, Copy, MoreVertical, FileText, Download, X } from "lucide-react";

function formatTime(dateStr) {
  if (!dateStr) return "";
  return format(new Date(dateStr), "h:mm a");
}

function Avatar({ name, url, size = "w-8 h-8" }) {
  if (url) return <img src={url} alt={name} className={`${size} rounded-full object-cover`} />;
  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold`}>
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

export default function MistMessageBubble({
  message, isMe, isGroup, senderName, senderAvatar, onReply, onEdit, onDelete,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [showMenu]);

  const handleCopy = () => {
    if (message.content) navigator.clipboard.writeText(message.content);
    setShowMenu(false);
  };

  if (message.is_deleted) {
    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"} px-1`}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground italic py-1.5 px-3 rounded-xl bg-secondary/50">
          <Trash2 className="w-3 h-3" /> Message deleted
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} px-1 msg-in`}>
      <div className={`flex gap-2 max-w-[80%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar (group only, not for own messages) */}
        {isGroup && !isMe && <Avatar name={senderName} url={senderAvatar} />}

        <div className="group relative">
          {/* Reply preview */}
          {message.reply_to_id && (
            <div className={`mb-1 px-3 py-1.5 rounded-lg border-l-2 text-xs ${isMe ? "border-primary bg-primary/10" : "border-accent bg-accent/10"}`}>
              <p className="font-semibold text-foreground/70">{message.reply_to_sender_name}</p>
              <p className="text-muted-foreground truncate">{message.reply_to_content || "📷 Photo"}</p>
            </div>
          )}

          {/* Sender name (group only) */}
          {isGroup && !isMe && (
            <p className="text-xs font-semibold text-accent mb-0.5 px-1">{senderName}</p>
          )}

          {/* Message bubble */}
          <div
            className={`relative rounded-2xl px-3.5 py-2 ${
              isMe
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-secondary text-foreground rounded-bl-md"
            }`}
          >
            {/* Image */}
            {message.image_url && (
              <img
                src={message.image_url}
                alt="Shared"
                className="rounded-lg max-w-full max-h-60 mb-1 cursor-pointer"
                onClick={() => window.open(message.image_url, "_blank")}
              />
            )}

            {/* File */}
            {message.file_url && (
              <a
                href={message.file_url}
                download={message.file_name}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 p-2 rounded-lg mb-1 ${isMe ? "bg-primary-foreground/10" : "bg-background/50"}`}
              >
                <FileText className="w-8 h-8 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{message.file_name}</p>
                  {message.file_size > 0 && (
                    <p className="text-xs opacity-60">{(message.file_size / 1024).toFixed(1)} KB</p>
                  )}
                </div>
                <Download className="w-4 h-4 shrink-0" />
              </a>
            )}

            {/* Text */}
            {message.content && (
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            )}

            {/* Timestamp + edited */}
            <div className={`flex items-center gap-1 mt-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
              {message.edited_at && <span className="text-[10px] italic opacity-60">edited</span>}
              <span className="text-[10px] opacity-60">{formatTime(message.created_date)}</span>
              {isMe && message._status === "sending" && <span className="text-[10px] opacity-60">⋯</span>}
              {isMe && message._status === "failed" && <span className="text-[10px] text-destructive">!</span>}
            </div>
          </div>

          {/* Action menu trigger */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`absolute top-0 ${isMe ? "left-1" : "right-1"} -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-card border border-border shadow-sm`}
          >
            <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {/* Action menu */}
          {showMenu && (
            <div
              ref={menuRef}
              className={`absolute z-50 top-0 ${isMe ? "left-0" : "right-0"} -translate-y-full mt-1 bg-card border border-border rounded-xl shadow-xl py-1 min-w-[140px]`}
            >
              <button onClick={() => { onReply(message); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary text-left">
                <Reply className="w-4 h-4" /> Reply
              </button>
              {message.content && (
                <button onClick={handleCopy} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary text-left">
                  <Copy className="w-4 h-4" /> Copy
                </button>
              )}
              {isMe && message.content && (
                <button onClick={() => { onEdit(message); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary text-left">
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
              )}
              <button onClick={() => { onDelete(message.id); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 text-left">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}