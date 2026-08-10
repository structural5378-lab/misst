import React, { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { mist } from '@/api/mist';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AdminSection from "@/components/platform/AdminSection";
import RepeaterTable from "@/components/platform/radioscope/RepeaterTable";
import RepeaterFormDialog from "@/components/platform/radioscope/RepeaterFormDialog";
import RadioScopeMap from "@/components/platform/radioscope/RadioScopeMap";
import GisAnalysisPanel from "@/components/platform/radioscope/GisAnalysisPanel";
import { parseGeoFile, fcToPointList } from "@/lib/geoImport";
import { Radio, Plus, Search, Download, Upload, Trash2, Map as MapIcon, Table as TableIcon, RefreshCw, Loader2, ListTree, Flame, MapPin, Shield } from "lucide-react";

const STATUSES = ["online", "offline", "busy"];

export default function PlatformAdminRadioScope() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [communityFilter, setCommunityFilter] = useState("");
  const [sort, setSort] = useState("updated");
  const [view, setView] = useState("table");
  const [selectedIds, setSelectedIds] = useState([]);
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirm, setConfirm] = useState(null); // { type:'single'|'bulk', repeater? }
  const [heatEnabled, setHeatEnabled] = useState(false);
  const [drawEnabled, setDrawEnabled] = useState(false);
  const [geoName, setGeoName] = useState("");

  const { data: repeaters = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-repeaters"],
    queryFn: async () => {
      const res = await base44.functions.invoke("adminManageRepeater", { action: "list" });
      console.log("[RadioScope] list returned", res.data?.repeaters?.length || 0);
      return res.data?.repeaters || [];
    },
  });
  const { data: communities = [] } = useQuery({
    queryKey: ["admin-communities-mini"],
    queryFn: async () => {
      const res = await base44.functions.invoke("adminManageCommunity", { action: "list" });
      return res.data?.communities || [];
    },
  });
  const { data: activity = [] } = useQuery({
    queryKey: ["repeater-activity"],
    queryFn: async () => (await mist.entities.PlatformAuditLog.filter({ target_type: "repeater" }, "-created_date", 8)) || [],
    staleTime: 30000,
  });
  const { data: geofences = [], refetch: refetchGeofences } = useQuery({
    queryKey: ["admin-geofences"],
    queryFn: async () => (await base44.functions.invoke("adminManageGeofence", { action: "list" }))?.data?.geofences || [],
    staleTime: 30000,
  });

  const onGeofenceCreated = async (shape) => {
    const name = window.prompt("Name this geofence:", shape.shape === "circle" ? "Coverage Zone" : "Operational Area");
    if (!name) return;
    try {
      const geo = shape.shape === "circle" ? { center: shape.center, radius_m: shape.radius_m } : shape.geo;
      const res = await base44.functions.invoke("adminManageGeofence", {
        action: "create",
        fields: { name, shape: shape.shape, geo: JSON.stringify(geo), color: shape.shape === "circle" ? "#06B6D4" : "#8B5CF6" },
      });
      if (!res.data?.success) throw new Error(res.data?.error);
      toast({ title: "Geofence created", description: name });
      refetchGeofences();
    } catch (e) {
      toast({ title: "Geofence failed", description: e.message, variant: "destructive" });
    }
  };
  const deleteGeofence = async (g) => {
    if (!window.confirm(`Delete geofence "${g.name}"?`)) return;
    try {
      const res = await base44.functions.invoke("adminManageGeofence", { action: "delete", geofence_id: g.id });
      if (!res.data?.success) throw new Error(res.data?.error);
      toast({ title: "Geofence deleted" });
      refetchGeofences();
    } catch (e) { toast({ title: "Delete failed", description: e.message, variant: "destructive" }); }
  };

  const filtered = useMemo(() => {
    let list = repeaters;
    if (statusFilter) list = list.filter((r) => r.status === statusFilter);
    if (communityFilter) list = list.filter((r) => r.community_id === communityFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((r) => [r.callsign, r.location, r.owner_callsign, r.community_name, r.description].some((x) => (x || "").toLowerCase().includes(q)));
    }
    const s = [...list];
    if (sort === "callsign") s.sort((a, b) => (a.callsign || "").localeCompare(b.callsign || ""));
    else if (sort === "frequency") s.sort((a, b) => (a.frequency || 0) - (b.frequency || 0));
    else if (sort === "status") s.sort((a, b) => (a.status || "").localeCompare(b.status || ""));
    else s.sort((a, b) => new Date(b.updated_date || 0) - new Date(a.updated_date || 0));
    return s;
  }, [repeaters, statusFilter, communityFilter, query, sort]);

  const stats = useMemo(() => ({
    total: repeaters.length,
    online: repeaters.filter((r) => r.status === "online").length,
    withCoverage: repeaters.filter((r) => r.coverage_radius > 0).length,
    geolocated: repeaters.filter((r) => r.latitude != null && r.longitude != null).length,
  }), [repeaters]);

  const toggle = (id, v) => setSelectedIds((p) => (v ? [...p, id] : p.filter((x) => x !== id)));
  const toggleAll = (v) => setSelectedIds(v ? filtered.map((r) => r.id) : []);

  const openCreate = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (r) => { setEditing(r); setDialogOpen(true); };

  const save = async (data) => {
    if (editing) {
      const res = await base44.functions.invoke("adminManageRepeater", { action: "update", repeater_id: editing.id, fields: data });
      if (!res.data?.success) throw new Error(res.data?.error || "Update failed");
      toast({ title: "Repeater updated", description: data.callsign });
    } else {
      const res = await base44.functions.invoke("adminManageRepeater", { action: "create", fields: data });
      if (!res.data?.success) throw new Error(res.data?.error || "Create failed");
      toast({ title: "Repeater created", description: data.callsign });
    }
    setDialogOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-repeaters"] });
    qc.invalidateQueries({ queryKey: ["repeater-activity"] });
  };

  const doDelete = async () => {
    try {
      if (confirm?.type === "bulk") {
        const res = await base44.functions.invoke("adminManageRepeater", { action: "bulk_delete", repeater_ids: selectedIds });
        if (!res.data?.success) throw new Error(res.data?.error);
        toast({ title: `${selectedIds.length} repeaters deleted` });
        setSelectedIds([]);
      } else if (confirm?.repeater) {
        const res = await base44.functions.invoke("adminManageRepeater", { action: "delete", repeater_id: confirm.repeater.id });
        if (!res.data?.success) throw new Error(res.data?.error);
        toast({ title: "Repeater deleted", description: confirm.repeater.callsign });
      }
    } catch (e) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setConfirm(null);
      qc.invalidateQueries({ queryKey: ["admin-repeaters"] });
      qc.invalidateQueries({ queryKey: ["repeater-activity"] });
    }
  };

  const exportGeoJSON = () => {
    const fc = {
      type: "FeatureCollection",
      features: filtered.filter((r) => r.latitude != null && r.longitude != null).map((r) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [r.longitude, r.latitude] },
        properties: {
          callsign: r.callsign, frequency: r.frequency, offset: r.offset, tone: r.tone, band: r.band,
          status: r.status, location: r.location, owner_callsign: r.owner_callsign, community: r.community_name,
          coverage_radius: r.coverage_radius, coverage_color: r.coverage_color,
        },
      })),
    };
    const blob = new Blob([JSON.stringify(fc, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "misst-repeaters.geojson"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported GeoJSON", description: `${fc.features.length} repeaters` });
  };

  const onImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fc = await parseGeoFile(file);
      const feats = Array.isArray(fc?.features) ? fc.features : [];
      let ok = 0;
      for (const ft of feats) {
        const [lon, lat] = ft.geometry?.coordinates || [];
        if (lat == null || lon == null) continue;
        const p = ft.properties || {};
        const res = await base44.functions.invoke("adminManageRepeater", {
          action: "create",
          fields: { callsign: p.callsign || p.name || `Waypoint ${ok + 1}`, frequency: p.frequency, offset: p.offset, tone: p.tone, band: p.band || "GMRS", status: p.status || "online", location: p.location, owner_callsign: p.owner_callsign, community_name: p.community, latitude: lat, longitude: lon, coverage_radius: p.coverage_radius, coverage_color: p.coverage_color },
        });
        if (res.data?.success) ok++;
      }
      toast({ title: `Imported ${ok} points`, description: file.name });
      qc.invalidateQueries({ queryKey: ["admin-repeaters"] });
    } catch (err) {
      toast({ title: "Import failed", description: err.message || "Unsupported or invalid file.", variant: "destructive" });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <AdminSection
      title="RadioScope Management"
      description="Tactical GMRS GIS console — repeaters, coverage, heat maps, geofences, and multi-format GIS import."
      action={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Refresh</Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4" /> Import</Button>
          <input ref={fileRef} type="file" accept=".geojson,.json,.gpx,.kml,.kmz,application/geo+json,application/json,application/gpx+xml,application/vnd.google-earth.kml+xml,application/vnd.google-earth.kmz" className="hidden" onChange={onImportFile} />
          <Button variant="outline" size="sm" onClick={exportGeoJSON}><Download className="w-4 h-4" /> Export</Button>
          <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4" /> Add Repeater</Button>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total Repeaters", value: stats.total },
          { label: "Online", value: stats.online },
          { label: "With Coverage", value: stats.withCoverage },
          { label: "Geolocated", value: stats.geolocated },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search callsign, location, owner…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent><SelectItem value={null}>All Status</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={communityFilter} onValueChange={setCommunityFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Communities" /></SelectTrigger>
          <SelectContent><SelectItem value={null}>All Communities</SelectItem>{communities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Recently Updated</SelectItem>
            <SelectItem value="callsign">Callsign A–Z</SelectItem>
            <SelectItem value="frequency">Frequency</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex rounded-xl border border-border overflow-hidden">
          <button onClick={() => setView("table")} className={`px-3 py-2 text-xs font-semibold flex items-center gap-1 ${view === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><TableIcon className="w-4 h-4" /> Table</button>
          <button onClick={() => setView("map")} className={`px-3 py-2 text-xs font-semibold flex items-center gap-1 ${view === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><MapIcon className="w-4 h-4" /> Map</button>
        </div>
      </div>

      {/* Bulk bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between gap-2 mb-3 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
          <span className="text-xs font-semibold text-primary">{selectedIds.length} selected</span>
          <Button size="sm" variant="destructive" onClick={() => setConfirm({ type: "bulk" })}><Trash2 className="w-4 h-4" /> Delete Selected</Button>
        </div>
      )}

      {/* Body */}
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-14 rounded-2xl bg-card border border-border animate-pulse" />)}
        </div>
      ) : isError ? (
        <div className="text-center py-12 rounded-2xl border border-border bg-card">
          <p className="text-sm text-muted-foreground mb-3">We couldn't load repeaters. Please try again.</p>
          <p className="text-[11px] text-destructive/70 mb-3 font-mono break-all px-4">{error?.message}</p>
          <Button size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Retry</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-border bg-card">
          <Radio className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{query || statusFilter || communityFilter ? "No repeaters match your filters." : "No repeaters yet. Add your first repeater to start mapping coverage."}</p>
        </div>
      ) : view === "map" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setHeatEnabled((v) => !v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${heatEnabled ? "bg-orange-500/20 text-orange-400 border border-orange-500/40" : "bg-secondary text-muted-foreground border border-border"}`}>
              <Flame className="w-3.5 h-3.5" /> Heat Map
            </button>
            <button onClick={() => setDrawEnabled((v) => !v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${drawEnabled ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40" : "bg-secondary text-muted-foreground border border-border"}`}>
              <MapPin className="w-3.5 h-3.5" /> Draw Geofence
            </button>
            {drawEnabled && <span className="text-[11px] text-muted-foreground">Use the ▢ / ◯ / ⋯ tools (top-right of map) to draw, then name the geofence.</span>}
          </div>
          <RadioScopeMap repeaters={filtered} onSelect={(r) => openEdit(r)} heatEnabled={heatEnabled} drawEnabled={drawEnabled} geofences={geofences} onGeofenceCreated={onGeofenceCreated} />
          <GisAnalysisPanel repeaters={filtered} geofences={geofences} />
          {geofences.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-3 py-2 border-b border-border text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Geofences ({geofences.length})</div>
              <div className="divide-y divide-border max-h-52 overflow-y-auto">
                {geofences.map((g) => (
                  <div key={g.id} className="flex items-center justify-between px-3 py-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: g.color || "#06B6D4" }} />
                      <span className="text-sm font-medium text-foreground truncate">{g.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{g.shape}</span>
                    </span>
                    <button className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => deleteGeofence(g)}><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <RepeaterTable repeaters={filtered} selectedIds={selectedIds} onToggle={toggle} onToggleAll={toggleAll} onEdit={openEdit} onDelete={(r) => setConfirm({ type: "single", repeater: r })} />
      )}

      {/* Recent activity */}
      <div className="mt-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5"><ListTree className="w-3.5 h-3.5" /> Recent Activity</h3>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">No repeater activity logged yet.</p>
          ) : activity.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
              <span className="text-foreground font-medium">{a.action.replace("repeater_", "").replace("_", " ")}</span>
              <span className="text-muted-foreground">{a.target_name || a.target_id || "—"} · {new Date(a.created_date).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <RepeaterFormDialog open={dialogOpen} onOpenChange={setDialogOpen} repeater={editing} communities={communities} onSave={save} />

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirm?.type === "bulk" ? `${selectedIds.length} repeaters` : "repeater"}?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.type === "bulk"
                ? "This will permanently delete the selected repeaters. This action cannot be undone."
                : `This will permanently delete repeater ${confirm?.repeater?.callsign || ""}. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminSection>
  );
}