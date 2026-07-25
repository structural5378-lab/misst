import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import AdminSection from "@/components/platform/AdminSection";
import RepeaterTable from "@/components/platform/radioscope/RepeaterTable";
import RepeaterFormDialog from "@/components/platform/radioscope/RepeaterFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, RefreshCw, Radio, Trash2 } from "lucide-react";

const STATUSES = ["online", "offline", "busy"];

export default function PlatformAdminRepeaters() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [communityFilter, setCommunityFilter] = useState("");
  const [sort, setSort] = useState("updated");
  const [selectedIds, setSelectedIds] = useState([]);
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const { data: repeaters = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-repeaters"],
    queryFn: async () => (await base44.functions.invoke("adminManageRepeater", { action: "list" }))?.data?.repeaters || [],
  });
  const { data: communities = [] } = useQuery({
    queryKey: ["admin-communities-mini"],
    queryFn: async () => (await base44.functions.invoke("adminManageCommunity", { action: "list" }))?.data?.communities || [],
  });

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

  const toggle = (id, v) => setSelectedIds((p) => (v ? [...p, id] : p.filter((x) => x !== id)));
  const toggleAll = (v) => setSelectedIds(v ? filtered.map((r) => r.id) : []);

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
    }
  };

  return (
    <AdminSection
      title="Repeater Management"
      description="Manage every repeater on the platform — details, status, ownership, and coverage."
      action={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Refresh</Button>
          <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="w-4 h-4" /> Add Repeater</Button>
        </div>
      }
    >
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
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between gap-2 mb-3 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
          <span className="text-xs font-semibold text-primary">{selectedIds.length} selected</span>
          <Button size="sm" variant="destructive" onClick={() => setConfirm({ type: "bulk" })}><Trash2 className="w-4 h-4" /> Delete Selected</Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-14 rounded-2xl bg-card border border-border animate-pulse" />)}</div>
      ) : isError ? (
        <div className="text-center py-12 rounded-2xl border border-border bg-card">
          <p className="text-sm text-muted-foreground mb-3">Couldn't load repeaters.</p>
          <p className="text-[11px] text-destructive/70 mb-3 font-mono px-4 break-all">{error?.message}</p>
          <Button size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Retry</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-border bg-card">
          <Radio className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{query || statusFilter || communityFilter ? "No repeaters match your filters." : "No repeaters yet. Add your first repeater."}</p>
        </div>
      ) : (
        <RepeaterTable repeaters={filtered} selectedIds={selectedIds} onToggle={toggle} onToggleAll={toggleAll} onEdit={(r) => { setEditing(r); setDialogOpen(true); }} onDelete={(r) => setConfirm({ type: "single", repeater: r })} />
      )}

      <RepeaterFormDialog open={dialogOpen} onOpenChange={setDialogOpen} repeater={editing} communities={communities} onSave={save} />

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirm?.type === "bulk" ? `${selectedIds.length} repeaters` : "repeater"}?</AlertDialogTitle>
            <AlertDialogDescription>This action permanently deletes the repeater(s) and cannot be undone.</AlertDialogDescription>
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