import { useEffect, useRef, useState } from "react";
import { Send, Smile, Paperclip, Mic } from "lucide-react";
import EmojiPickerV2 from "./EmojiPickerV2";
import ReplyPreviewBarV2 from "./ReplyPreviewBarV2";

const MAX = 2000;

// MessageComposerV2 — auto-growing input with emoji picker, attachment/voice
// placeholders, character counter, send animation, and a reply preview bar.
export default function MessageComposerV2({ onSend, onTyping, disabled, placeholder = "Type a message…", replyTo, onCancelReply }) {
  const [value, setValue] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const taRef = useRef(null);
  const typingTimer = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [value]);

  useEffect(() => { if (replyTo) taRef.current?.focus(); }, [replyTo]);

  const setTyping = (v) => {
    if (isTypingRef.current === v) return;
    isTypingRef.current = v;
    onTyping?.(v);
  };

  const handleChange = (e) => {
    const v = e.target.value.slice(0, MAX);
    setValue(v);
    if (v.trim()) {
      setTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 1800);
    } else {
      setTyping(false);
      clearTimeout(typingTimer.current);
    }
  };

  const submit = () => {
    if (disabled || !value.trim()) return;
    setSending(true);
    onSend?.(value.trim());
    setValue("");
    setTyping(false);
    clearTimeout(typingTimer.current);
    setTimeout(() => setSending(false), 250);
    requestAnimationFrame(() => taRef.current?.focus());
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const insertEmoji = (emoji) => {
    setValue((v) => (v + emoji).slice(0, MAX));
    taRef.current?.focus();
  };

  useEffect(() => () => clearTimeout(typingTimer.current), []);

  const overHalf = value.length > MAX * 0.6;
  const nearLimit = value.length > MAX * 0.9;

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur relative pb-[max(env(safe-area-inset-bottom),8px)] xl:pb-0">
      <ReplyPreviewBarV2 replyTo={replyTo} onCancel={onCancelReply} />
      <div className="px-3 py-2.5 flex items-end gap-1.5 max-w-4xl mx-auto">
        <div className="relative">
          <button
            onClick={() => setShowEmoji((v) => !v)}
            className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Emoji"
          >
            <Smile className="w-5 h-5" />
          </button>
          {showEmoji && <EmojiPickerV2 onPick={insertEmoji} onClose={() => setShowEmoji(false)} />}
        </div>
        <button
          className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Attachments coming soon"
          aria-label="Attach file"
          onClick={() => {}}
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <textarea
          ref={taRef}
          value={value}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          aria-label="Message"
          className="flex-1 resize-none rounded-2xl bg-secondary/60 border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring max-h-40"
        />
        <button
          className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Voice messages coming soon"
          aria-label="Voice message"
          onClick={() => {}}
        >
          <Mic className="w-5 h-5" />
        </button>
        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          className={`mist-send w-11 h-11 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 ${sending ? "send-pop" : ""}`}
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      {overHalf && (
        <div className={`text-[10px] text-right pr-4 pb-1 ${nearLimit ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
          {value.length}/{MAX}
        </div>
      )}
    </div>
  );
}