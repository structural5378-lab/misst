import React, { useState } from "react";
import { ChevronDown, MapPin, Clock } from "lucide-react";
import McvSignalIcon from "../missionV2/McvSignalIcon";
import { statusConfig } from "../mission/helpers";

// McvMobileStations — mobile "Stations" tab: large touch cards with tap-to-
// expand details (status badge, location, join time). Built for fingers, not
// a dense table.
export default function McvMobileStations({ checkins }) {
  const [open, setOpen] = useState(null);
  if (checkins.length === 0) return <p className="text-sm text-muted-foreground text-center py-10">No active stations.</p>;
  return (
    <div className="space-y-2">
      {checkins.map((c) => {
        const sc = statusConfig(c.status);
        const isOpen = open === c.id;
        return (
          <div key={c.id} className="rounded-xl bg-[#12151b] border border-white/[0.06] overflow-hidden">
            <button onClick={() => setOpen(isOpen ? null : c.id)} className="w-full flex items-center gap-3 p-3">
              {c.avatar ? <img src={c.avatar} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-300">{(c.callsign || "?").charAt(0)}</div>}
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sm font-bold truncate">{c.callsign}</p>
                <p className="text-[11px] text-muted-foreground truncate">{c.name || c.location || "—"}</p>
              </div>
              <McvSignalIcon report={c.signal_report} />
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <div className="px-3 pb-3 space-y-2 text-xs">
                <div className="flex flex-wrap gap-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${sc.bg} ${sc.color} border ${sc.border}`}>{sc.label}</span>
                  {c.checkin_number && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/10">#{c.checkin_number}</span>}
                </div>
                <Row icon={MapPin} label="Location" value={c.location || "—"} />
                <Row icon={Clock} label="Joined" value={c.checked_in_at ? new Date(c.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return <div className="flex items-center gap-2 text-muted-foreground"><Icon className="w-3.5 h-3.5" />{label}: <span className="text-foreground font-semibold">{value}</span></div>;
}