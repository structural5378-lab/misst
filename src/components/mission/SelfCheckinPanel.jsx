import React, { useState } from "react";
import { Mic } from "lucide-react";
import { CHECKIN_STATUSES } from "./helpers";

const QUICK = [
  { key: "checked_in", ...CHECKIN_STATUSES.checked_in },
  { key: "mobile", ...CHECKIN_STATUSES.mobile },
  { key: "base", ...CHECKIN_STATUSES.base },
  { key: "visitor", ...CHECKIN_STATUSES.visitor },
  { key: "emergency", ...CHECKIN_STATUSES.emergency },
  { key: "monitoring", ...CHECKIN_STATUSES.monitoring },
];

export default function SelfCheckinPanel({ onSubmit, user }) {
  const [status, setStatus] = useState("checked_in");
  const [callsign, setCallsign] = useState(user?.callsign || user?.username || user?.full_name || "");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);

  const submit = () => {
    if (!callsign.trim()) return;
    onSubmit({ callsign: callsign.trim(), location, notes, status, avatar: user?.avatar, user_id: user?.id });
    setDone(true);
    setNotes("");
    setTimeout(() => setDone(false), 2500);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950/60 via-card to-card border border-violet-500/25 p-6 text-center">
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="relative w-28 h-28 mx-auto mb-4">
          <span className="absolute inset-0 rounded-full bg-violet-500/30 mist-pulse-ring" />
          <span className="absolute inset-0 rounded-full bg-fuchsia-500/20 mist-pulse-ring" style={{ animationDelay: "0.6s" }} />
          <button
            onClick={submit}
            className="relative w-28 h-28 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex flex-col items-center justify-center shadow-2xl shadow-violet-500/40 border-2 border-white/20 active:scale-95 transition"
          >
            <Mic className={`w-9 h-9 text-white ${done ? "" : "drop-shadow-lg"}`} />
            <span className="text-[10px] font-black text-white tracking-wider mt-1">{done ? "SENT ✓" : "I'M HERE"}</span>
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{done ? "Request sent to Net Control" : "Tap to Check-in"}</p>

        <input
          value={callsign}
          onChange={(e) => setCallsign(e.target.value)}
          placeholder="Callsign"
          className="mt-4 w-full text-center rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-violet-500/50 outline-none"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location (City, State)"
          className="mt-2 w-full text-center rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-violet-500/50 outline-none"
        />

        <div className="grid grid-cols-3 gap-2 mt-3">
          {QUICK.map((q) => (
            <button
              key={q.key}
              onClick={() => setStatus(q.key)}
              className={`flex items-center justify-center gap-1 py-2 rounded-xl border text-[10px] font-bold transition active:scale-95 ${status === q.key ? `${q.bg} ${q.border} ${q.color}` : "bg-black/20 border-white/[0.06] text-muted-foreground"}`}
            >
              <q.Icon className="w-3 h-3" /> {q.label}
            </button>
          ))}
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional) — add any notes for Net Control…"
          rows={2}
          className="mt-2 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-violet-500/50 outline-none resize-none"
        />
      </div>
    </div>
  );
}