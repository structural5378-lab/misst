import React from "react";
import { X } from "lucide-react";
import { CHECKIN_STATUSES } from "./helpers";

export default function MissionStatusSheet({ checkin, onUpdate, onClose }) {
  const STATUSES = Object.entries(CHECKIN_STATUSES).filter(([k]) => k !== "pending");
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-card border border-violet-500/20 rounded-t-3xl p-5 sheet-up" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-foreground">{checkin.callsign}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Update check-in status</p>
        <div className="grid grid-cols-2 gap-2">
          {STATUSES.map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => onUpdate(key)}
              className={`flex items-center gap-2 py-3 px-3 rounded-xl border text-sm font-bold transition active:scale-95 ${checkin.status === key ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "bg-black/20 border-white/[0.06] text-muted-foreground hover:text-foreground"}`}
            >
              <cfg.Icon className="w-4 h-4" /> {cfg.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}