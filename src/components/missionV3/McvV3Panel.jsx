import React from "react";

// McvV3Panel — the shared glass panel shell for Mission Control V3: titled
// header (optional icon + right slot) and a body that can scroll. Used to wrap
// bare content (check-ins, analytics, quick actions); self-contained widgets
// (queue, weather, AI, map, traffic log) render their own cards and are placed
// directly in the layout without this wrapper.
export default function McvV3Panel({ title, icon, right, children, scroll, bodyClass = "", className = "" }) {
  return (
    <div className={`rounded-xl bg-[#12151b]/80 backdrop-blur-md border border-white/[0.06] flex flex-col min-h-0 overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] shrink-0">
          {icon}
          <h3 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{title}</h3>
          {right && <div className="ml-auto flex items-center gap-1">{right}</div>}
        </div>
      )}
      <div className={`${scroll ? "flex-1 min-h-0 overflow-y-auto" : ""} ${bodyClass}`}>{children}</div>
    </div>
  );
}