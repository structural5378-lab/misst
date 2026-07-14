import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Bell, Calendar, Radio, X } from "lucide-react";
import AdminSection from "@/components/platform/AdminSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function PlatformAdminContent() {
  const [tab, setTab] = useState("alerts");
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ["admin-alerts"],
    queryFn: async () => await base44.entities.Alert.list("-created_date", 50),
  });

  const { data: events = [] } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => await base44.entities.Event.list("-created_date", 50),
  });

  const { data: repeaters = [] } = useQuery({
    queryKey: ["admin-repeaters"],
    queryFn: async () => await base44.entities.Repeater.list("-created_date", 50),
  });

  const toggleFeatured = async (r) => {
    await base44.entities.Repeater.update(r.id, { is_favorite: !r.is_favorite });
    queryClient.invalidateQueries(["admin-repeaters"]);
  };

  const deleteAlert = async (id) => { await base44.entities.Alert.delete(id); queryClient.invalidateQueries(["admin-alerts"]); };
  const deleteEvent = async (id) => { await base44.entities.Event.delete(id); queryClient.invalidateQueries(["admin-events"]); };

  return (
    <AdminSection title="Content Manager" description="Manage alerts, events, and featured content across the platform">
      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-lg bg-card border border-border w-fit">
        {[
          { key: "alerts", label: "Alerts", icon: Bell },
          { key: "events", label: "Events", icon: Calendar },
          { key: "repeaters", label: "Featured", icon: Radio },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t.key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "alerts" && (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Platform Alerts ({alerts.length})</span>
            <Button size="sm" onClick={() => setShowCreate("alert")} className="bg-primary hover:bg-primary/90 text-primary-foreground h-8"><Plus className="w-4 h-4 mr-1" />New</Button>
          </div>
          <div className="divide-y divide-border">
            {alerts.map(a => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${a.type === "emergency" ? "bg-destructive/15 text-destructive" : a.type === "warning" ? "bg-warning/15 text-warning" : "bg-primary/15 text-primary"}`}>{a.type}</span>
                    <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                  </div>
                  {a.message && <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.message}</p>}
                </div>
                <button onClick={() => deleteAlert(a.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {alerts.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No alerts</div>}
          </div>
        </div>
      )}

      {tab === "events" && (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Events ({events.length})</span>
            <Button size="sm" onClick={() => setShowCreate("event")} className="bg-primary hover:bg-primary/90 text-primary-foreground h-8"><Plus className="w-4 h-4 mr-1" />New</Button>
          </div>
          <div className="divide-y divide-border">
            {events.map(e => (
              <div key={e.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.event_time && new Date(e.event_time).toLocaleString()} · {e.location || "No location"}</p>
                </div>
                <button onClick={() => deleteEvent(e.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {events.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No events</div>}
          </div>
        </div>
      )}

      {tab === "repeaters" && (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">Featured Repeaters</div>
          <div className="divide-y divide-border">
            {repeaters.map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div><p className="text-sm font-medium text-foreground">{r.callsign} · {r.frequency} MHz</p><p className="text-xs text-muted-foreground">{r.location}</p></div>
                <button onClick={() => toggleFeatured(r)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${r.is_favorite ? "border-warning/30 text-warning bg-warning/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  {r.is_favorite ? "★ Featured" : "☆ Feature"}
                </button>
              </div>
            ))}
            {repeaters.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No repeaters</div>}
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && <CreateModal type={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { queryClient.invalidateQueries(["admin-alerts"]); queryClient.invalidateQueries(["admin-events"]); }} />}
    </AdminSection>
  );
}

function CreateModal({ type, onClose, onCreated }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (type === "alert") {
        await base44.entities.Alert.create({ title: form.title || "Untitled", message: form.message || "", type: form.type || "info", community_id: "platform", community_name: "MIST Platform" });
      } else {
        await base44.entities.Event.create({ title: form.title || "Untitled", description: form.description || "", event_time: form.event_time || new Date().toISOString(), location: form.location || "", community_id: "platform", community_name: "MIST Platform" });
      }
      onCreated();
      onClose();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">New {type === "alert" ? "Alert" : "Event"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div><Label className="text-xs text-muted-foreground">Title</Label><Input value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="h-9 bg-background mt-1" /></div>
          {type === "alert" ? (
            <>
              <div><Label className="text-xs text-muted-foreground">Message</Label><Textarea value={form.message || ""} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="bg-background mt-1 min-h-[60px]" /></div>
              <div><Label className="text-xs text-muted-foreground">Type</Label>
                <select value={form.type || "info"} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full mt-1 h-9 rounded-lg bg-background border border-border px-3 text-sm text-foreground">
                  <option value="info">Info</option><option value="warning">Warning</option><option value="emergency">Emergency</option><option value="system">System</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div><Label className="text-xs text-muted-foreground">Description</Label><Textarea value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-background mt-1 min-h-[60px]" /></div>
              <div><Label className="text-xs text-muted-foreground">Date & Time</Label><Input type="datetime-local" value={form.event_time || ""} onChange={e => setForm(f => ({ ...f, event_time: e.target.value }))} className="h-9 bg-background mt-1" /></div>
              <div><Label className="text-xs text-muted-foreground">Location</Label><Input value={form.location || ""} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="h-9 bg-background mt-1" /></div>
            </>
          )}
          <Button onClick={save} disabled={saving} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">{saving ? "Creating..." : "Create"}</Button>
        </div>
      </div>
    </div>
  );
}