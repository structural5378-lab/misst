import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import AdminSection from "@/components/platform/AdminSection";
import AdminDataTable from "@/components/platform/AdminDataTable";
import ClubFormDialog from "@/components/platform/clubs/ClubFormDialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, RefreshCw, Users, Pencil, Trash2, CheckCircle2, Ban } from "lucide-react";

const STATUS_BADGE = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  suspended: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};
const rowBtn = "p-1.5 rounded-lg text-muted-foreground";

export default function PlatformAdminClubs() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const { data: clubs = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-clubs"],
    queryFn: async () => (await base44.functions.invoke("adminManageClub", { action: "list" }))?.data?.clubs || [],
  });
  const { data: communities = [] } = useQuery({
    queryKey: ["admin-communities-mini"],
    queryFn: async () => (await base44.functions.invoke("adminManageCommunity", { action: "list" }))?.data?.communities || [],
  });

  const save = async (data) => {
    if (editing) {
      const res = await base44.functions.invoke("adminManageClub", { action: "update", club_id: editing.id, fields: data });
      if (!res.data?.success) throw new Error(res.data?.error);
      toast({ title: "Club updated", description: data.name });
    } else {
      const res = await base44.functions.invoke("adminManageClub", { action: "create", fields: data });
      if (!res.data?.success) throw new Error(res.data?.error);
      toast({ title: "Club created", description: data.name });
    }
    setDialogOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-clubs"] });
  };
  const setStatus = async (club, status) => {
    try {
      const res = await base44.functions.invoke("adminManageClub", { action: "set_status", club_id: club.id, status });
      if (!res.data?.success) throw new Error(res.data?.error);
      toast({ title: status === "active" ? "Club activated" : "Club suspended", description: club.name });
      qc.invalidateQueries({ queryKey: ["admin-clubs"] });
    } catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  };
  const doDelete = async () => {
    try {
      const ids = confirm?.type === "bulk" ? Array.from(selected) : [confirm?.club?.id];
      const res = await base44.functions.invoke("adminManageClub", { action: confirm?.type === "bulk" ? "bulk_delete" : "delete", club_id: ids[0], club_ids: ids });
      if (!res.data?.success) throw new Error(res.data?.error);
      toast({ title: `${ids.length} club(s) deleted` });
      setSelected(new Set());
    } catch (e) { toast({ title: "Delete failed", description: e.message, variant: "destructive" }); }
    finally { setConfirm(null); qc.invalidateQueries({ queryKey: ["admin-clubs"] }); }
  };

  const columns = [
    { key: "name", header: "Club", sortable: true, render: (r) => <span className="font-medium text-foreground">{r.name}</span> },
    { key: "category", header: "Category", render: (r) => r.category || "—" },
    { key: "community_name", header: "Community", render: (r) => r.community_name || "—" },
    { key: "owner_name", header: "Owner", render: (r) => r.owner_name || "—" },
    { key: "member_count", header: "Members", sortable: true },
    { key: "is_public", header: "Visibility", render: (r) => r.is_public ? <span className="text-emerald-400 text-xs">Public</span> : <span className="text-muted-foreground text-xs">Private</span> },
    { key: "status", header: "Status", sortable: true, render: (r) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${STATUS_BADGE[r.status] || STATUS_BADGE.active}`}>{r.status}</span> },
    { key: "actions", header: "Actions", render: (r) => (
      <div className="flex gap-0.5">
        {r.status !== "active" ? <button title="Activate" className={`${rowBtn} hover:text-emerald-400 hover:bg-emerald-500/10`} onClick={() => setStatus(r, "active")}><CheckCircle2 className="w-4 h-4" /></button> : <button title="Suspend" className={`${rowBtn} hover:text-amber-400 hover:bg-amber-500/10`} onClick={() => setStatus(r, "suspended")}><Ban className="w-4 h-4" /></button>}
        <button title="Edit" className={`${rowBtn} hover:text-primary hover:bg-primary/10`} onClick={() => { setEditing(r); setDialogOpen(true); }}><Pencil className="w-4 h-4" /></button>
        <button title="Delete" className={`${rowBtn} hover:text-destructive hover:bg-destructive/10`} onClick={() => setConfirm({ type: "single", club: r })}><Trash2 className="w-4 h-4" /></button>
      </div>
    ) },
  ];
  const bulkActions = [{ label: "Delete", variant: "destructive", onClick: (rows) => { setSelected(new Set(rows.map((r) => r.id))); setConfirm({ type: "bulk" }); } }];

  return (
    <AdminSection
      title="Club Management"
      description="Create, approve, suspend, and manage community clubs and sub-groups."
      action={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Refresh</Button>
          <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="w-4 h-4" /> Create Club</Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-xl bg-card border border-border animate-pulse" />)}</div>
      ) : isError ? (
        <div className="text-center py-12 rounded-2xl border border-border bg-card">
          <Users className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">Couldn't load clubs.</p>
          <p className="text-[11px] text-destructive/70 mb-3 font-mono px-4 break-all">{error?.message}</p>
          <Button size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Retry</Button>
        </div>
      ) : (
        <AdminDataTable columns={columns} rows={clubs} rowKey="id" searchKeys={["name", "category", "community_name", "owner_name"]} bulkActions={clubs.length ? bulkActions : []} exportFilename="clubs" emptyMessage="No clubs yet. Create your first club." />
      )}
      <ClubFormDialog open={dialogOpen} onOpenChange={setDialogOpen} club={editing} communities={communities} onSave={save} />
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete {confirm?.type === "bulk" ? `${selected.size} clubs` : "club"}?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminSection>
  );
}