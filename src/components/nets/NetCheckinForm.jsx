import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function NetCheckinForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ callsign: "", location: "", signal_report: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.callsign.trim()) return;
    setSaving(true);
    await onSubmit(form);
    setSaving(false);
    setForm({ callsign: "", location: "", signal_report: "", notes: "" });
  };

  return (
    <div className="p-4 rounded-2xl bg-white/[0.04] border border-emerald-500/30 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-foreground">Log Station Check-in</h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Callsign *</label>
        <input
          autoFocus
          value={form.callsign}
          onChange={e => set("callsign", e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          placeholder="e.g. WQXY123"
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Location</label>
          <input
            value={form.location}
            onChange={e => set("location", e.target.value)}
            placeholder="City, State"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Signal Report</label>
          <input
            value={form.signal_report}
            onChange={e => set("signal_report", e.target.value)}
            placeholder="5x5, Q5…"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
        <input
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
          placeholder="Optional"
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={saving || !form.callsign.trim()}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {saving ? "Logging…" : "✓ Log Check-in"}
      </Button>
    </div>
  );
}