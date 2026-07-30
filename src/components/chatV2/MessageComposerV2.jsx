import { useEffect, useRef, useState } from "react";
import { Send, Smile, Paperclip, Mic } from "lucide-react";
import EmojiPickerV2 from "./EmojiPickerV2";
import ReplyPreviewBarV2 from "./ReplyPreviewBarV2";

const MAX = 2000;

// MessageComposerV2 — premium, space-efficient composer. Left: emoji +
// attachment. Center: a single-line (growing) rounded input. Right: a voice
// button that crossfades into the send button when text exists. Sticky at the
// bottom; only the message list scrolls. Respects iPhone safe-area insets.
export default function MessageComposerV2({ onSend, onTyping, disabled, placeholder = "Message…", replyTo, onCancelReply, onFocus }) {
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
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [value]);

  useEffect(() => { if (replyTo) taRef.current?.focus(); }, [replyTo]);

  const setTyping = (v) => { if (isTypingRef.current === v) return; isTypingRef.current = v; onTyping?.(v); };
  const handleChange = (e) => {
    const v = e.target.value.slice(0, MAX);
    setValue(v);
    if (v.trim()) { setTyping(true); clearTimeout(typingTimer.current); typingTimer.current = setTimeout(() => setTyping(false), 1800); }
    else { setTyping(false); clearTimeout(typingTimer.current); }
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
  const onKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } };
  const insertEmoji = (emoji) => { setValue((v) => (v + emoji).slice(0, MAX)); taRef.current?.focus(); };
  useEffect(() => () => clearTimeout(typingTimer.current), []);

  const hasText = !!value.trim();
  const overHalf = value.length > MAX * 0.6;
  const nearLimit = value.length > MAX * 0.9;

  return (
    <div className="shrink-0 border-t border-border bg-background/80 backdrop-blur-xl">
      <ReplyPreviewBarV2 replyTo={replyTo} onCancel={onCancelReply} />
      <div className="px-2.5 py-2 mist-safe-bottom flex items-end gap-1.5">
        {/* Left: emoji + attachment */}
        <div className="flex items-center gap-0.5 shrink-0 mb-1">
          <div className="relative">
            <button onClick={() => setShowEmoji((v) => !v)} className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors" aria-label="Emoji"><Smile className="w-5 h-5" /></button>
            {showEmoji && <div className="absolute bottom-12 left-0 z-30"><EmojiPickerV2 onPick={insertEmoji} onClose={() => setShowEmoji(false)} /></div>}
          </div>
          <button className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors" aria-label="Attach file" title="Attachments coming soon" onClick={() => {}}><Paperclip className="w-5 h-5" /></button>
        </div>

        {/* Center: input (single line, grows) */}
        <textarea
          ref={taRef} value={value} onChange={handleChange} onKeyDown={onKeyDown} disabled={disabled}
          placeholder={placeholder} rows={1} aria-label="Message" onFocus={onFocus}
          className="flex-1 min-w-0 resize-none rounded-3xl bg-secondary/60 border border-border px-4 py-3 min-h-[48px] text-sm leading-5 max-h-36 focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/70"
        />

        {/* Right: voice → send (animated crossfade) */}
        <button
          onClick={hasText ? submit : undefined}
          disabled={disabled}
          aria-label={hasText ? "Send message" : "Voice message"}
          title={hasText ? "Send" : "Voice messages coming soon"}
          className={`relative shrink-0 w-11 h-11 mb-1 rounded-full flex items-center justify-center transition-all duration-200 ${hasText ? "mist-send bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground hover:bg-secondary"} ${sending ? "send-pop" : ""}`}
        >
          <Mic className={`absolute w-5 h-5 transition-all duration-200 ${hasText ? "opacity-0 scale-50 rotate-90" : "opacity-100 scale-100 rotate-0"}`} />
          <Send className={`absolute w-5 h-5 transition-all duration-200 ${hasText ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90"}`} />
        </button>
      </div>
      {overHalf && <div className={`text-[10px] text-right pr-4 pb-1 ${nearLimit ? "text-destructive font-semibold" : "text-muted-foreground"}`}>{value.length}/{MAX}</div>}
    </div>
  );
}