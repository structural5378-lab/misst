import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import {
  Bold, Italic, Strikethrough, Code, Heading, Link as LinkIcon, ImagePlus,
  Quote, List, AtSign, Hash, Smile, BarChart3, Eye, EyeOff, Paperclip, X, Loader2, Send,
} from "lucide-react";

const EMOJIS = ["👍", "❤️", "😂", "🔥", "👏", "😮", "🎉", "🙏", "💯", "🤔", "✅", "❌", "📡", "📻", "⚡", "🚗"];

// The single MIST composer — markdown-based, used for replies, new threads,
// quotes, edits, announcements and messages. Controls: toolbar, drag/drop &
// paste image upload, emoji, @-mentions, #hashtags, thread tags, poll builder,
// live preview, autosave + draft recovery, char counter.
export default function MistComposer({
  value,
  onChange,
  placeholder = "Write something...",
  participants = [],
  tags = [],
  onTagsChange,
  allowPoll = false,
  poll,
  onPollChange,
  draftKey,
  maxLength = 20000,
  submitting = false,
  submitLabel = "Post",
  onSubmit,
  onImageUploaded,
  autoFocus,
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const taRef = useRef(null);
  const fileRef = useRef(null);

  // Autosave + draft recovery
  useEffect(() => {
    if (!draftKey) return;
    const saved = localStorage.getItem(draftKey);
    if (saved && !value) onChange(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);
  useEffect(() => {
    if (!draftKey) return;
    const t = setTimeout(() => localStorage.setItem(draftKey, value), 500);
    return () => clearTimeout(t);
  }, [value, draftKey]);

  const wrap = (before, after = before) => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const sel = value.slice(s, e);
    onChange(value.slice(0, s) + before + sel + after + value.slice(e));
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = s + before.length;
      ta.selectionEnd = e + before.length;
    });
  };
  const insert = (text) => {
    const ta = taRef.current;
    if (!ta) { onChange(value + text); return; }
    const s = ta.selectionStart;
    onChange(value.slice(0, s) + text + value.slice(ta.selectionEnd));
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = s + text.length;
    });
  };
  const linePrefix = (prefix) => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    onChange(value.slice(0, lineStart) + prefix + value.slice(lineStart));
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = s + prefix.length;
    });
  };

  const uploadImage = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setBusy(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      insert(`![${file.name || "image"}](${res.file_url})\n`);
      onImageUploaded?.(res.file_url);
    } catch {}
    setBusy(false);
  };
  const handleFiles = (files) => Array.from(files || []).forEach(uploadImage);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };
  const onPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const it of items) {
      if (it.type.startsWith("image/")) {
        const f = it.getAsFile();
        if (f) uploadImage(f);
      }
    }
  };
  const handleChange = (e) => {
    onChange(e.target.value);
    setShowMentions(e.target.value.endsWith("@"));
  };

  const addTag = (t) => {
    const clean = t.trim().replace(/^#/, "").toLowerCase();
    if (clean && !tags.includes(clean) && onTagsChange) onTagsChange([...tags, clean]);
    setTagInput("");
  };

  const pollData = poll && typeof poll === "object" ? poll : { question: "", options: ["", ""] };

  const ToolbarBtn = ({ onClick, icon: Icon, label }) => (
    <button type="button" onClick={onClick} title={label} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/40 transition-colors">
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/50 bg-secondary/30 overflow-x-auto scrollbar-hide">
        <ToolbarBtn onClick={() => wrap("**")} icon={Bold} label="Bold" />
        <ToolbarBtn onClick={() => wrap("*")} icon={Italic} label="Italic" />
        <ToolbarBtn onClick={() => wrap("~~")} icon={Strikethrough} label="Strikethrough" />
        <ToolbarBtn onClick={() => wrap("`")} icon={Code} label="Inline code" />
        <ToolbarBtn onClick={() => linePrefix("### ")} icon={Heading} label="Heading" />
        <ToolbarBtn onClick={() => insert("[text](https://)")} icon={LinkIcon} label="Link" />
        <ToolbarBtn onClick={() => fileRef.current?.click()} icon={ImagePlus} label="Image" />
        <ToolbarBtn onClick={() => linePrefix("> ")} icon={Quote} label="Quote" />
        <ToolbarBtn onClick={() => linePrefix("- ")} icon={List} label="List" />
        <ToolbarBtn onClick={() => insert("@")} icon={AtSign} label="Mention" />
        <ToolbarBtn onClick={() => insert("#")} icon={Hash} label="Hashtag" />
        <ToolbarBtn onClick={() => setShowEmoji(!showEmoji)} icon={Smile} label="Emoji" />
        {allowPoll && <ToolbarBtn onClick={() => setShowPoll(!showPoll)} icon={BarChart3} label="Poll" />}
        <div className="flex-1" />
        <ToolbarBtn onClick={() => setShowPreview(!showPreview)} icon={showPreview ? EyeOff : Eye} label="Preview" />
      </div>

      {/* Thread tags */}
      {onTagsChange && (
        <div className="flex items-center gap-1.5 flex-wrap px-3 py-2 border-b border-border/50">
          {tags.map((t) => (
            <span key={t} className="flex items-center gap-1 text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              #{t}
              <button type="button" onClick={() => onTagsChange(tags.filter((x) => x !== t))} className="hover:text-destructive">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); } }}
            placeholder="Add tag…"
            className="flex-1 min-w-[80px] bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      )}

      {/* Poll builder */}
      {allowPoll && showPoll && onPollChange && (
        <div className="px-3 py-2 border-b border-border/50 bg-secondary/20 space-y-2">
          <input
            value={pollData.question}
            onChange={(e) => onPollChange({ ...pollData, question: e.target.value })}
            placeholder="Poll question"
            className="w-full bg-background border border-border/50 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          {pollData.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                value={opt}
                onChange={(e) => { const o = [...pollData.options]; o[i] = e.target.value; onPollChange({ ...pollData, options: o }); }}
                placeholder={`Option ${i + 1}`}
                className="flex-1 bg-background border border-border/50 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              {pollData.options.length > 2 && (
                <button type="button" onClick={() => onPollChange({ ...pollData, options: pollData.options.filter((_, j) => j !== i) })} className="text-muted-foreground hover:text-destructive">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {pollData.options.length < 6 && (
            <button type="button" onClick={() => onPollChange({ ...pollData, options: [...pollData.options, ""] })} className="text-[11px] text-primary hover:underline">
              + Add option
            </button>
          )}
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div className="flex gap-1 flex-wrap px-3 py-2 border-b border-border/50 bg-secondary/20">
          {EMOJIS.map((e) => (
            <button key={e} type="button" onClick={() => { insert(e); setShowEmoji(false); }} className="text-xl p-1 hover:scale-125 transition-transform">{e}</button>
          ))}
        </div>
      )}

      {/* Editor / Preview */}
      {showPreview ? (
        <div className="p-3 min-h-[120px] max-h-72 overflow-y-auto forum-markdown text-sm text-foreground/90">
          <ReactMarkdown>{value || "*Nothing to preview*"}</ReactMarkdown>
        </div>
      ) : (
        <div
          className={`relative ${dragOver ? "ring-2 ring-primary/50 bg-primary/5" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <textarea
            ref={taRef}
            value={value}
            onChange={handleChange}
            onPaste={onPaste}
            placeholder={placeholder}
            rows={4}
            autoFocus={autoFocus}
            maxLength={maxLength}
            className="w-full bg-transparent px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-y focus:outline-none min-h-[120px] max-h-72"
          />
          {dragOver && <div className="absolute inset-0 flex items-center justify-center text-xs text-primary pointer-events-none">Drop images to upload</div>}
          {showMentions && participants.length > 0 && (
            <div className="absolute left-3 right-3 bottom-full mb-1 bg-popover border border-border rounded-lg shadow-xl py-1 max-h-32 overflow-y-auto z-30">
              {participants.map((p) => (
                <button key={p.id} type="button" onClick={() => { insert(`${(p.name || "").replace(/\s+/g, "")} `); setShowMentions(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-muted/50">
                  <span className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-bold text-primary">{(p.name || "?")[0]}</span>
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-border/50 bg-secondary/20">
        <button type="button" onClick={() => fileRef.current?.click()} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/40">
          <Paperclip className="w-4 h-4" />
        </button>
        {busy && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
        <span className={`text-[10px] ${value.length > maxLength * 0.95 ? "text-warning" : "text-muted-foreground/60"}`}>{value.length}/{maxLength}</span>
        <div className="flex-1" />
        {onSubmit && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || !value.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {submitting ? "Posting…" : submitLabel}
          </button>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={(e) => handleFiles(e.target.files)} className="hidden" />
    </div>
  );
}