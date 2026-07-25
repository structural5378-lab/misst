import React from "react";
import { Activity, Satellite, Gauge, Clock, Navigation, Radio, Eye, EyeOff } from "lucide-react";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import {
  isLocationLive, getLocationAgeMs, formatAge, formatSpeed, formatHeading,
} from "@/lib/radioScopeLocation";

function Row({ icon: Icon, label, value, accent = "text-foreground" }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/40">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="w-3.5 h-3.5 text-cyan-500/70 shrink-0" />
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <span className={`text-xs font-mono font-semibold ${accent} truncate ml-2`}>{value}</span>
    </div>
  );
}

export default function RadioScopeDebugPanel({ myFix, myPresence, liveUsers, allPresence, now }) {
  const { isAdmin } = useAdminAccess();
  if (!isAdmin) return null;

  const live = isLocationLive(myPresence, now);
  const age = myFix?.timestamp ? now - myFix.timestamp : getLocationAgeMs(myPresence, now);
  const expiredCount = (allPresence || []).filter((p) => p.sharing_location && !isLocationLive(p, now)).length;

  return (
    <div className="absolute left-3 z-20 w-64 max-w-[calc(100vw-1.5rem)] bg-black/85 backdrop-blur-md border border-cyan-500/30 rounded-xl overflow-hidden text-foreground"
         style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}>
      <div className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border-b border-cyan-500/20">
        <Activity className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-bold text-cyan-300 tracking-wide">GPS Debug (Admin)</span>
        <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${live ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
          {live ? "LIVE" : "CACHED/STALE"}
        </span>
      </div>
      <div className="px-3 py-2 max-h-64 overflow-y-auto">
        <Row icon={Clock} label="Last GPS" value={formatAge(age)} accent={live ? "text-emerald-400" : "text-amber-400"} />
        <Row icon={Gauge} label="Accuracy" value={myFix?.accuracy != null ? `${Math.round(myFix.accuracy)} m` : "—"} accent={myFix?.accuracy != null && myFix.accuracy > 100 ? "text-red-400" : "text-cyan-400"} />
        <Row icon={Satellite} label="Lat / Lon" value={myFix ? `${myFix.latitude.toFixed(5)}, ${myFix.longitude.toFixed(5)}` : "—"} />
        <Row icon={Navigation} label="Speed" value={formatSpeed(myFix?.speed)} />
        <Row icon={Navigation} label="Heading" value={formatHeading(myFix?.heading)} />
        <Row icon={Radio} label="Source" value={(myFix?.source || myPresence?.location_source || "—").toUpperCase()} />
        <Row icon={Eye} label="Sharing" value={myPresence?.sharing_location ? "ON" : "OFF"} accent={myPresence?.sharing_location ? "text-emerald-400" : "text-muted-foreground"} />
        <Row icon={EyeOff} label="Online" value={(myPresence?.status || "—").toUpperCase()} />
        <Row icon={Activity} label="Live Markers" value={liveUsers.length} accent="text-cyan-400" />
        <Row icon={EyeOff} label="Expired (hidden)" value={expiredCount} accent={expiredCount ? "text-amber-400" : "text-muted-foreground"} />
      </div>
    </div>
  );
}