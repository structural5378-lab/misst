import { useEffect, useState } from "react";
import { ArrowLeft, Search, Info, Bell, BellOff, Pin, Settings2, Radio, Users, Siren, Wifi, Activity } from "lucide-react";
import { mist } from '@/api/mist';
import RoomIcon from "@/components/chatV2/community/RoomIcon";

// PremiumChannelHeader — an intelligent communications dashboard for a channel.
// Shows community banner/avatar, description, live member + online counts,
// active repeater/freq/tone, active net status, emergency indicator, and the
// full action set (search, pin, mute, info, manage). Always feels alive via
// realtime online counts passed from presence.
export default function PremiumChannelHeader({
  room, community, memberCount, onlineCount, typingNames, muted,
  onBack, onToggleMute, onSearch, onOpenInfo, onManage, onPinned, isAdmin, forceBack,
}) {
  const [activeNet, setActiveNet] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!community?.id) return;
    mist.entities.Net.filter({ community_id: community.id, status: "active" })
      .then((rows) => { if (alive) setActiveNet(rows && rows[0] ? rows[0] : null); })
      .catch(() => {});
    return () => { alive = false; };
  }, [community?.id]);

  const isEmergency = room?.type === "emergency";

  return (
    <div className="relative border-b border-border bg-background/80 backdrop-blur z-10">
      {community?.banner_url && (
        <div className="absolute inset-x-0 top-0 h-16 overflow-hidden pointer-events-none">
          <img src={community.banner_url} className="w-full h-full object-cover opacity-25" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/50" />
        </div>
      )}
      <div className="relative flex items-center gap-2 px-3 py-2">
        <button
          onClick={onBack}
          className={`${forceBack ? "xl:hidden" : "md:hidden"} p-2 -ml-1 rounded-lg hover:bg-muted/60 min-w-[44px] min-h-[44px] flex items-center justify-center`}
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/10 bg-primary/15 flex items-center justify-center">
          {community?.logo_url
            ? <img src={community.logo_url} alt="" className="w-full h-full object-cover" />
            : <RoomIcon name={room?.icon} className="w-5 h-5 text-primary" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-foreground truncate">#{room?.name}</h2>
            {isEmergency && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-300 bg-red-500/15 px-1.5 py-0.5 rounded-full">
                <Siren className="w-2.5 h-2.5" />EMERGENCY
              </span>
            )}
            {activeNet && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mist-pulse-ring" />NET LIVE
              </span>
            )}
            {room?.is_locked && <span className="text-[10px] text-muted-foreground">· locked</span>}
            {room?.slow_mode_seconds > 0 && <span className="text-[10px] text-muted-foreground">· slow {room.slow_mode_seconds}s</span>}
          </div>
          <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground overflow-hidden">
            <span className="flex items-center gap-1 shrink-0"><Users className="w-3 h-3" />{memberCount || 0}</span>
            <span className="flex items-center gap-1 text-emerald-400 shrink-0">● {onlineCount || 0}</span>
            {community?.primary_repeater && <span className="flex items-center gap-1 truncate"><Radio className="w-3 h-3" />{community.primary_repeater}</span>}
            {community?.frequency ? <span className="flex items-center gap-1 shrink-0"><Wifi className="w-3 h-3" />{community.frequency} MHz</span> : null}
            {community?.pl_tone ? <span className="flex items-center gap-1 shrink-0"><Activity className="w-3 h-3" />{community.pl_tone}</span> : null}
          </div>
          {typingNames && typingNames.length > 0 && (
            <div className="text-[11px] text-muted-foreground italic truncate">{typingNames.join(", ")} typing…</div>
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <HeaderBtn onClick={onSearch} label="Search"><Search className="w-4 h-4" /></HeaderBtn>
          {onPinned && <HeaderBtn onClick={onPinned} label="Pinned"><Pin className="w-4 h-4" /></HeaderBtn>}
          <HeaderBtn onClick={onToggleMute} label="Mute">{muted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}</HeaderBtn>
          <HeaderBtn onClick={onOpenInfo} label="Channel info"><Info className="w-4 h-4" /></HeaderBtn>
          {onManage && <HeaderBtn onClick={onManage} label="Manage"><Settings2 className="w-4 h-4" /></HeaderBtn>}
        </div>
      </div>
      {community?.description && (
        <p className="relative px-3 pb-1.5 -mt-0.5 text-[11px] text-muted-foreground/80 line-clamp-1">{community.description}</p>
      )}
    </div>
  );
}

function HeaderBtn({ onClick, label, children }) {
  return (
    <button onClick={onClick} aria-label={label} className="p-2 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground min-w-[36px] min-h-[36px] flex items-center justify-center">
      {children}
    </button>
  );
}