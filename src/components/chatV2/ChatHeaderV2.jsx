import { ArrowLeft, MoreVertical, Bell, BellOff, Search } from "lucide-react";
import PresenceDotV2 from "./PresenceDotV2";
import { lastSeenLabel } from "@/lib/chatV2/chatV2Utils";

// ChatHeaderV2 — redesigned conversation header with avatar, presence,
// typing subtitle, and quick actions (mute, search, more menu).
function Avatar({ name, avatar, isGroup }) {
  if (avatar) return <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />;
  if (isGroup) return <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold">{(name || "?").slice(0, 1).toUpperCase()}</div>;
  const initials = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-secondary-foreground">{initials}</div>;
}

export default function ChatHeaderV2({ name, avatar, isGroup, presence, typingText, muted, onBack, onToggleMute, onSearch, onMore, forceBack }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
      {onBack && (
        <button onClick={onBack} className={`${forceBack ? "xl:hidden" : "md:hidden"} p-2 -ml-1 text-muted-foreground hover:text-foreground rounded-lg min-w-[40px] min-h-[40px] flex items-center justify-center`} aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <div className="relative shrink-0">
        <Avatar name={name} avatar={avatar} isGroup={isGroup} />
        {!isGroup && <span className="absolute -bottom-0.5 -right-0.5"><PresenceDotV2 presence={presence} /></span>}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold text-sm text-foreground truncate flex items-center gap-1.5">
          {name}
          {muted && <BellOff className="w-3.5 h-3.5 text-muted-foreground" />}
        </h2>
        <p className="text-[11px] text-muted-foreground truncate">
          {typingText || (isGroup ? "group chat" : lastSeenLabel(presence))}
        </p>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <button onClick={onSearch} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 min-w-[40px] min-h-[40px] flex items-center justify-center" aria-label="Search conversation">
          <Search className="w-5 h-5" />
        </button>
        <button onClick={onToggleMute} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 min-w-[40px] min-h-[40px] flex items-center justify-center" aria-label={muted ? "Unmute" : "Mute"}>
          {muted ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        </button>
        <button onClick={onMore} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 min-w-[40px] min-h-[40px] flex items-center justify-center" aria-label="More options">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}