import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Reply, Copy, Trash2 } from "lucide-react";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "🎉"];

export default function ChatMessageActions({ msg, myUid, onClose, onReply, onReact, onDelete }) {
  const isOwn = msg && String(msg.sender_uid) === myUid;

  const handleCopy = () => {
    if (msg?.content) navigator.clipboard?.writeText(msg.content).catch(() => {});
    onClose();
  };

  return (
    <AnimatePresence>
      {msg && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border pb-[env(safe-area-inset-bottom)]"
          >
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="flex justify-around px-4 py-3 border-b border-border">
              {REACTIONS.map((emoji) => (
                <motion.button
                  key={emoji}
                  whileTap={{ scale: 1.3 }}
                  onClick={() => onReact(msg, emoji)}
                  className="text-3xl p-1"
                >
                  {emoji}
                </motion.button>
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}