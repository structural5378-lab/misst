import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mist } from '@/api/mist';
import { useToast } from "@/components/ui/use-toast";
import AdminSection from "@/components/platform/AdminSection";
import AdminDataTable from "@/components/platform/AdminDataTable";
import NetFormDialog from "@/components/platform/nets/NetFormDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, RefreshCw, Radio, Pencil, Trash2 } from "lucide-react";

const CAT_BADGE = {
  general: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  emergency: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  technical: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  social: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  training: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};
const rowBtn = "p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10";

export default function PlatformAdminNets() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [communityFilter, setCommunityFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const { data: nets = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-nets", communityFilter],
    queryFn: async () => (await mist.functions.invoke("adminManageNet", { action: "list", community_id: communityFilter || undefined }))?.data?.nets || [],
  });
  const { data: communities = [] } = useQuery({
    queryKey: ["admin-communities-mini"],
    queryFn: async () => (await mist.functions.invoke("adminManageCommunity", { action: "list" }))?.data?.communities || [],
  });

  const save = async (data) => {
    if (editing) {
      const res = await mist.functions.invoke("adminManageNet", { action: "update", net_id: editing.id, fields: data });
      if (!res.data?.success) throw new Error(res.data?.error || "Update failed");
      toast({ title: "Net updated", description: data.name });
    } else {
      const res = await mist.functions.invoke("adminManageNet", { action: "create", fields: data });
      if (!res.data?.success) throw new Error(res.data?.error || "Create failed");
      toast({ title: "Net created", description: data.name });
    }
    setDialogOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-nets"] });
  };

  const doDelete = async () => {
    try {
      if (confirm?.type === "bulk") {
        const res = await mist.functions.invoke("adminManageNet", { action: "bulk_delete", net_ids: Array.from(selected) });
        if (!res.data?.success) throw new Error(res.data?.error);
        toast({ title: `${selected.size} nets deleted` });
        setSelected(new Set());
      } else if (confirm?.net) {
        const res = await mist.functions.invoke("adminManageNet", { action: "delete", net_id: confirm.net.id });
        if (!res.data?.success) throw new Error(res.data?.error);
        toast({ title: "Net deleted", description: confirm.net.name });
      }
    } catch (e) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setConfirm(null);
      qc.invalidateQueries({ queryKey: ["admin-nets"] });
    }
  };

  const columns = [
    { key: "name", header: "Net", sortable: true, render: (r) => <span className="font-medium text-foreground">{r.name}</span> },
    { key: "category", header: "Category", sortable: true, render: (r) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${CAT_BADGE[r.category] || CAT_BADGE.general}`}>{r.category}</span> },
    { key: "schedule", header: "Schedule", render: (r) => r.schedule || "—" },
    { key: "time", header: "Time", render: (r) => r.time || "—" },
    { key: "net_control", header: "Net Control", render: (r) => r.net_control || "—" },
    { key: "frequency", header: "Freq", sortable: true, render: (r) => r.frequency ? `${r.frequency} MHz` : "—" },
    { key: "community_name", header: "Community", render: (r) => r.community_name || "—" },
    { key: "actions", header: "Actions", render: (r) => (
      <div className="flex gap-0.5">
        <button title="Edit" className={rowBtn} onClick={() => { setEditing(r); setDialogOpen(true); }}><Pencil className="w-4 h-4" /></button>
        <button title="Delete" className={`${rowBtn} hover:text-destructive hover:bg-destructive/10`} onClick={() => setConfirm({ type: "single", net: r })}><Trash2 className="w-4 h-4" /></button>
      </div>
    ) },
  ];

  const bulkActions = [
    { label: "Delete", variant: "destructive", onClick: (rows) => { setSelected(new Set(rows.map((r) => r.id))); setConfirm({ type: "bulk" }); } },
  ];

  return (
    <AdminSection
      title="Nets Management"
      description="Create, edit, and remove scheduled nets across every community."
      action={
        <div className="flex gap-2">
          <Select value={communityFilter} onValueChange={setCommunityFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Communities" /></SelectTrigger>
            <SelectContent><SelectItem value={null}>All Communities</SelectItem>{communities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Refresh</Button>
          <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="w-4 h-4" /> Create Net</Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-xl bg-card border border-border animate-pulse" />)}</div>
      ) : isError ? (
        <div className="text-center py-12 rounded-2xl border border-border bg-card">
          <Radio className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">Couldn't load nets.</p>
          <p className="text-[11px] text-destructive/70 mb-3 font-mono px-4 break-all">{error?.message}</p>
          <Button size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Retry</Button>
        </div>
      ) : (
        <AdminDataTable
          columns={columns}
          rows={nets}
          rowKey="id"
          searchKeys={["name", "description", "net_control", "repeater_callsign", "community_name"]}
          bulkActions={nets.length ? bulkActions : []}
          exportFilename="nets"
          emptyMessage="No nets found. Create your first net."
        />
      )}

      <NetFormDialog open={dialogOpen} onOpenChange={setDialogOpen} net={editing} communities={communities} onSave={save} />

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirm?.type === "bulk" ? `${selected.size} nets` : "net"}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
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