import React from "react";
import { TIMELINE_ICONS } from "./helpers";

export default function MissionTimeline({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-2xl bg-card/60 border border-white/[0.06] p-10 text-center">
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      </div>
    );
  }
  const sorted = [...events].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  return (
    <div className="relative pl-5">
      <div className="absolute left-[7px] top-1 bottom-1 w-px bg-gradient-to-b from-violet-500/40 via-white/[0.06] to-transparent" />
      <div className="space-y-3">
        {sorted.map((e) => {
          const t = TIMELINE_ICONS[e.event_type] || TIMELINE_ICONS.note;
          return (
            <div key={e.id} className="relative msg-in flex items-start gap-3">
              <div className={`absolute -left-5 top-1 w-3.5 h-3.5 rounded-full ${t.bg} border border-white/10 flex items-center justify-center`}>
                <t.Icon className={`w-2 h-2 ${t.color}`} />
              </div>
              <div className="flex-1 ml-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {e.created_date && new Date(e.created_date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-sm text-foreground mt-0.5">{e.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}