import React from "react";
import { fmtRuntime } from "../missionV2/runtime";

// McvMissionStats — compact stat grid for the left sidebar (participants, queue,
// repeaters, late, priority, runtime). Denser than the full analytics strip.
export default function McvMissionStats({ v2 }) {
  const { approved, activeQueue, metrics, runtimeMs, repeater } = v2;
  const items = [
    ["Participants", approved.length],
    ["Queue", activeQueue.length],
    ["Repeaters", repeater ? 1 : 0],
    ["Late", metrics.late],
    ["Priority", metrics.priority],
    ["Runtime", fmtRuntime(runtimeMs)],
  ];
  return (
    <div className="grid grid-cols-3 gap-1.5 p-2">
      {items.map(([l, v]) => (
        <div key={l} className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-2 py-1.5 text-center">
          <p className="text-sm font-extrabold text-foreground tabular-nums leading-tight">{v}</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{l}</p>
        </div>
      ))}
    </div>
  );
}