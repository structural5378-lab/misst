import React, { useState, useRef, useEffect } from "react";
import { Send, ImagePlus, Paperclip, Smile, X, Reply, Edit2 } from "lucide-react";

const EMOJIS = [
  "😀", "😂", "🥰", "😎", "🤔", "😢", "😡", "👍", "👎", "🙏",
  "💪", "🔥", "✨", "🎉", "📢", "📻", "📡", "🚨", "❤️", "💜",
  "🤝", "👋", "✅", "❌", "⚠️", "📍", "🗺️", "🌤️", "⛈️", "🚗",
];

export default function MistChatComposer({
  onSend, onTyping, replyTo, editTarget, onCancelReply, onCancelEdit, onEditSave,
}) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [fileAttachment, setFileAttachment] = useState(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (editTarget) {
      setText(editTarget.content || "");
      textareaRef.current?.focus();
    }
  }, [editTarget]);

  useEffect(() => {
    if (replyTo) textareaRef.current?.focus();
  }, [replyTo]);

  const handleSend = () => {
    if (editTarget) {
      onEditSave(editTarget.id, text);
      setText("");
      return;
    }
    if (!text.trim() && !imageFile && !fileAttachment) return;
    onSend(text, imageFile, fileAttachment, replyTo);
    setText("");
    setImageFile(null);
    setFileAttachment(null);
    onCancelReply();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    onTyping();
  };

  const insertEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setImageFile(file);
    e.target.value = "";
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setFileAttachment(file);
    e.target.value = "";
  };

  return (
    <div className="border-t border-border bg-card">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 px-3 pt-2">
          <div className="flex-1 flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5 border-l-2 border-primary">
            <Reply className="w-3.5 h-3.5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-primary">{replyTo.sender_name}</p>
              <p className="text-xs text-muted-foreground truncate">{replyTo.content || "📷 Photo"}</p>
            </div>
          </div>
          <button onClick={onCancelReply} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Edit preview */}
      {editTarget && (
        <div className="flex items-center gap-2 px-3 pt-2">
          <div className="flex-1 flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5 border-l-2 border-warning">
            <Edit2 className="w-3.5 h-3.5 text-warning shrink-0" />
            <p className="text-xs text-muted-foreground truncate flex-1">{editTarget.content}</p>
          </div>
          <button onClick={onCancelEdit} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachment preview */}
      {(imageFile || fileAttachment) && (
        <div className="flex items-center gap-2 px-3 pt-2">
          <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5">
            {imageFile ? <ImagePlus className="w-4 h-4 text-primary" /> : <Paperclip className="w-4 h-4 text-primary" />}
            <p className="text-xs text-foreground truncate max-w-[200px]">{imageFile?.name || fileAttachment?.name}</p>
          </div>
          <button onClick={() => { setImageFile(null); setFileAttachment(null); }} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div className="px-3 pt-2">
          <div className="grid grid-cols-10 gap-1 bg-secondary rounded-xl p-2 max-h-40 overflow-y-auto">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => insertEmoji(emoji)}
                className="text-xl p-1 hover:bg-background rounded-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 p-3">
        <div className="flex items-center gap-1 pb-1">
          <button onClick={() => imageInputRef.current?.click()} className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Attach image">
            <ImagePlus className="w-5 h-5" />
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Attach file">
            <Paperclip className="w-5 h-5" />
          </button>
          <button onClick={() => setShowEmoji(!showEmoji)} className={`p-2 transition-colors ${showEmoji ? "text-primary" : "text-muted-foreground hover:text-primary"}`} title="Emoji">
            <Smile className="w-5 h-5" />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={editTarget ? "Edit message..." : "Type a message..."}
          rows={1}
          className="flex-1 bg-secondary border border-border rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none max-h-32"
          style={{ minHeight: "40px" }}
        />

        <button
          onClick={handleSend}
          disabled={!text.trim() && !imageFile && !fileAttachment}
          className="p-2.5 rounded-full bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
      <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />
    </div>
  );
}