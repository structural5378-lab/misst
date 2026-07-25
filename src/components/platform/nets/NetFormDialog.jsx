import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const EMPTY = {
  name: "", description: "", category: "general", schedule: "", time: "", day_of_week: "",
  frequency: "", repeater_callsign: "", net_control: "", member_count: 0, community_id: "", community_name: "",
};
const CATEGORIES = ["general", "emergency", "technical", "social", "training"];

export default function NetFormDialog({ open, onOpenChange, net, communities = [], onSave }) {
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setErr("");
      setF(net ? { ...EMPTY, ...net, frequency: net.frequency ?? "", member_count: net.member_count ?? 0 } : EMPTY);
    }
  }, [open, net]);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.name?.trim()) return setErr("Net name is required.");
    setSaving(true);
    try {
      await onSave({
        ...f,
        frequency: f.frequency === "" || f.frequency == null ? null : Number(f.frequency),
        member_count: f.member_count === "" || f.member_count == null ? 0 : Number(f.member_count),
        community_name: communities.find((c) => c.id === f.community_id)?.name || f.community_name || "",
      });
    } catch (e) {
      setErr(e?.message || "Could not save net.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader><DialogTitle>{net ? "Edit Net" : "Create Net"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2"><Label>Name *</Label><Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Weekly Tech Net" /></div>
          <div className="col-span-2"><Label>Description</Label><Textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={2} /></div>
          <div><Label>Category</Label>
            <Select value={f.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Frequency (MHz)</Label><Input type="number" step="any" value={f.frequency} onChange={(e) => set("frequency", e.target.value)} /></div>
          <div><Label>Schedule</Label><Input value={f.schedule} onChange={(e) => set("schedule", e.target.value)} placeholder="Mon/Wed/Fri" /></div>
          <div><Label>Time</Label><Input value={f.time} onChange={(e) => set("time", e.target.value)} placeholder="8:00 PM EST" /></div>
          <div><Label>Day of Week</Label><Input value={f.day_of_week} onChange={(e) => set("day_of_week", e.target.value)} placeholder="Monday" /></div>
          <div><Label>Repeater Callsign</Label><Input value={f.repeater_callsign} onChange={(e) => set("repeater_callsign", e.target.value)} /></div>
          <div><Label>Net Control</Label><Input value={f.net_control} onChange={(e) => set("net_control", e.target.value)} placeholder="K4ABC" /></div>
          <div><Label>Community</Label>
            <Select value={f.community_id} onValueChange={(v) => set("community_id", v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent><SelectItem value={null}>None</SelectItem>{communities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        {err && <p className="text-sm text-destructive -mt-1">{err}</p>}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : net ? "Save Changes" : "Create Net"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}