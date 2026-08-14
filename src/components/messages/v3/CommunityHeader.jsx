import React from "react";
import { ChevronLeft, RadioTower, MoreVertical, Check } from "lucide-react";

// CommunityHeader — compact premium header shown above the conversation.
// Back · circular group icon · name · online count · linked-repeater badge · menu.
// Tapping the body opens the community info panel.
export default function CommunityHeader({ community, memberCount, onlineCount, repeaterLinked, onOpenInfo, onBack }) {
  return (
    <header className="shrink-0 flex items-center gap-2.5 px-3 h-14 border-b border-border bg-background/70 backdrop-blur-xl">
      {onBack && (
        <button onClick={onBack} className="xl:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground" aria-label="Back">
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      <button onClick={onOpenInfo} className="flex items-center gap-2.5 min-w-0 flex-1 text-left active:scale-[0.99] transition-transform">
        <div className="shrink-0">
          {community?.logo_url
            ? <img src={community.logo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
            : <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold">{(community?.name || "C")[0]}</div>}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-bold text-foreground truncate leading-tight">{community?.name || "Community"}</h1>
          <p className="text-[11px] text-muted-foreground leading-tight flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{onlineCount} online
          </p>
        </div>
      </button>
      <div className="shrink-0 flex items-center gap-1">
        <div className="relative">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${repeaterLinked ? "bg-primary/10 text-primary" : "bg-muted/40 text-muted-foreground"}`}>
            <RadioTower className="w-5 h-5" />
          </div>
          {repeaterLinked && (
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-white" />
            </span>
          )}
        </div>
        <button onClick={onOpenInfo} className="p-2 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors" aria-label="More">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}