import { useEffect } from "react";
import { Reply, Copy, Pencil, Trash2, Smile, Pin, Forward, Megaphone, VolumeX, Ban, UserX, ShieldAlert } from "lucide-react";

// MessageContextMenuV2 — right-click (desktop) / long-press (mobile) menu.
// Shows standard actions for everyone, plus a moderation section for
// authorized moderators/admins (hidden from regular members).
export default function MessageContextMenuV2({
  x, y, isMine, canModerate,
  onReply, onCopy, onEdit, onDelete, onReact, onPin, pinned,
  onAnnounce, announced, onSticky, sticky,
  onMuteUser, onSuspendUser, onKickUser, onBanUser, onClose,
}) {
  useEffect(() => {
    const onScroll = () => onClose?.();
    const onEsc = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("keydown", onEsc);
    return () => { window.removeEventListener("scroll", onScroll, true); window.removeEventListener("keydown", onEsc); };
  }, [onClose]);

  const maxX = typeof window !== "undefined" ? window.innerWidth - 190 : x;
  const maxY = typeof window !== "undefined" ? window.innerHeight - 320 : y;
  const left = Math.min(Math.max(8, x), maxX);
  const top = Math.min(Math.max(8, y), maxY);

  const item = (label, icon, fn, danger) => (
    <button
      onClick={() => { fn?.(); onClose?.(); }}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-muted/60 transition-colors ${danger ? "text-destructive" : "text-foreground"}`}
    >
      {icon}{label}
    </button>
  );

  const Divider = () => <div className="my-1 h-px bg-border" />;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose?.(); }}>
      <div
        className="sheet-fade absolute w-48 rounded-xl border border-border bg-popover shadow-xl py-1"
        style={{ left, top }}
        onClick={(e) => e.stopPropagation()}
      >
        {item("Reply", <Reply className="w-4 h-4" />, onReply)}
        {item("React", <Smile className="w-4 h-4" />, onReact)}
        {item("Copy", <Copy className="w-4 h-4" />, onCopy)}
        {isMine && item("Edit", <Pencil className="w-4 h-4" />, onEdit)}
        {onPin && (
          <button onClick={() => { onPin?.(); onClose?.(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-muted/60 transition-colors text-foreground">
            <Pin className="w-4 h-4" />{pinned ? "Unpin" : "Pin"}
          </button>
        )}
        {canModerate && (
          <>
            <Divider />
            {onAnnounce && (
              <button onClick={() => { onAnnounce?.(); onClose?.(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-muted/60 transition-colors text-foreground">
                <Megaphone className="w-4 h-4" />{announced ? "Unmark Announcement" : "Mark Announcement"}
              </button>
            )}
            {onSticky && (
              <button onClick={() => { onSticky?.(); onClose?.(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-muted/60 transition-colors text-foreground">
                <Pin className="w-4 h-4" />{sticky ? "Unsticky" : "Sticky"}
              </button>
            )}
          </>
        )}
        {item("Forward", <Forward className="w-4 h-4" />, () => {})}
        {isMine && item("Delete", <Trash2 className="w-4 h-4" />, onDelete, true)}

        {canModerate && !isMine && (
          <>
            <Divider />
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">Moderate</p>
            {item("Delete", <Trash2 className="w-4 h-4" />, onDelete, true)}
            {item("Mute User", <VolumeX className="w-4 h-4" />, onMuteUser)}
            {item("Suspend User", <ShieldAlert className="w-4 h-4" />, onSuspendUser)}
            {item("Kick User", <UserX className="w-4 h-4" />, onKickUser)}
            {item("Ban User", <Ban className="w-4 h-4" />, onBanUser, true)}
          </>
        )}
      </div>
    </div>
  );
}