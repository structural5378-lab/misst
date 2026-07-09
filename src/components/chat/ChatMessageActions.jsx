import React, { useEffect } from "react";
import { Reply, Copy, Trash2 } from "lucide-react";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "🎉"];

export default function ChatMessageActions({ msg, myUid, onClose, onReply, onReact, onDelete }) {
  const isOwn = msg && String(msg.sender_uid) === myUid;

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (msg) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [msg]);

  if (!msg) return null;

  const handleCopy = () => {
    if (msg?.content) navigator.clipboard?.writeText(msg.content).catch(() => {});
    onClose();
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-[60] fade-in"
        style={{ touchAction: "none" }}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] bg-card rounded-t-3xl border-t border-border pb-[env(safe-area-inset-bottom)] sheet-up"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="flex justify-around px-4 py-3 border-b border-border">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReact(msg, emoji)}
              className="text-3xl p-1 active:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="py-2">
          <button
            onClick={() => onReply(msg)}
            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-secondary transition-colors"
          >
            <Reply className="w-5 h-5 text-violet-400" />
            <span className="text-sm text-foreground">Reply</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-secondary transition-colors"
          >
            <Copy className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-foreground">Copy</span>
          </button>
          {isOwn && (
            <button
              onClick={() => onDelete(msg)}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-5 h-5 text-red-400" />
              <span className="text-sm text-red-400">Delete</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}