import React, { useState } from "react";
import { X } from "lucide-react";

// McvManualCheckin — modal for late / manual check-ins (Quick Action). Submits
// through the shared manualCheckin action on the V2 hook.
const STATUSES = ["late", "checked_in", "mobile", "base", "visitor", "priority", "emergency"];

export default function McvManualCheckin({ onSubmit, onClose }) {
  const [form, setForm] = useState({ callsign: "", name: "", location: "", status: "late", signal_report: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async () => {
    if (!form.callsign.trim() || busy) return;
    setBusy(true);
    try { await onSubmit(form); } catch {} finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold">Late / Manual Check-In</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-2">
          <input value={form.callsign} onChange={(e) => set("callsign", e.target.value.toUpperCase())} placeholder="Callsign *" className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-primary outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Name" className="px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-primary outline-none" />
            <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Location" className="px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-primary outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.signal_report} onChange={(e) => set("signal_report", e.target.value)} placeholder="Signal (5x5)" className="px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-primary outline-none" />
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className="px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-primary outline-none">
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
          </div>
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Notes" className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-primary outline-none" />
          <button onClick={submit} disabled={!form.callsign.trim() || busy} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2">
            {busy ? <><span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Saving…</> : "Add Check-In"}
          </button>
        </div>
      </div>
    </div>
  );
}