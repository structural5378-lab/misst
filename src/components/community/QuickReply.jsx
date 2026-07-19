import React, { useState, useEffect, useRef } from "react";
import { Send, ImagePlus, Eye, EyeOff, Smile, AtSign } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";

const EMOJIS = ["👍", "❤️", "😂", "🔥", "👏", "😮", "🎉", "🙏", "💯", "🤔"];

export default function QuickReply({ value, onChange, onSend, onImage, posting, disabled, participants = [], threadId }) {
  const [showPreview, setShowPreview] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const taRef = useRef(null);

  // Draft autosave + recovery (per thread)
  useEffect(() => {
    const key = `mist_draft_thread_${threadId}`;
    const saved = localStorage.getItem(key);
    if (saved && !value) onChange(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(`mist_draft_thread_${threadId}`, value), 400);
    return () => clearTimeout(t);
  }, [value, threadId]);

  const insertAt = (text) => {
    const ta = taRef.current;
    if (!ta) { onChange(value + text); return; }
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    onChange(value.slice(0, s) + text + value.slice(e));
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = s + text.length;
    });
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    setShowMentions(e.target.value.endsWith("@"));
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (file) onImage?.(file);
  };

  return (
    <div className="border-t border-border bg-card/95 backdrop-blur-xl p-3" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
      {showPreview ? (
        <div className="rounded-lg border border-border/50 bg-secondary/30 p-3 min-h-[40px] max-h-32 overflow-y-auto forum-markdown text-sm text-foreground/90">
          <ReactMarkdown>{value || "*Nothing to preview*"}</ReactMarkdown>
        </div>
      ) : (
        <div className="relative">
          <textarea
            ref={taRef}
            value={value}
            onChange={handleChange}
            placeholder="Write a reply... (Markdown supported)"
            rows={1}
            className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 max-h-32"
          />
          {showMentions && participants.length > 0 && (
            <div className="absolute left-0 right-0 bottom-full mb-1 bg-popover border border-border rounded-lg shadow-xl py-1 max-h-32 overflow-y-auto z-30">
              {participants.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { insertAt(`${(p.name || "").replace(/\s+/g, "")} `); setShowMentions(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-muted/50"
                >
                  <span className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-bold text-primary">
                    {(p.name || "?")[0]}
                  </span>
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {showEmoji && (
        <div className="flex gap-1 flex-wrap mt-2 p-2 rounded-lg bg-secondary/40 border border-border/40">
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => { insertAt(e); setShowEmoji(false); }} className="text-xl p-1 hover:scale-125 transition-transform">{e}</button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1 mt-2">
        <label className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-pointer">
          <ImagePlus className="w-4 h-4" />
          <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
        </label>
        <button onClick={() => setShowEmoji(!showEmoji)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40">
          <Smile className="w-4 h-4" />
        </button>
        <button onClick={() => insertAt("@")} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40">
          <AtSign className="w-4 h-4" />
        </button>
        <button onClick={() => setShowPreview(!showPreview)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40">
          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <div className="flex-1" />
        <span className="text-[10px] text-muted-foreground/60 hidden sm:block">{value.length}</span>
        <Button size="sm" onClick={onSend} disabled={!value.trim() || posting || disabled} className="gap-1">
          <Send className="w-3.5 h-3.5" /> {posting ? "Posting..." : "Reply"}
        </Button>
      </div>
    </div>
  );
}