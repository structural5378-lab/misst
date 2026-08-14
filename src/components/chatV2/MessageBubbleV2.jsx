import { useRef, useState } from "react";
import { Check, CheckCheck, Clock, AlertCircle, RotateCcw, Smile, Pin, Megaphone, Shield } from "lucide-react";
import { formatTime, isTempId } from "@/lib/chatV2/chatV2Utils";
import MessageContextMenuV2 from "./MessageContextMenuV2";
import ReactionPickerV2 from "./ReactionPickerV2";
import { detectCard } from "@/lib/messageCards";
import MessageCardRouter from "./cards/MessageCardRouter";
import ActiveBadge from "@/components/premium/ActiveBadge";

// Renders message body with URLs linkified into subtle inline links.
function renderBody(body) {
  if (!body) return null;
  const parts = String(body).split(/(https?:\/\/[^\s]+)/g);
  return parts.map((p, i) =>
    /^https?:\/\//.test(p)
      ? <a key={i} href={p} target="_blank" rel="noreferrer" className="mist-link" onClick={(e) => e.stopPropagation()}>{p}</a>
      : <span key={i}>{p}</span>
  );
}

// MessageBubbleV2 — premium message rendering with grouping, reactions,
// reply quotes, delivery/read receipts, edit/delete, and a context menu
// triggered by right-click (desktop) or long-press (mobile).
function Avatar({ name, avatar }) {
  if (avatar) return <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover" />;
  const initials = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[11px] font-semibold text-secondary-foreground">{initials}</div>;
}

function StatusIcon({ status, onRetry }) {
  if (status === "sending") return <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />;
  if (status === "sent") return <Check className="w-3.5 h-3.5 text-muted-foreground/70" />;
  if (status === "delivered") return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground/70" />;
  if (status === "read") return <CheckCheck className="w-3.5 h-3.5 text-sky-400" />;
  if (status === "failed") return (
    <button onClick={onRetry} className="flex items-center gap-1 text-destructive hover:text-destructive/80">
      <AlertCircle className="w-3.5 h-3.5" /><span className="text-[10px] font-medium">Retry</span><RotateCcw className="w-3 h-3" />
    </button>
  );
  return null;
}

export default function MessageBubbleV2({ message, isMine, showAvatar, myId, onRetry, onEdit, onDelete, onReact, onReply, onReplyJump, onPin, pinned, canModerate, onAnnounce, onSticky, onMuteUser, onSuspendUser, onKickUser, onBanUser, selectMode, selected, onToggleSelect, senderBadge }) {
  const [menu, setMenu] = useState(null); // {x,y}
  const [pickerOpen, setPickerOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const longPressTimer = useRef(null);
  const longPressFired = useRef(false);

  if (message.deleted) {
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"} px-3 my-0.5`}>
        <div className={`max-w-[78%] px-3 py-2 text-sm italic text-muted-foreground bg-[#1e1e1e]/60 ${isMine ? "rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-sm" : "rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-sm"}`}>
          This message was deleted.
        </div>
      </div>
    );
  }

  const reactions = message.reactions || {};
  const reactionEntries = Object.entries(reactions).filter(([, arr]) => arr && arr.length);

  const openMenuAt = (x, y) => setMenu({ x, y });
  const onContextMenu = (e) => {
    e.preventDefault();
    openMenuAt(e.clientX, e.clientY);
  };
  const onTouchStart = (e) => {
    longPressFired.current = false;
    const t = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      openMenuAt(t.clientX, t.clientY);
    }, 450);
  };
  const onTouchEnd = () => { clearTimeout(longPressTimer.current); };
  const onTouchMove = () => { clearTimeout(longPressTimer.current); };

  const submitEdit = () => {
    if (draft.trim() && draft.trim() !== message.body) onEdit?.(message.id, draft.trim());
    setEditing(false);
  };

  const doCopy = () => { navigator.clipboard?.writeText(message.body || "").catch(() => {}); };

  return (
    <div
      className={`group relative flex items-end gap-2 px-3 my-0.5 msg-in select-none ${isMine ? "flex-row-reverse" : "flex-row"} ${selectMode ? "cursor-pointer" : ""} ${selectMode && selected ? "bg-primary/10 rounded-lg" : ""}`}
      style={{ WebkitTouchCallout: "none" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPickerOpen(false); }}
      onContextMenu={selectMode ? (e) => e.preventDefault() : onContextMenu}
      onTouchStart={selectMode ? undefined : onTouchStart}
      onTouchEnd={selectMode ? undefined : onTouchEnd}
      onTouchMove={selectMode ? undefined : onTouchMove}
      onClick={selectMode ? (e) => { e.stopPropagation(); onToggleSelect?.(message.id); } : undefined}
      data-msg-id={message.id || message.client_temp_id}
    >
      {selectMode && (
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mb-1 ${selected ? "bg-primary border-primary" : "border-muted-foreground/40"}`}>
          {selected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
        </div>
      )}
      {!isMine && (showAvatar ? <Avatar name={message.sender_name} avatar={message.sender_avatar} /> : <div className="w-8" />)}
      <div className={`max-w-[80%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
        {!isMine && showAvatar && (
          <span className="text-[11px] mb-0.5 px-1 flex items-center gap-1 flex-wrap">
            <span className="font-semibold text-[#76d6ff]">~ {message.sender_name}</span>
            {senderBadge === undefined ? <ActiveBadge userId={message.sender_id} size="inline" /> : senderBadge}
          </span>
        )}
        {message.reply_to_preview && (
          <button
            onClick={selectMode ? undefined : () => onReplyJump?.(message.reply_to_message_id)}
            className="flex gap-2 w-full max-w-full mb-0.5 text-left rounded-lg overflow-hidden bg-white/5"
          >
            <span className="w-1 shrink-0 bg-orange-300/70" />
            <span className="min-w-0 py-1 pr-2">
              <span className="block text-[11px] font-semibold text-[#76d6ff] truncate">{message.reply_to_sender_name || "Original"}</span>
              <span className="block text-[11px] text-muted-foreground truncate">{message.reply_to_preview}</span>
            </span>
          </button>
        )}
        {editing ? (
          <div className="flex flex-col gap-1.5 w-64">
            <textarea
              value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus rows={2}
              className="w-full rounded-xl bg-card border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="flex gap-2">
              <button onClick={submitEdit} className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs">Save</button>
              <button onClick={() => setEditing(false)} className="px-3 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            {(message.is_announcement || message.is_official || message.is_sticky) && (
              <div className={`flex flex-wrap gap-1 mb-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
                {message.is_announcement && <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded-full"><Megaphone className="w-2.5 h-2.5" />Announcement</span>}
                {message.is_official && <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-violet-400 bg-violet-500/15 px-1.5 py-0.5 rounded-full"><Shield className="w-2.5 h-2.5" />Official</span>}
                {message.is_sticky && <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-primary bg-primary/15 px-1.5 py-0.5 rounded-full"><Pin className="w-2.5 h-2.5" />Sticky</span>}
              </div>
            )}
            {(() => {
              const card = detectCard(message);
              if (card) {
                return (
                  <div className="w-full msg-card-in">
                    <MessageCardRouter message={message} card={card} isMine={isMine} onReply={() => onReply?.(message)} />
                  </div>
                );
              }
              const shape = isMine ? "rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-sm" : "rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-sm";
              const color = isMine
                ? "bg-[#1a3d52] text-foreground"
                : message.is_announcement ? "bg-amber-500/15 text-foreground border border-amber-500/40"
                : message.is_official ? "bg-violet-500/10 text-foreground border border-violet-500/40"
                : "bg-[#1e1e1e] text-foreground";
              return (
                <div className={`relative px-3 py-2 text-sm whitespace-pre-wrap break-words shadow-sm ${shape} ${color}`}>
                  <div>{renderBody(message.body)}</div>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    {message.edited_at && !editing && <span className="text-[10px] text-[#a0a0a0]">edited</span>}
                    <span className="text-[10px] text-[#a0a0a0]">{formatTime(message.created_date)}</span>
                    {isMine && !editing && <StatusIcon status={message.status} onRetry={() => onRetry?.(message.client_temp_id || message.id)} />}
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* Reactions — small circular badges */}
        {reactionEntries.length > 0 && (
          <div className={`flex flex-wrap gap-1 -mt-1.5 ${isMine ? "justify-end mr-1" : "justify-start ml-2"}`}>
            {reactionEntries.map(([emoji, users]) => {
              const mine = users.includes(myId);
              return (
                <button
                  key={emoji}
                  onClick={selectMode ? undefined : () => onReact?.(message.id, emoji)}
                  className={`mist-reaction-burst flex items-center gap-0.5 px-1.5 h-6 rounded-full text-xs border shadow-sm ${mine ? "border-primary bg-primary/20 text-primary" : "border-border bg-[#2a2a2a] text-foreground"}`}
                >
                  <span>{emoji}</span>
                  {users.length > 1 && <span className="text-[10px] font-semibold">{users.length}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick react button (desktop hover) */}
      {isMine && !editing && !isTempId(message.id) ? (
        <div className="relative">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground self-center"
            aria-label="React"
          >
            <Smile className="w-4 h-4" />
          </button>
          {pickerOpen && (
            <div className={`absolute top-6 ${isMine ? "right-0" : "left-0"} z-20`}>
              <ReactionPickerV2 onPick={(e) => { onReact?.(message.id, e); setPickerOpen(false); }} onClose={() => setPickerOpen(false)} />
            </div>
          )}
        </div>
      ) : (
        !isMine && (
          <div className="relative">
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground self-center"
              aria-label="React"
            >
              <Smile className="w-4 h-4" />
            </button>
            {pickerOpen && (
              <div className="absolute top-6 left-0 z-20">
                <ReactionPickerV2 onPick={(e) => { onReact?.(message.id, e); setPickerOpen(false); }} onClose={() => setPickerOpen(false)} />
              </div>
            )}
          </div>
        )
      )}

      {message.pinned && (
        <div className={`absolute -top-2 ${isMine ? "right-6" : "left-6"} flex items-center gap-1 text-[9px] font-semibold text-primary bg-background/90 px-1.5 py-0.5 rounded-full border border-primary/30`}>
          <Pin className="w-2.5 h-2.5" />Pinned
        </div>
      )}
      {menu && (
        <MessageContextMenuV2
          x={menu.x} y={menu.y} isMine={isMine} canModerate={canModerate}
          onReply={() => onReply?.(message)}
          onCopy={doCopy}
          onEdit={() => setEditing(true)}
          onDelete={() => onDelete?.(message.id)}
          onReact={() => { setPickerOpen(true); }}
          onPin={onPin ? () => onPin?.(message) : undefined}
          pinned={pinned}
          onAnnounce={onAnnounce ? () => onAnnounce?.(message) : undefined}
          announced={message.is_announcement}
          onSticky={onSticky ? () => onSticky?.(message) : undefined}
          sticky={message.is_sticky}
          onMuteUser={onMuteUser ? () => onMuteUser?.(message) : undefined}
          onSuspendUser={onSuspendUser ? () => onSuspendUser?.(message) : undefined}
          onKickUser={onKickUser ? () => onKickUser?.(message) : undefined}
          onBanUser={onBanUser ? () => onBanUser?.(message) : undefined}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}