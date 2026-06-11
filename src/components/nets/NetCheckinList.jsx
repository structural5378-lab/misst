import React from "react";
import { Signal } from "lucide-react";

export default function NetCheckinList({ checkins }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
        <Signal className="w-4 h-4 text-emerald-400" />
        Stations Logged ({checkins.length})
      </h3>
      <div className="rounded-xl border border-white/[0.07] overflow-hidden">
        <div className="grid grid-cols-[32px_1fr_80px_70px] gap-0 bg-white/[0.03] px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide border-b border-white/[0.07]">
          <span>#</span>
          <span>Callsign / Location</span>
          <span>Signal</span>
          <span>Notes</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {checkins.map(c => (
            <div key={c.id} className="grid grid-cols-[32px_1fr_80px_70px] gap-0 px-3 py-2.5 items-center hover:bg-white/[0.02] transition-colors">
              <span className="text-xs font-bold text-emerald-400">#{c.checkin_number}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{c.callsign}</p>
                {c.location && <p className="text-[11px] text-muted-foreground">{c.location}</p>}
              </div>
              <span className="text-xs text-violet-300">{c.signal_report || "—"}</span>
              <span className="text-xs text-muted-foreground truncate">{c.notes || "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}