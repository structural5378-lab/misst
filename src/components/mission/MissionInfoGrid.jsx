import React from "react";
import { Users, Radio, Hash, Signal, User, UserCheck, MapPin } from "lucide-react";

export default function MissionInfoGrid({ net, session, repeater, visitors }) {
  const rows = [
    { Icon: Users, label: "Community", value: net?.community_name || session?.community_name || "—" },
    { Icon: Radio, label: "Repeater", value: repeater?.callsign || net?.repeater_callsign || "—" },
    { Icon: Hash, label: "Frequency", value: net?.frequency ? `${net.frequency} MHz` : "—" },
    { Icon: Signal, label: "Tone", value: repeater?.tone || "—" },
    { Icon: User, label: "Net Control", value: session?.net_control || "—" },
    { Icon: UserCheck, label: "Assistant", value: session?.co_host || "—" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {rows.map((r) => (
        <div key={r.label} className="rounded-xl bg-card/60 border border-white/[0.06] p-2.5">
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase tracking-wide"><r.Icon className="w-2.5 h-2.5" /> {r.label}</div>
          <p className="text-xs font-semibold text-foreground mt-0.5 truncate">{r.value}</p>
        </div>
      ))}
      <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-2.5">
        <div className="flex items-center gap-1 text-[9px] text-violet-300 uppercase tracking-wide"><MapPin className="w-2.5 h-2.5" /> Visitors</div>
        <p className="text-xs font-bold text-violet-200 mt-0.5">{visitors}</p>
      </div>
    </div>
  );
}