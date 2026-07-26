import { useEffect } from "react";
import { Reply, Copy, Pencil, Trash2, Smile, Pin, Forward } from "lucide-react";

// MessageContextMenuV2 — right-click (desktop) / long-press (mobile) menu.
// Renders a viewport-fixed backdrop + positioned menu. Closes on outside
// click, scroll, or Escape. Pin is functional only when onPin is provided
// (community rooms); Forward is a future-ready placeholder.
export default function MessageContextMenuV2({ x, y, isMine, onReply, onCopy, onEdit, onDelete, onReact, onPin, pinned, onClose }) {
  useEffect(() => {
    const onScroll = () => onClose?.();
    const onEsc = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("keydown", onEsc);
    return () => { window.removeEventListener("scroll", onScroll, true); window.removeEventListener("keydown", onEsc); };
  }, [onClose]);

  const maxX = typeof window !== "undefined" ? window.innerWidth - 180 : x;
  const maxY = typeof window !== "undefined" ? window.innerHeight - 260 : y;
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

  return (
    <div className="fixed inset-0 z-50" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose?.(); }}>
      <div
        className="sheet-fade absolute w-44 rounded-xl border border-border bg-popover shadow-xl py-1"
        style={{ left, top }}
        onClick={(e) => e.stopPropagation()}
      >
        {item("Reply", <Reply className="w-4 h-4" />, onReply)}
        {item("React", <Smile className="w-4 h-4" />, onReact)}
        {item("Copy", <Copy className="w-4 h-4" />, onCopy)}
        {isMine && item("Edit", <Pencil className="w-4 h-4" />, onEdit)}
        {onPin && (
          <button
            onClick={() => { onPin?.(); onClose?.(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-muted/60 transition-colors text-foreground"
          >
            <Pin className="w-4 h-4" />{pinned ? "Unpin" : "Pin"}
          </button>
        )}
        {item("Forward", <Forward className="w-4 h-4" />, () => {})}
        {isMine && item("Delete", <Trash2 className="w-4 h-4" />, onDelete, true)}
      </div>
    </div>
  );
}