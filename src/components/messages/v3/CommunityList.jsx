import React, { useState } from "react";
import { Search, Plus, Bell, ChevronLeft, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import ConversationListV2 from "@/components/chatV2/ConversationListV2";

const LOGO = "https://media.base44.com/images/public/6a24d788be1af31b2258fab2/ef2f5095f_EA7D7629-51E2-49DA-AE8B-4017441D651F.png";

// CommunityList — the community-first left rail. Brand header, search,
// the user's communities (tap to enter that community's single conversation),
// a Direct Messages section, and a notifications link. Doubles as the mobile
// full-screen community picker.
export default function CommunityList({ mistUser, communities, community, onSelectCommunity, conversations, dmLoading, presenceByUser, sel, onSelectDM, onNewMessage, totalDMUnread, onBack, showBack }) {
  const [q, setQ] = useState("");
  const filtered = (communities || []).filter((c) => !q || (c.name || "").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex flex-col h-full min-h-0 bg-card/40 backdrop-blur-xl">
      <header className="flex items-center gap-2 px-3 h-14 shrink-0 border-b border-border">
        {showBack && <button onClick={onBack} className="xl:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground" aria-label="Back"><ChevronLeft className="w-5 h-5" /></button>}
        <img src={LOGO} alt="MISST" className="w-6 h-6 object-contain shrink-0 drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]" />
        <span className="text-sm font-extrabold tracking-[0.2em] text-violet-300 uppercase hidden sm:inline">MISST</span>
        <Link to="/notifications" className="ml-auto p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground relative" aria-label="Notifications"><Bell className="w-5 h-5" /></Link>
        <button onClick={onNewMessage} className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white active:scale-95 transition" aria-label="New message"><Plus className="w-4 h-4" /></button>
      </header>

      <div className="px-3 pt-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search communities…" className="w-full rounded-xl bg-secondary/50 border border-border pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
      </div>

      <div className="px-3 pt-3 pb-1 shrink-0 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Communities</div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filtered.length === 0 ? <p className="px-4 py-6 text-xs text-muted-foreground text-center">No communities found.</p> : filtered.map((c) => {
          const active = community?.id === c.id && sel?.type === "community";
          return (
            <button key={c.id} onClick={() => onSelectCommunity(c.id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${active ? "bg-primary/10" : "hover:bg-muted/30"}`}>
              {c.logo_url ? <img src={c.logo_url} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" /> : <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center text-sm font-bold shrink-0">{(c.name || "C")[0]}</div>}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{c.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{c.member_count || 0} members</p>
              </div>
              {active && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
            </button>
          );
        })}
      </div>

      <div className="shrink-0 border-t border-border">
        <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <MessageCircle className="w-3 h-3" />Direct Messages
          {!!totalDMUnread && <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1.5">{totalDMUnread > 9 ? "9+" : totalDMUnread}</span>}
        </div>
        <div className="max-h-52 overflow-y-auto">
          <ConversationListV2 conversations={conversations} activeId={sel?.type === "dm" ? sel.id : null} onSelect={onSelectDM} presenceByUser={presenceByUser} myId={mistUser?.id} loading={dmLoading} />
        </div>
      </div>
    </div>
  );
}