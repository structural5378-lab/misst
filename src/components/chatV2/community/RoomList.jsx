import { Plus, Settings2, Pin, Star, BellOff, Lock } from "lucide-react";
import RoomIcon from "./RoomIcon";
import { timeAgo } from "@/lib/chatV2/chatV2Utils";

// RoomList — the left-pane list of a community's Chat V2 rooms, grouped into
// Pinned / Favorites / Rooms sections. Each row shows icon, name, last
// activity, unread badge, and hover actions (pin, favorite, edit).
export default function RoomList({ rooms, memberships, activeRoomId, onSelect, loading, onToggleFavorite, onTogglePin, isAdmin, onCreateRoom, onEditRoom }) {
  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const visible = rooms
    .filter((r) => !r.is_archived && (!r.is_hidden || isAdmin))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const pinned = visible.filter((r) => memberships[r.id]?.pinned);
  const favorites = visible.filter((r) => !memberships[r.id]?.pinned && memberships[r.id]?.favorite);
  const rest = visible.filter((r) => !memberships[r.id]?.pinned && !memberships[r.id]?.favorite);

  const Row = (r) => {
    const m = memberships[r.id];
    const active = activeRoomId === r.id;
    return (
      <div
        key={r.id}
        onClick={() => onSelect(r.id)}
        className={`group flex items-center gap-2 px-2 mx-1 my-0.5 py-2 rounded-lg cursor-pointer ${active ? "bg-primary/15" : "hover:bg-muted/50"}`}
      >
        <RoomIcon name={r.icon} className="w-4 h-4 shrink-0 opacity-80" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-medium truncate ${active ? "text-foreground" : "text-muted-foreground"}`}>{r.name}</span>
            {r.is_locked && <Lock className="w-3 h-3 opacity-60 text-muted-foreground" />}
            {m?.muted && <BellOff className="w-3 h-3 opacity-60 text-muted-foreground" />}
          </div>
          {r.last_message_at && (
            <div className="text-[10px] truncate text-muted-foreground/70">{timeAgo(r.last_message_at)}</div>
          )}
        </div>
        {m?.unread_count > 0 && (
          <span className="badge-pulse min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {m.unread_count > 99 ? "99+" : m.unread_count}
          </span>
        )}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onTogglePin(r.id); }} className="p-1 hover:text-foreground text-muted-foreground" aria-label="Pin room"><Pin className="w-3.5 h-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(r.id); }} className="p-1 hover:text-foreground text-muted-foreground" aria-label="Favorite"><Star className="w-3.5 h-3.5" /></button>
          {isAdmin && <button onClick={(e) => { e.stopPropagation(); onEditRoom(r); }} className="p-1 hover:text-foreground text-muted-foreground" aria-label="Edit room"><Settings2 className="w-3.5 h-3.5" /></button>}
        </div>
      </div>
    );
  };

  const Section = ({ title, children }) => (
    <div className="mb-1">
      <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{title}</div>
      {children}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto py-2">
      {isAdmin && (
        <button onClick={onCreateRoom} className="mx-2 mb-2 flex items-center gap-1.5 px-2 py-2 rounded-lg text-sm text-primary hover:bg-primary/10 w-[calc(100%-1rem)]">
          <Plus className="w-4 h-4" /> Create Room
        </button>
      )}
      {pinned.length > 0 && <Section title="Pinned">{pinned.map(Row)}</Section>}
      {favorites.length > 0 && <Section title="Favorites">{favorites.map(Row)}</Section>}
      <Section title="Rooms">
        {rest.length ? rest.map(Row) : <div className="px-4 py-2 text-xs text-muted-foreground">No rooms</div>}
      </Section>
    </div>
  );
}