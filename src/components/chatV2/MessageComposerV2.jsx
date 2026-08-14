import { useEffect, useRef, useState } from "react";
import { Send, Smile, Paperclip, Mic, X, Plus, Image as ImageIcon } from "lucide-react";
import EmojiPickerV2 from "./EmojiPickerV2";
import ReplyPreviewBarV2 from "./ReplyPreviewBarV2";

const MAX = 2000;

// MessageComposerV2 — premium, space-efficient composer. Left: emoji +
// attachment. Center: a single-line (growing) rounded input. Right: a voice
// button that crossfades into the send button when content exists.
//
// Attachment flow: the paperclip opens a native file picker; the selected file
// is held locally with a preview chip (removable); on send it is passed to
// `onSend(text, attachment)` where the parent uploads it via the existing
// UploadFile integration and includes it in the message payload. The composer
// itself does NOT upload — it only stages the file, so no upload is wasted if
// the user cancels or removes the attachment.
export default function MessageComposerV2({ onSend, onTyping, disabled, placeholder = "Message…", replyTo, onCancelReply, onFocus }) {
  const [value, setValue] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState(null); // { file, name, type, size, previewUrl }
  const taRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimer = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [value]);

  useEffect(() => { if (replyTo) taRef.current?.focus(); }, [replyTo]);

  // Revoke any object URL when the attachment changes or the composer unmounts.
  useEffect(() => {
    const url = attachment?.previewUrl;
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [attachment?.previewUrl]);

  const setTyping = (v) => { if (isTypingRef.current === v) return; isTypingRef.current = v; onTyping?.(v); };
  const handleChange = (e) => {
    const v = e.target.value.slice(0, MAX);
    setValue(v);
    if (v.trim()) { setTyping(true); clearTimeout(typingTimer.current); typingTimer.current = setTimeout(() => setTyping(false), 1800); }
    else { setTyping(false); clearTimeout(typingTimer.current); }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
      setAttachment({ file, name: file.name, type: file.type, size: file.size, previewUrl });
    }
    e.target.value = "";
  };
  const removeAttachment = () => {
    if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    setAttachment(null);
  };

  const submit = async () => {
    if (disabled || (!value.trim() && !attachment)) return;
    setSending(true);
    try {
      await onSend?.(value.trim(), attachment);
      setValue("");
      removeAttachment();
      setTyping(false);
      clearTimeout(typingTimer.current);
    } catch {
      // upload/send failed — keep text + attachment so the user can retry
    } finally {
      setSending(false);
      requestAnimationFrame(() => taRef.current?.focus());
    }
  };
  const onKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } };
  const insertEmoji = (emoji) => { setValue((v) => (v + emoji).slice(0, MAX)); taRef.current?.focus(); };
  useEffect(() => () => clearTimeout(typingTimer.current), []);

  const hasText = !!value.trim();
  const hasContent = hasText || !!attachment;
  const overHalf = value.length > MAX * 0.6;
  const nearLimit = value.length > MAX * 0.9;

  return (
    <div className="shrink-0 border-t border-border bg-background/80 backdrop-blur-xl">
      <ReplyPreviewBarV2 replyTo={replyTo} onCancel={onCancelReply} />
      {/* Attachment preview chip */}
      {attachment && (
        <div className="flex items-center gap-2 px-3 pt-2">
          <div className="flex items-center gap-2 bg-secondary/60 rounded-lg px-3 py-1.5 max-w-[260px]">
            {attachment.previewUrl ? (
              <img src={attachment.previewUrl} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
            ) : (
              <Paperclip className="w-4 h-4 text-primary shrink-0" />
            )}
            <p className="text-xs text-foreground truncate">{attachment.name}</p>
          </div>
          <button onClick={removeAttachment} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Remove attachment">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="px-2.5 py-2 mist-safe-bottom flex items-end gap-1.5">
        {/* Left: plus (attachments) + emoji */}
        <div className="flex items-center gap-0.5 shrink-0 mb-1">
          <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors" aria-label="Attach file" title="Attach file"><Plus className="w-5 h-5" /></button>
          <div className="relative">
            <button onClick={() => setShowEmoji((v) => !v)} className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors" aria-label="Emoji"><Smile className="w-5 h-5" /></button>
            {showEmoji && <div className="absolute bottom-12 left-0 z-30"><EmojiPickerV2 onPick={insertEmoji} onClose={() => setShowEmoji(false)} /></div>}
          </div>
        </div>

        {/* Center: input (single line, grows) */}
        <textarea
          ref={taRef} value={value} onChange={handleChange} onKeyDown={onKeyDown} disabled={disabled}
          placeholder={placeholder} rows={1} aria-label="Message" onFocus={onFocus}
          className="flex-1 min-w-0 resize-none rounded-3xl bg-[#1e1e1e] border border-border px-4 py-3 min-h-[48px] text-sm leading-5 max-h-36 focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/70"
        />

        {/* Right: gallery + voice/send */}
        <div className="flex items-center gap-0.5 shrink-0 mb-1">
          <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors" aria-label="Attach image" title="Attach image"><ImageIcon className="w-5 h-5" /></button>
          <button
            onClick={hasContent ? submit : undefined}
            disabled={disabled}
            aria-label={hasContent ? "Send message" : "Voice message"}
            title={hasContent ? "Send" : "Voice messages coming soon"}
            className={`relative shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${hasContent ? "mist-send bg-primary text-primary-foreground" : "bg-[#1e1e1e] text-muted-foreground hover:bg-[#2a2a2a]"} ${sending ? "send-pop" : ""}`}
          >
            <Mic className={`absolute w-5 h-5 transition-all duration-200 ${hasContent ? "opacity-0 scale-50 rotate-90" : "opacity-100 scale-100 rotate-0"}`} />
            <Send className={`absolute w-5 h-5 transition-all duration-200 ${hasContent ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90"}`} />
          </button>
        </div>
      </div>
      {overHalf && <div className={`text-[10px] text-right pr-4 pb-1 ${nearLimit ? "text-destructive font-semibold" : "text-muted-foreground"}`}>{value.length}/{MAX}</div>}
      <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />
    </div>
  );
}