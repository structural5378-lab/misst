import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Plus, Copy, Trash2 } from "lucide-react";
import AdminSection from "@/components/platform/AdminSection";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const CATS = ["general", "emergency", "technical", "social", "training"];
const inputCls = "w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";

function parseTime(t) {
  if (!t) return [20, 0];
  const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return [20, 0];
  let h = parseInt(m[1]); const min = parseInt(m[2]);
  const ap = (m[3] || "").toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return [h, min];
}

function nextOccurrence(dayOfWeek, time) {
  const now = new Date();
  const target = DAYS.indexOf(dayOfWeek);
  if (target < 0) return null;
  const [h, m] = parseTime(time);
  const d = new Date(now);
  const diff = (target - now.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  d.setHours(h, m, 0, 0);
  if (d <= now) d.setDate(d.getDate() + 7);
  return d;
}

export default function PlatformAdminScheduledNets() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", category: "general", frequency: "", repeater_callsign: "", net_control: "", schedule: "Weekly", day_of_week: "Monday", time: "8:00 PM" });
  const [saving, setSaving] = useState(false);

  const { data: nets = [] } = useQuery({
    queryKey: ["admin-all-nets"],
    queryFn: () => base44.entities.Net.list("-created_date", 500),
  });

  const scheduled = useMemo(() => nets.filter((n) => n.schedule || n.time), [nets]);
  const upcoming = useMemo(
    () => scheduled
      .map((n) => ({ n, next: nextOccurrence(n.day_of_week, n.time) }))
      .filter((x) => x.next)
      .sort((a, b) => a.next - b.next),
    [scheduled]
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const create = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await base44.entities.Net.create({
        name: form.name, category: form.category,
        frequency: form.frequency ? parseFloat(form.frequency) : null,
        repeater_callsign: form.repeater_callsign, net_control: form.net_control,
        schedule: form.schedule, day_of_week: form.day_of_week, time: form.time,
      });
      setForm({ name: "", category: "general", frequency: "", repeater_callsign: "", net_control: "", schedule: "Weekly", day_of_week: "Monday", time: "8:00 PM" });
      qc.invalidateQueries({ queryKey: ["admin-all-nets"] });
    } finally { setSaving(false); }
  };

  const duplicate = async (n) => {
    const { id, created_date, updated_date, created_by_id, is_sample, ...rest } = n;
    await base44.entities.Net.create({ ...rest, name: `${n.name} (Copy)` });
    qc.invalidateQueries({ queryKey: ["admin-all-nets"] });
  };

  const cancel = async (id) => {
    await base44.entities.Net.delete(id);
    qc.invalidateQueries({ queryKey: ["admin-all-nets"] });
  };

  return (
    <AdminSection title="Scheduled Nets" description="Upcoming and recurring net schedule with duplication and cancellation.">
      <div className="rounded-xl bg-card border border-border p-4 mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Schedule a Net</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input className={inputCls} placeholder="Net name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          <select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
          <input className={inputCls} placeholder="Frequency (MHz)" value={form.frequency} onChange={(e) => set("frequency", e.target.value)} />
          <input className={inputCls} placeholder="Repeater callsign" value={form.repeater_callsign} onChange={(e) => set("repeater_callsign", e.target.value)} />
          <input className={inputCls} placeholder="Net control" value={form.net_control} onChange={(e) => set("net_control", e.target.value)} />
          <select className={inputCls} value={form.schedule} onChange={(e) => set("schedule", e.target.value)}><option>Daily</option><option>Weekly</option><option>Mon/Wed/Fri</option><option>Monthly</option></select>
          <select className={inputCls} value={form.day_of_week} onChange={(e) => set("day_of_week", e.target.value)}>{DAYS.map((d) => <option key={d}>{d}</option>)}</select>
          <input className={inputCls} placeholder="Time (8:00 PM)" value={form.time} onChange={(e) => set("time", e.target.value)} />
        </div>
        <button onClick={create} disabled={saving || !form.name} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
          <Plus className="w-4 h-4" /> {saving ? "Saving…" : "Schedule Net"}
        </button>
      </div>

      <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><CalendarClock className="w-4 h-4 text-primary" /> Upcoming</h3>
      {upcoming.length === 0 ? (
        <div className="rounded-xl bg-card border border-border p-8 text-center text-sm text-muted-foreground">No scheduled nets. Create one above.</div>
      ) : (
        <div className="space-y-2">
          {upcoming.map(({ n, next }) => (
            <div key={n.id} className="rounded-xl bg-card border border-border p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{n.name}</p>
                <p className="text-xs text-muted-foreground">{n.schedule} · {n.day_of_week || ""} · {n.time || ""} {n.repeater_callsign ? `· ${n.repeater_callsign}` : ""} {n.net_control ? `· NC: ${n.net_control}` : ""}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-primary whitespace-nowrap">
                  {next.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} {next.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </span>
                <button onClick={() => duplicate(n)} className="p-1.5 text-muted-foreground hover:text-primary" title="Duplicate"><Copy className="w-4 h-4" /></button>
                <button onClick={() => cancel(n.id)} className="p-1.5 text-muted-foreground hover:text-destructive" title="Cancel"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminSection>
  );
}