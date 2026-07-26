import { useState } from "react";
import { Check, CheckCheck, Clock, AlertCircle, RotateCcw, Pencil, Trash2, CornerUpRight } from "lucide-react";
import { formatTime, isTempId } from "@/lib/chatV2/chatV2Utils";

// MessageBubbleV2 — renders a single message with status, edits, deletes,
// replies, and a retry affordance for failed sends.
function Avatar({ name, avatar, size = "md" }) {
  const sz = size === "md" ? "w-9 h-9" : "w-8 h-8";
  if (avatar) return <img src={avatar} alt={name} className={`${sz} rounded-full object-cover`} />;
  const initials = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return <div className={`${sz} rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-secondary-foreground`}>{initials}</div>;
}

function StatusIcon({ status, onRetry }) {
  if (status === "sending") return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
  if (status === "sent") return <Check className="w-3.5 h-3.5 text-muted-foreground" />;
  if (status === "delivered") return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />;
  if (status === "read") return <CheckCheck className="w-3.5 h-3.5 text-sky-400" />;
  if (status === "failed") return (
    <button onClick={onRetry} className="flex items-center gap-1 text-destructive hover:text-destructive/80">
      <AlertCircle className="w-3.5 h-3.5" />
      <span className="text-[11px] font-medium">Retry</span>
      <RotateCcw className="w-3 h-3" />
    </button>
  );
  return null;
}

export default function MessageBubbleV2({ message, isMine, showAvatar, onRetry, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);

  if (message.deleted) {
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"} px-3 my-0.5`}>
        <div className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm italic text-muted-foreground bg-muted/40 ${isMine ? "rounded-br-md" : "rounded-bl-md"}`}>
          This message was deleted.
        </div>
      </div>
    );
  }

  const submitEdit = () => {
    if (draft.trim() && draft.trim() !== message.body) onEdit?.(message.id, draft.trim());
    setEditing(false);
    setMenuOpen(false);
  };

  return (
    <div
      className={`group flex items-end gap-2 px-3 my-0.5 msg-in ${isMine ? "flex-row-reverse" : "flex-row"}`}
      onMouseLeave={() => setMenuOpen(false)}
    >
      {!isMine && (showAvatar ? <Avatar name={message.sender_name} avatar={message.sender_avatar} /> : <div className="w-9" />)}
      <div className={`max-w-[78%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
        {!isMine && showAvatar && (
          <span className="text-[11px] font-medium text-muted-foreground mb-0.5 px-1">{message.sender_name}</span>
        )}
        {message.reply_to_preview && (
          <div className={`text-[11px] px-2.5 py-1 rounded-lg mb-0.5 border-l-2 ${isMine ? "border-primary-foreground/40 bg-primary/20" : "border-primary/40 bg-primary/10"} text-muted-foreground truncate max-w-full`}>
            <CornerUpRight className="w-3 h-3 inline mr-1" />{message.reply_to_preview}
          </div>
        )}
        <div className="relative">
          {editing ? (
            <div className="flex flex-col gap-1.5 w-64">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-full rounded-xl bg-card border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                rows={2}
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={submitEdit} className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs">Save</button>
                <button onClick={() => { setEditing(false); setMenuOpen(false); }} className="px-3 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs">Cancel</button>
              </div>
            </div>
          ) : (
            <div
              className={`px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-secondary-foreground rounded-bl-md"}`}
              onDoubleClick={() => isMine && !isTempId(message.id) && setEditing(true)}
            >
              {message.body}
            </div>
          )}
        </div>
        <div className={`flex items-center gap-1.5 mt-0.5 px-1 ${isMine ? "flex-row-reverse" : ""}`}>
          {message.edited_at && !editing && <span className="text-[10px] text-muted-foreground">edited</span>}
          <span className="text-[10px] text-muted-foreground">{formatTime(message.created_date)}</span>
          {isMine && !editing && <StatusIcon status={message.status} onRetry={() => onRetry?.(message.client_temp_id || message.id)} />}
        </div>
      </div>
      {isMine && !editing && !isTempId(message.id) && (
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-10 bg-popover border border-border rounded-lg shadow-lg py-1 w-32">
              <button onClick={() => { setEditing(true); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2"><Pencil className="w-3.5 h-3.5" />Edit</button>
              <button onClick={() => { onDelete?.(message.id); setMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" />Delete</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}