import React from "react";
import { Maximize2, ChevronRight } from "lucide-react";

// McvPanelChrome — the standardized V3 panel: consistent radius, shadow,
// border, and a dense header (title + icon + optional right slot + fullscreen
// + collapse buttons). `scroll` makes the body scroll; `fill` makes it fill
// (for widgets that manage their own internal scroll). Replaces ad-hoc card
// wrappers so every panel shares one look.
export default function McvPanelChrome({ title, icon, right, onFullscreen, onCollapse, scroll, fill, bodyClass = "", className = "", children }) {
  return (
    <div className={`rounded-xl bg-[#12151b]/80 backdrop-blur-md border border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.25)] flex flex-col min-h-0 overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-3 h-9 border-b border-white/[0.06] shrink-0">
        {icon}
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground truncate">{title}</h3>
        {right ? <div className="ml-auto flex items-center gap-1 min-w-0">{right}</div> : <div className="ml-auto" />}
        {onFullscreen && <button onClick={onFullscreen} title="Fullscreen" aria-label={`Fullscreen ${title}`} className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"><Maximize2 className="w-3.5 h-3.5" /></button>}
        {onCollapse && <button onClick={onCollapse} title="Collapse" aria-label={`Collapse ${title}`} className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>}
      </div>
      <div className={`${scroll ? "flex-1 min-h-0 overflow-y-auto" : fill ? "flex-1 min-h-0" : ""} ${bodyClass}`}>{children}</div>
    </div>
  );
}