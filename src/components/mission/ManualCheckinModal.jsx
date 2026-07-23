import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, X, UserPlus } from "lucide-react";
import { CHECKIN_STATUSES } from "./helpers";

const STATUSES = Object.entries(CHECKIN_STATUSES).filter(([k]) => k !== "pending");

export default function ManualCheckinModal({ onSubmit, onClose }) {
  const [callsign, setCallsign] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("checked_in");
  const [signal, setSignal] = useState("");
  const [notes, setNotes] = useState("");
  const [distance, setDistance] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      if (query.trim().length < 2) return setResults([]);
      try {
        const users = await base44.entities.User.list("-created_date", 20);
        if (!active) return;
        const q = query.toLowerCase();
        setResults((users || []).filter((u) => (u.full_name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)).slice(0, 6));
      } catch {
        setResults([]);
      }
    }, 250);
    return () => { active = false; clearTimeout(t); };
  }, [query]);

  const submit = () => {
    if (!callsign.trim()) return;
    onSubmit({ callsign: callsign.trim(), name: name.trim(), location, status, signal_report: signal, notes, distance: distance ? parseFloat(distance) : null, is_guest: isGuest });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-card border border-violet-500/20 rounded-t-3xl sm:rounded-3xl p-5 sheet-up max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-foreground">Manual Check-in</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members by name or email…"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/30 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-violet-500/50 outline-none"
          />
          {results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-xl bg-popover border border-border shadow-xl overflow-hidden">
              {results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { setCallsign(u.full_name || ""); setName(u.full_name || ""); setQuery(""); setResults([]); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center text-xs font-bold text-violet-300">{(u.full_name || "?").charAt(0)}</div>
                  <span className="text-sm text-foreground">{u.full_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input value={callsign} onChange={(e) => setCallsign(e.target.value)} placeholder="Callsign *" className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-violet-500/50 outline-none" />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-violet-500/50 outline-none" />
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="col-span-2 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-violet-500/50 outline-none" />
          <input value={signal} onChange={(e) => setSignal(e.target.value)} placeholder="Signal (5x5)" className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-violet-500/50 outline-none" />
          <input value={distance} onChange={(e) => setDistance(e.target.value)} type="number" placeholder="Distance (mi)" className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-violet-500/50 outline-none" />
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {STATUSES.map(([key, cfg]) => (
            <button key={key} onClick={() => setStatus(key)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition ${status === key ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "bg-black/20 border-white/[0.06] text-muted-foreground"}`}>
              <cfg.Icon className="w-3 h-3" /> {cfg.label}
            </button>
          ))}
        </div>

        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes…" rows={2} className="mt-2 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-violet-500/50 outline-none resize-none" />

        <label className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <input type="checkbox" checked={isGuest} onChange={(e) => setIsGuest(e.target.checked)} className="accent-violet-500" />
          Guest / Visitor operator (not a registered member)
        </label>

        <button onClick={submit} disabled={!callsign.trim()} className="mt-4 w-full py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold text-sm disabled:opacity-40 active:scale-95 transition flex items-center justify-center gap-2">
          <UserPlus className="w-4 h-4" /> Check In Operator
        </button>
      </div>
    </div>
  );
}