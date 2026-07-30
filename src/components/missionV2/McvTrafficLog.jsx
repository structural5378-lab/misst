import React, { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { TIMELINE_ICONS } from "@/components/mission/helpers";

// McvTrafficLog — live traffic log. Enhanced for V3: severity-colored messages,
// auto-scroll-to-latest (disabled when `paused`), controlled `query` search,
// and a `bare` mode for embedding in McvPanelChrome. Filter chips retained.
// Backward compatible (defaults preserve the original usage).
const FILTERS = [["all", "All"], ["my", "My Traffic"], ["priority", "Priority"], ["system", "System"]];
const SEVERITY = {
  emergency: "text-rose-400", priority: "text-amber-400",
  net_started: "text-emerald-400", net_resumed: "text-emerald-400",
  net_paused: "text-amber-400", net_closed: "text-rose-400",
  note: "text-muted-foreground",
};

export default function McvTrafficLog({ v2, full, bare, query = "", paused = false }) {
  const { timeline, user } = v2;
  const [filter, setFilter] = useState("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef(null);
  const uid = user?.uid || user?.id;

  const filtered = timeline
    .filter((e) => {
      if (filter === "my") return e.actor_id && e.actor_id === uid;
      if (filter === "priority") return e.event_type === "priority" || e.event_type === "emergency";
      if (filter === "system") return ["net_started", "net_paused", "net_resumed", "net_closed", "note"].includes(e.event_type);
      return true;
    })
    .filter((e) => !query.trim() || (e.message || "").toLowerCase().includes(query.toLowerCase()) || (e.actor_name || "").toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (autoScroll && !paused && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [filtered.length, autoScroll, paused]);

  const body = (
    <div ref={scrollRef} className="overflow-y-auto p-2 space-y-1 flex-1 min-h-0">
      {filtered.length === 0 ? <p className="text-xs text-muted-foreground text-center py-6">No traffic yet.</p> : filtered.map((e) => {
        const ti = TIMELINE_ICONS[e.event_type] || TIMELINE_ICONS.note;
        const sev = SEVERITY[e.event_type] || "text-muted-foreground";
        return (
          <div key={e.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.03]">
            <span className="text-[10px] text-muted-foreground tabular-nums w-14 shrink-0">{e.created_date ? new Date(e.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : ""}</span>
            {e.actor_avatar ? <img src={e.actor_avatar} className="w-6 h-6 rounded-full object-cover shrink-0" /> : <div className={`w-6 h-6 rounded-full ${ti.bg} flex items-center justify-center shrink-0`}><ti.Icon className={`w-3 h-3 ${ti.color}`} /></div>}
            <div className="min-w-0 flex-1"><p className="text-xs"><span className="font-semibold text-foreground">{e.actor_name || "System"}</span> <span className={sev}>{e.message}</span></p></div>
            <Play className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          </div>
        );
      })}
    </div>
  );

  if (bare) return <div className="h-full min-h-0 flex flex-col">{body}</div>;

  return (
    <div className="rounded-xl bg-[#15191e] border border-white/[0.06] flex flex-col h-full min-h-0">
      <div className="flex items-center gap-1 px-2 py-2 border-b border-white/[0.06]">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground px-1 hidden sm:block">Live Traffic Log</h3>
        <div className="flex gap-1 sm:ml-auto">
          {FILTERS.map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`px-2 py-1 rounded-md text-[10px] font-semibold ${filter === k ? "bg-violet-500/20 text-violet-200" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>
          ))}
        </div>
      </div>
      {body}
    </div>
  );
}