import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Radio, Users, Home } from "lucide-react";

// CommunityHeader — compact premium header shown above the conversation.
// Avatar · name · member count · online count · linked-repeater status.
// Tapping the body opens the community info panel (not a room switcher).
export default function CommunityHeader({ community, memberCount, onlineCount, repeaterLinked, onOpenInfo, onBack }) {
  const navigate = useNavigate();
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
            ? <img src={community.logo_url} alt="" className="w-9 h-9 rounded-xl object-cover" />
            : <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center text-sm font-bold">{(community?.name || "C")[0]}</div>}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-bold truncate leading-tight">{community?.name || "Community"}</h1>
          <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground leading-tight">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{memberCount}</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{onlineCount} online</span>
            <span className={`flex items-center gap-1 ${repeaterLinked ? "text-emerald-400" : "text-muted-foreground/70"}`}><Radio className="w-3 h-3" />{repeaterLinked ? "Linked" : "No Repeater"}</span>
          </div>
        </div>
      </button>
      <button onClick={() => navigate("/")} className="shrink-0 p-2 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors" aria-label="Back to dashboard" title="Back to dashboard">
        <Home className="w-5 h-5" />
      </button>
    </header>
  );
}