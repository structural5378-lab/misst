import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, LayoutTemplate, Radio } from "lucide-react";
import AdminSection from "@/components/platform/AdminSection";

const CATS = ["general", "emergency", "technical", "social", "training"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const inputCls = "w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";

export default function PlatformAdminNetTemplates() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", category: "general", frequency: "", repeater_callsign: "", default_net_control: "", schedule: "Weekly", day_of_week: "Monday", time: "", description: "" });
  const [saving, setSaving] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ["net-templates"],
    queryFn: () => base44.entities.NetTemplate.list("-created_date", 200),
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const create = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await base44.entities.NetTemplate.create({
        ...form,
        frequency: form.frequency ? parseFloat(form.frequency) : null,
      });
      setForm({ name: "", category: "general", frequency: "", repeater_callsign: "", default_net_control: "", schedule: "Weekly", day_of_week: "Monday", time: "", description: "" });
      qc.invalidateQueries({ queryKey: ["net-templates"] });
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    await base44.entities.NetTemplate.delete(id);
    qc.invalidateQueries({ queryKey: ["net-templates"] });
  };

  return (
    <AdminSection title="Net Templates" description="Reusable net configurations for quick scheduling and recurring nets.">
      <div className="rounded-xl bg-card border border-border p-4 mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> New Template</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <input className={inputCls} placeholder="Template name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          <select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)}>
            {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input className={inputCls} placeholder="Frequency (MHz)" value={form.frequency} onChange={(e) => set("frequency", e.target.value)} />
          <input className={inputCls} placeholder="Repeater callsign" value={form.repeater_callsign} onChange={(e) => set("repeater_callsign", e.target.value)} />
          <input className={inputCls} placeholder="Default net control" value={form.default_net_control} onChange={(e) => set("default_net_control", e.target.value)} />
          <input className={inputCls} placeholder="Time (e.g. 8:00 PM EST)" value={form.time} onChange={(e) => set("time", e.target.value)} />
          <select className={inputCls} value={form.schedule} onChange={(e) => set("schedule", e.target.value)}>
            <option>Daily</option><option>Weekly</option><option>Mon/Wed/Fri</option><option>Monthly</option>
          </select>
          <select className={inputCls} value={form.day_of_week} onChange={(e) => set("day_of_week", e.target.value)}>
            {DAYS.map((d) => <option key={d}>{d}</option>)}
          </select>
          <input className={inputCls} placeholder="Description" value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <button onClick={create} disabled={saving || !form.name} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
          <Plus className="w-4 h-4" /> {saving ? "Saving…" : "Create Template"}
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl bg-card border border-border p-8 text-center">
          <LayoutTemplate className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No templates yet. Create one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-xl bg-card border border-border p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-primary" />
                  <p className="text-sm font-bold text-foreground">{t.name}</p>
                </div>
                <button onClick={() => remove(t.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                <p>Category: <span className="text-foreground">{t.category}</span></p>
                {t.frequency && <p>Frequency: <span className="text-foreground">{t.frequency} MHz</span></p>}
                {t.repeater_callsign && <p>Repeater: <span className="text-foreground">{t.repeater_callsign}</span></p>}
                {t.default_net_control && <p>Net Control: <span className="text-foreground">{t.default_net_control}</span></p>}
                <p>Schedule: <span className="text-foreground">{t.schedule}{t.day_of_week ? ` · ${t.day_of_week}` : ""}{t.time ? ` · ${t.time}` : ""}</span></p>
                {t.description && <p className="pt-1">{t.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminSection>
  );
}