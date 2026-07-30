import React from "react";
import { Wifi, WifiOff, Users } from "lucide-react";

// RepeaterBar — slim status strip shown directly above the composer. Shows
// the linked repeater, frequency, tone, and how many members are monitoring.
// When no repeater is linked, shows "No Repeater Linked".
export default function RepeaterBar({ community, monitoringCount = 0 }) {
  const linked = !!(community?.primary_repeater || community?.frequency);
  if (!linked) {
    return (
      <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 border-t border-border bg-secondary/30 text-[11px] text-muted-foreground">
        <WifiOff className="w-3.5 h-3.5 text-muted-foreground/60" />
        <span>No Repeater Linked</span>
      </div>
    );
  }
  return (
    <div className="shrink-0 flex items-center gap-3 px-3 py-1.5 border-t border-border bg-secondary/30 text-[11px]">
      <span className="flex items-center gap-1.5 text-emerald-400 font-semibold"><Wifi className="w-3.5 h-3.5" />Linked</span>
      <span className="text-foreground font-medium truncate">{community.primary_repeater || community.callsign || "Repeater"}</span>
      {community.frequency && <span className="text-muted-foreground">{community.frequency} MHz</span>}
      {community.pl_tone && <span className="text-muted-foreground">PL {community.pl_tone}</span>}
      <span className="ml-auto flex items-center gap-1 text-muted-foreground"><Users className="w-3 h-3" />{monitoringCount} monitoring</span>
    </div>
  );
}