import React from "react";
import { statusConfig } from "@/components/mission/helpers";
import McvSignalIcon from "./McvSignalIcon";

// McvCheckins — grid of check-in cards (left column). Each card shows avatar,
// callsign/name, status + number + station-type tags, join time, signal meter,
// and approve/edit actions for operators.
export default function McvCheckins({ checkins, isOperator, onApprove, onEditStatus }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {checkins.map((c) => {
        const sc = statusConfig(c.status);
        const pending = c.approved === false;
        return (
          <div key={c.id} className={`rounded-xl bg-[#15191e] border border-white/[0.06] p-2.5 ${pending ? "ring-1 ring-amber-500/40" : ""}`}>
            <div className="flex items-center gap-2">
              {c.avatar ? <img src={c.avatar} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-[11px] font-bold text-violet-300">{(c.callsign || "?").charAt(0)}</div>}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">{c.callsign}</p>
                <p className="text-[10px] text-muted-foreground truncate">{c.name || c.location || "—"}</p>
              </div>
              <McvSignalIcon report={c.signal_report} />
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.color} border ${sc.border}`}>{sc.label}</span>
              {c.checkin_number ? <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/10">#{c.checkin_number}</span> : null}
              {(c.status === "base" || c.status === "mobile") && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/10 capitalize">{c.status}</span>}
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
              <span>Joined {c.checked_in_at ? new Date(c.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
              {pending && isOperator && <button onClick={() => onApprove(c)} className="text-emerald-400 font-semibold">Approve</button>}
              {!pending && isOperator && <button onClick={() => onEditStatus(c)} className="text-violet-400">Edit</button>}
            </div>
          </div>
        );
      })}
      {checkins.length === 0 && <p className="text-xs text-muted-foreground col-span-full text-center py-6">No check-ins yet.</p>}
    </div>
  );
}