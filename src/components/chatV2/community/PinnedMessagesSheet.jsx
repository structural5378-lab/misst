import { useEffect, useState } from "react";
import { X, Pin } from "lucide-react";
import { mist } from '@/api/mist';
// PinnedMessagesSheet — slide-over listing pinned messages in a room. Tap
// "Jump to message" to scroll the room view to it; admins can unpin.
export default function PinnedMessagesSheet({ room, onClose, onJump, onUnpin }) {
  const [pinned, setPinned] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const list = await mist.entities.ChatV2RoomMessage
        .filter({ room_id: room.id, pinned: true, deleted: false }, "-pinned_at", 50)
        .catch(() => []);
      setPinned(list || []);
      setLoading(false);
    })();
  }, [room.id]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-sm bg-card border-l border-border h-full overflow-y-auto sheet-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <Pin className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Pinned Messages</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/60"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-3 space-y-2">
          {loading ? (
            <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : pinned.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-10">No pinned messages in {room.name}.</div>
          ) : pinned.map((m) => (
            <div key={m.id} className="rounded-xl border border-border bg-secondary/30 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium">{m.sender_name}</span>
                {m.pinned_by_name && <span className="text-[10px] text-muted-foreground">pinned by {m.pinned_by_name}</span>}
              </div>
              <div className="text-sm whitespace-pre-wrap break-words">{m.body}</div>
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => onJump(m.id)} className="text-xs text-primary hover:underline">Jump to message</button>
                {onUnpin && <button onClick={() => onUnpin(m)} className="text-xs text-destructive hover:underline ml-auto">Unpin</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}