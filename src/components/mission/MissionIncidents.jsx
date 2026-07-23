import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CloudRain, Siren, Flag, Wrench, RadioTower, HeartPulse, StickyNote, Plus } from "lucide-react";

const CATS = {
  weather: { label: "Weather Report", Icon: CloudRain, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30", sev: "warning" },
  emergency: { label: "Emergency Traffic", Icon: Siren, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", sev: "critical" },
  priority: { label: "Priority Traffic", Icon: Flag, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", sev: "warning" },
  equipment_failure: { label: "Equipment Failure", Icon: Wrench, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", sev: "warning" },
  repeater_offline: { label: "Repeater Offline", Icon: RadioTower, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", sev: "critical" },
  medical: { label: "Medical", Icon: HeartPulse, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", sev: "critical" },
  general_note: { label: "General Note", Icon: StickyNote, color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/30", sev: "info" },
};

const SEV = { info: "border-l-slate-500", warning: "border-l-amber-500", critical: "border-l-rose-500" };

export default function MissionIncidents({ session, isOperator, user }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ category: "general_note", notes: "" });

  const { data: incidents = [] } = useQuery({
    queryKey: ["net-incidents", session?.id],
    queryFn: () => base44.entities.NetIncident.filter({ session_id: session.id }, "-timestamp", 200),
    enabled: !!session?.id,
  });

  const add = async () => {
    if (!form.notes.trim()) return;
    const cat = CATS[form.category];
    await base44.entities.NetIncident.create({
      session_id: session.id, net_id: session.net_id, category: form.category, notes: form.notes.trim(),
      severity: cat.sev, operator: user?.callsign || user?.username || user?.full_name || "Net Control",
      operator_id: user?.uid || user?.id || "", timestamp: new Date().toISOString(),
    });
    try {
      await base44.entities.NetTimeline.create({
        session_id: session.id, net_id: session.net_id,
        event_type: form.category === "emergency" ? "emergency" : form.category === "priority" ? "priority" : "note",
        message: `${cat.label}: ${form.notes.trim()}`, actor_name: user?.callsign || user?.username || "",
      });
    } catch {}
    setForm({ category: "general_note", notes: "" });
    qc.invalidateQueries({ queryKey: ["net-incidents", session.id] });
  };

  const remove = async (id) => {
    await base44.entities.NetIncident.delete(id);
    qc.invalidateQueries({ queryKey: ["net-incidents", session.id] });
  };

  return (
    <div className="space-y-3">
      {isOperator && (
        <div className="rounded-2xl bg-card/60 border border-white/[0.06] p-3">
          <div className="flex gap-1.5 flex-wrap mb-2">
            {Object.entries(CATS).map(([k, c]) => (
              <button key={k} onClick={() => setForm((f) => ({ ...f, category: k }))} className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border ${form.category === k ? `${c.bg} ${c.border} ${c.color}` : "bg-muted text-muted-foreground border-border"}`}>
                <c.Icon className="w-3 h-3" /> {c.label}
              </button>
            ))}
          </div>
          <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Incident notes…" rows={2} className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          <button onClick={add} disabled={!form.notes.trim()} className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"><Plus className="w-3.5 h-3.5" /> Log Incident</button>
        </div>
      )}
      {incidents.length === 0 ? (
        <div className="rounded-2xl bg-card/60 border border-white/[0.06] p-6 text-center text-sm text-muted-foreground">No incidents logged.</div>
      ) : (
        incidents.map((inc) => {
          const c = CATS[inc.category] || CATS.general_note;
          return (
            <div key={inc.id} className={`rounded-2xl bg-card/60 border border-white/[0.06] border-l-4 ${SEV[inc.severity] || SEV.info} p-3 flex items-start gap-3`}>
              <div className={`p-2 rounded-lg ${c.bg} ${c.border} border`}><c.Icon className={`w-4 h-4 ${c.color}`} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs font-bold ${c.color}`}>{c.label}</p>
                  <span className="text-[10px] text-muted-foreground">{inc.timestamp ? new Date(inc.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                </div>
                <p className="text-sm text-foreground mt-0.5 break-words">{inc.notes}</p>
                <p className="text-[10px] text-muted-foreground mt-1">by {inc.operator || "—"}</p>
              </div>
              {isOperator && <button onClick={() => remove(inc.id)} className="text-[10px] text-muted-foreground hover:text-destructive shrink-0">Remove</button>}
            </div>
          );
        })
      )}
    </div>
  );
}