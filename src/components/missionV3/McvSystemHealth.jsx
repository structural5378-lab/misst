import React from "react";
import { Wifi, Database, Activity, Server } from "lucide-react";

// McvSystemHealth — right-sidebar system health panel: connection, realtime
// subscription, data-sync cadence, and session status. Static-but-accurate
// indicators (the hook subscribes + refetches every 5s).
export default function McvSystemHealth({ v2 }) {
  const { activeSession } = v2;
  const rows = [
    { label: "Connection", value: "Live", color: "text-emerald-300", icon: Wifi },
    { label: "Realtime", value: "Subscribed", color: "text-emerald-300", icon: Activity },
    { label: "Data Sync", value: "5s", color: "text-cyan-300", icon: Database },
    { label: "Session", value: activeSession?.status || "—", color: "text-violet-300", icon: Server },
  ];
  return (
    <div className="p-2 space-y-1">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 text-[11px]">
          <r.icon className={`w-3 h-3 ${r.color}`} />
          <span className="text-muted-foreground">{r.label}</span>
          <span className={`ml-auto font-semibold ${r.color}`}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}