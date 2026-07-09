import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Image as ImageIcon, Smile, X, Reply } from "lucide-react";
import ChatEmojiPicker from "./ChatEmojiPicker";

export default function ChatComposer({ onSend, onTyping, replyTo, onCancelReply }) {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  const adjustHeight = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  useEffect(adjustHeight, [text]);

  const handleSend = async () => {
    if ((!text.trim() && !imageFile) || sending) return;
    setSending(true);
    const t = text;
    const f = imageFile;
    setText("");
    setImageFile(null);
    setShowEmoji(false);
    await onSend(t, f);
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiPick = (emoji) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const hasContent = text.trim() || imageFile;

  return (
    <div className="shrink-0 bg-card border-t border-border">
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 border-b border-violet-500/20">
              <Reply className="w-4 h-4 text-violet-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-violet-400">{replyTo.sender_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {replyTo.content || (replyTo.image_url ? "📷 Photo" : "")}
                </p>
              </div>
              <button onClick={onCancelReply} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <ChatEmojiPicker onPick={handleEmojiPick} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {imageFile && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-2">
              <img src={URL.createObjectURL(imageFile)} alt="preview" className="h-14 w-14 rounded-lg object-cover" />
              <button onClick={() => setImageFile(null)} className="text-xs text-red-400">Remove</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2 px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <button
          onClick={() => fileRef.current?.click()}
          className="p-2.5 rounded-full text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10 transition-colors shrink-0"
        >
          <ImageIcon className="w-5 h-5" />
        </button>
        <input type="file" accept="image/*" ref={fileRef} className="hidden"
          onChange={(e) => setImageFile(e.target.files[0] || null)} />

        <div className="flex-1 flex items-end gap-1 bg-secondary rounded-3xl border border-border focus-within:border-violet-500/50 transition-colors">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className={`p-2.5 transition-colors shrink-0 ${showEmoji ? "text-violet-400" : "text-muted-foreground hover:text-violet-400"}`}
          >
            <Smile className="w-5 h-5" />
          </button>
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => { setText(e.target.value); onTyping(); }}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            className="flex-1 resize-none bg-transparent py-2.5 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none max-h-28"
            style={{ overflowY: "hidden" }}
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.85 }}
          animate={{ scale: hasContent ? 1 : 0.85 }}
          onClick={handleSend}
          disabled={sending || !hasContent}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 disabled:opacity-30 flex items-center justify-center shrink-0 shadow-lg shadow-violet-900/30"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </motion.button>
      </div>
    </div>
  );
}