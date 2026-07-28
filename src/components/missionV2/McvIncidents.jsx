import React, { useState } from "react";
import { ChevronDown, Plus, Siren, Flag, HeartPulse, AlertTriangle } from "lucide-react";

// McvIncidents — collapsible incident/priority-traffic sections (right column
// top): Emergency, Priority, Welfare Checks, Active Incidents, with an inline
// log form for operators. Backed by NetIncident.
const SECTIONS = [
  { key: "emergency", label: "Emergency Traffic", icon: Siren, color: "text-rose-400", cats: ["emergency"] },
  { key: "priority", label: "Priority Traffic", icon: Flag, color: "text-orange-400", cats: ["priority"] },
  { key: "welfare", label: "Welfare Checks", icon: HeartPulse, color: "text-cyan-400", cats: ["medical", "general_note"] },
  { key: "active", label: "Active Incidents", icon: AlertTriangle, color: "text-amber-400", cats: ["weather", "equipment_failure", "repeater_offline"] },
];
const CATS = [["emergency", "Emer"], ["priority", "Pri"], ["medical", "Med"], ["weather", "Wx"], ["equipment_failure", "Equip"], ["repeater_offline", "Rptr"], ["general_note", "Note"]];

export default function McvIncidents({ v2 }) {
  const { incidents, isOperator, addIncident, removeIncident } = v2;
  const [open, setOpen] = useState({ emergency: true, priority: true, welfare: true, active: true });
  const [showForm, setShowForm] = useState(false);
  const [cat, setCat] = useState("general_note");
  const [notes, setNotes] = useState("");
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const submit = () => { if (!notes.trim()) return; addIncident(cat, notes); setNotes(""); setShowForm(false); };

  return (
    <div className="rounded-xl bg-[#15191e] border border-white/[0.06] p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Incidents / Priority Traffic</h3>
        {isOperator && <button onClick={() => setShowForm((v) => !v)} className="text-[10px] text-violet-400 font-semibold flex items-center gap-1"><Plus className="w-3 h-3" /> Log</button>}
      </div>
      {showForm && isOperator && (
        <div className="space-y-2 p-2 rounded-lg bg-white/[0.03]">
          <div className="flex flex-wrap gap-1">
            {CATS.map(([k, l]) => <button key={k} onClick={() => setCat(k)} className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${cat === k ? "bg-violet-500/20 text-violet-200 border-violet-500/30" : "text-muted-foreground border-white/10"}`}>{l}</button>)}
          </div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-lg bg-background border border-border px-2 py-1.5 text-xs focus:border-primary outline-none" placeholder="Incident notes…" />
          <button onClick={submit} disabled={!notes.trim()} className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold disabled:opacity-40">Log Incident</button>
        </div>
      )}
      {SECTIONS.map((sec) => {
        const items = incidents.filter((i) => sec.cats.includes(i.category));
        const isOpen = open[sec.key];
        return (
          <div key={sec.key} className="rounded-lg bg-white/[0.02]">
            <button onClick={() => toggle(sec.key)} className="w-full flex items-center gap-2 px-2 py-1.5">
              <sec.icon className={`w-3.5 h-3.5 ${sec.color}`} />
              <span className="text-xs font-semibold">{sec.label}</span>
              <span className={`ml-1 text-[10px] px-1.5 rounded-full ${items.length > 0 ? sec.color : "text-muted-foreground"} bg-white/5`}>{items.length}</span>
              <ChevronDown className={`w-3.5 h-3.5 ml-auto text-muted-foreground transition-transform ${isOpen ? "" : "-rotate-90"}`} />
            </button>
            {isOpen && items.length > 0 && (
              <div className="px-2 pb-2 space-y-1">
                {items.map((i) => (
                  <div key={i.id} className="text-[11px] p-1.5 rounded bg-background/40 flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground break-words">{i.notes}</p>
                      <p className="text-[10px] text-muted-foreground">{i.operator} · {i.timestamp ? new Date(i.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</p>
                    </div>
                    {isOperator && <button onClick={() => removeIncident(i.id)} className="text-[10px] text-muted-foreground hover:text-rose-400 shrink-0">✕</button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}