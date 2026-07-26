import { ArrowLeft, Search, Info, BellOff, Bell, Users, Settings2 } from "lucide-react";
import RoomIcon from "./RoomIcon";

// RoomHeader — room name + community context + member/online counts + typing
// indicator + quick actions (search, room info, mute, manage).
function IconBtn({ onClick, label, children }) {
  return (
    <button onClick={onClick} aria-label={label} className="p-2 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground min-w-[36px] min-h-[36px] flex items-center justify-center">
      {children}
    </button>
  );
}

export default function RoomHeader({ room, community, memberCount, onlineCount, typingNames, muted, onBack, onToggleMute, onSearch, onOpenInfo, onManage }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-background/80 backdrop-blur">
      <button onClick={onBack} className="md:hidden p-2 -ml-1 rounded-lg hover:bg-muted/60 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Back">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
        <RoomIcon name={room.icon} className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-semibold truncate">{room.name}</h2>
          {room.is_locked && <span className="text-[10px] text-muted-foreground">· locked</span>}
          {room.type === "emergency" && <span className="text-[10px] text-destructive font-semibold">· emergency</span>}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="truncate">{community?.name}</span>
          <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{memberCount}</span>
          <span className="text-success">● {onlineCount} online</span>
        </div>
        {typingNames.length > 0 && <div className="text-[11px] text-muted-foreground italic truncate">{typingNames.join(", ")} typing…</div>}
      </div>
      <div className="flex items-center gap-0.5">
        <IconBtn onClick={onSearch} label="Search"><Search className="w-4 h-4" /></IconBtn>
        <IconBtn onClick={onOpenInfo} label="Room info"><Info className="w-4 h-4" /></IconBtn>
        <IconBtn onClick={onToggleMute} label="Mute">{muted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}</IconBtn>
        {onManage && <IconBtn onClick={onManage} label="Manage room"><Settings2 className="w-4 h-4" /></IconBtn>}
      </div>
    </div>
  );
}