import React from "react";
import { Check, MapPin } from "lucide-react";
import { statusConfig, fmtDistance } from "./helpers";

export default function MissionCheckinList({ checkins, isOperator, onApprove, onEditStatus }) {
  if (!checkins || checkins.length === 0) {
    return (
      <div className="rounded-2xl bg-card/60 border border-white/[0.06] p-10 text-center">
        <p className="text-sm text-muted-foreground">No check-ins yet. Waiting for operators…</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {checkins.map((c) => {
        const cfg = statusConfig(c.status);
        const pending = c.approved === false;
        return (
          <div
            key={c.id}
            onClick={() => !pending && isOperator && onEditStatus?.(c)}
            className={`msg-in flex items-center gap-3 p-3 rounded-2xl bg-card/60 border ${pending ? "border-yellow-500/40 bg-yellow-500/[0.04]" : "border-white/[0.06]"} backdrop-blur-md ${!pending && isOperator ? "cursor-pointer hover:border-violet-500/30 active:scale-[0.99] transition" : ""}`}
          >
            <div className="relative shrink-0">
              {c.avatar ? (
                <img src={c.avatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-sm font-bold text-violet-300">
                  {(c.callsign || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-card ${cfg.dot}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground truncate">{c.callsign}</p>
                {c.name && c.name !== c.callsign && <span className="text-xs text-muted-foreground truncate">{c.name}</span>}
                {c.is_guest && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">Guest</span>}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                {c.location && <span className="flex items-center gap-0.5 truncate"><MapPin className="w-2.5 h-2.5" />{c.location}</span>}
                {fmtDistance(c.distance) && <span>· {fmtDistance(c.distance)}</span>}
                {c.signal_report && <span>· {c.signal_report}</span>}
                {c.checked_in_at && <span>· {new Date(c.checked_in_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>}
              </div>
              {c.notes && <p className="text-[11px] text-muted-foreground/80 mt-1 italic line-clamp-1">“{c.notes}”</p>}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color} flex items-center gap-1`}>
                <cfg.Icon className="w-2.5 h-2.5" /> {cfg.label}
              </span>
              {pending && isOperator && (
                <button
                  onClick={() => onApprove(c)}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 active:scale-95 transition"
                >
                  <Check className="w-3 h-3 inline -mt-0.5" /> Approve
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}