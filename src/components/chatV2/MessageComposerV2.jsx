import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

// MessageComposerV2 — optimistic input. Emits typing start/stop (debounced) and
// sends on Enter (Shift+Enter for newline). Disabled state only when sending is
// impossible (no conversation); offline sends are queued, not blocked.
export default function MessageComposerV2({ onSend, onTyping, disabled, placeholder = "Type a message…" }) {
  const [value, setValue] = useState("");
  const taRef = useRef(null);
  const typingTimer = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [value]);

  const setTyping = (v) => {
    if (isTypingRef.current === v) return;
    isTypingRef.current = v;
    onTyping?.(v);
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    if (e.target.value.trim()) {
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
    onSend?.(value.trim());
    setValue("");
    setTyping(false);
    clearTimeout(typingTimer.current);
    requestAnimationFrame(() => taRef.current?.focus());
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  useEffect(() => () => clearTimeout(typingTimer.current), []);

  return (
    <div className="px-3 py-2.5 border-t border-border bg-background/80 backdrop-blur">
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        <textarea
          ref={taRef}
          value={value}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none rounded-2xl bg-secondary/60 border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring max-h-36"
        />
        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="w-11 h-11 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}