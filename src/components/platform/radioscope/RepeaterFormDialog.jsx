import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const EMPTY = {
  callsign: "", frequency: "", offset: "", tone: "", band: "GMRS", location: "",
  latitude: "", longitude: "", status: "online", owner_callsign: "", description: "",
  community_id: "", community_name: "", coverage_radius: "", coverage_color: "#8B5CF6",
  coverage_opacity: 0.18, coverage_visible: true, height_m: "", erp_watts: "", antenna_type: "",
};

export default function RepeaterFormDialog({ open, onOpenChange, repeater, communities = [], onSave }) {
  const [f, setF] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setErr("");
      setF(repeater ? { ...EMPTY, ...repeater, frequency: repeater.frequency ?? "", latitude: repeater.latitude ?? "", longitude: repeater.longitude ?? "", coverage_radius: repeater.coverage_radius ?? "", coverage_opacity: repeater.coverage_opacity ?? 0.18, height_m: repeater.height_m ?? "", erp_watts: repeater.erp_watts ?? "" } : EMPTY);
    }
  }, [open, repeater]);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.callsign.trim()) return setErr("Callsign is required.");
    if (f.frequency === "" || f.frequency === null) return setErr("Frequency is required.");
    const freq = Number(f.frequency);
    if (Number.isNaN(freq)) return setErr("Please enter a valid frequency in MHz.");
    let lat = null, lon = null;
    if (f.latitude !== "" && f.latitude != null) { lat = Number(f.latitude); if (Number.isNaN(lat)) return setErr("Please enter a valid latitude."); }
    if (f.longitude !== "" && f.longitude != null) { lon = Number(f.longitude); if (Number.isNaN(lon)) return setErr("Please enter a valid longitude."); }
    setSaving(true);
    try {
      await onSave({
        ...f,
        frequency: freq,
        latitude: lat,
        longitude: lon,
        coverage_radius: f.coverage_radius === "" || f.coverage_radius == null ? null : Number(f.coverage_radius),
        coverage_opacity: f.coverage_opacity === "" || f.coverage_opacity == null ? null : Number(f.coverage_opacity),
        height_m: f.height_m === "" || f.height_m == null ? null : Number(f.height_m),
        erp_watts: f.erp_watts === "" || f.erp_watts == null ? null : Number(f.erp_watts),
        community_name: communities.find((c) => c.id === f.community_id)?.name || f.community_name || "",
      });
    } catch (e) {
      setErr(e?.message || "Could not save repeater.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle>{repeater ? "Edit Repeater" : "Add Repeater"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2 sm:col-span-1"><Label>Callsign *</Label><Input value={f.callsign} onChange={(e) => set("callsign", e.target.value)} placeholder="K4MIA" /></div>
          <div className="col-span-2 sm:col-span-1"><Label>Frequency (MHz) *</Label><Input type="number" step="0.001" value={f.frequency} onChange={(e) => set("frequency", e.target.value)} placeholder="462.675" /></div>
          <div><Label>Offset</Label><Input value={f.offset} onChange={(e) => set("offset", e.target.value)} placeholder="+5.0 MHz" /></div>
          <div><Label>Tone</Label><Input value={f.tone} onChange={(e) => set("tone", e.target.value)} placeholder="141.3 / D023" /></div>
          <div><Label>Band</Label>
            <Select value={f.band} onValueChange={(v) => set("band", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["GMRS", "Ham", "Business", "Public Safety", "Other"].map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Status</Label>
            <Select value={f.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["online", "offline", "busy"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label>Location</Label><Input value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="Orlando, FL" /></div>
          <div><Label>Latitude</Label><Input type="number" step="any" value={f.latitude} onChange={(e) => set("latitude", e.target.value)} placeholder="28.5383" /></div>
          <div><Label>Longitude</Label><Input type="number" step="any" value={f.longitude} onChange={(e) => set("longitude", e.target.value)} placeholder="-81.3792" /></div>
          <div><Label>Owner Callsign</Label><Input value={f.owner_callsign} onChange={(e) => set("owner_callsign", e.target.value)} /></div>
          <div><Label>Community</Label>
            <Select value={f.community_id} onValueChange={(v) => set("community_id", v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent><SelectItem value={null}>None</SelectItem>{communities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Antenna Height (m)</Label><Input type="number" step="any" value={f.height_m} onChange={(e) => set("height_m", e.target.value)} /></div>
          <div><Label>ERP (Watts)</Label><Input type="number" step="any" value={f.erp_watts} onChange={(e) => set("erp_watts", e.target.value)} /></div>
          <div className="col-span-2"><Label>Antenna Type</Label><Input value={f.antenna_type} onChange={(e) => set("antenna_type", e.target.value)} placeholder="Vertical, Yagi, etc." /></div>
          <div className="col-span-2"><Label>Description</Label><Input value={f.description} onChange={(e) => set("description", e.target.value)} /></div>

          <div className="col-span-2 mt-1 pt-3 border-t border-border">
            <p className="text-xs font-semibold text-foreground mb-2">Coverage Circle</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Radius (mi)</Label><Input type="number" step="any" value={f.coverage_radius} onChange={(e) => set("coverage_radius", e.target.value)} placeholder="25" /></div>
              <div><Label>Color</Label><input type="color" value={f.coverage_color || "#8B5CF6"} onChange={(e) => set("coverage_color", e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent cursor-pointer" /></div>
              <div><Label>Opacity ({Math.round((f.coverage_opacity ?? 0) * 100)}%)</Label><input type="range" min={0} max={1} step={0.05} value={f.coverage_opacity ?? 0.18} onChange={(e) => set("coverage_opacity", Number(e.target.value))} className="w-full accent-primary" /></div>
              <div className="flex items-center gap-2 pt-6"><Switch checked={f.coverage_visible} onCheckedChange={(v) => set("coverage_visible", v)} /><Label className="text-xs">Visible on map</Label></div>
            </div>
          </div>
        </div>
        {err && <p className="text-sm text-destructive -mt-1">{err}</p>}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : repeater ? "Save Changes" : "Create Repeater"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}