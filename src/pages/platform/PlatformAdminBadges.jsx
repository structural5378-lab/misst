import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { mist } from '@/api/mist';
import { useToast } from "@/components/ui/use-toast";
import AdminSection from "@/components/platform/AdminSection";
import AdminDataTable from "@/components/platform/AdminDataTable";
import AwardBadgeDialog from "@/components/platform/badges/AwardBadgeDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Award, Plus, RefreshCw, Trash2 } from "lucide-react";

const RARITY_BADGE = {
  common: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  rare: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  epic: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  legendary: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  mythic: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
  founder: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  seasonal: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  club_exclusive: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  national_event: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  developer: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
};
const rowBtn = "p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10";

export default function PlatformAdminBadges() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [rarityFilter, setRarityFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: awards = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-achievements"],
    queryFn: async () => (await mist.functions.invoke("adminEntityAdmin", { action: "list", entity: "UserAchievement", limit: 1000 }))?.data?.rows || [],
  });
  const { data: users = [] } = useQuery({
    queryKey: ["admin-users-mini"],
    queryFn: async () => (await mist.entities.User.list("-created_date", 500)) || [],
  });

  const rows = rarityFilter ? awards.filter((a) => a.rarity === rarityFilter) : awards;

  const award = async (data) => {
    const res = await mist.functions.invoke("adminEntityAdmin", { action: "create", entity: "UserAchievement", fields: data });
    if (!res.data?.success) throw new Error(res.data?.error || "Award failed");
    toast({ title: "Badge awarded", description: `${data.achievement_name || data.achievement_id} → ${data.user_name || data.user_id}` });
    setDialogOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-achievements"] });
  };
  const revoke = async (id) => {
    try {
      const res = await mist.functions.invoke("adminEntityAdmin", { action: "delete", entity: "UserAchievement", id });
      if (!res.data?.success) throw new Error(res.data?.error);
      toast({ title: "Badge revoked" });
      qc.invalidateQueries({ queryKey: ["admin-achievements"] });
    } catch (e) { toast({ title: "Revoke failed", description: e.message, variant: "destructive" }); }
  };
  const bulkRevoke = async (rs) => {
    try {
      const res = await mist.functions.invoke("adminEntityAdmin", { action: "bulk_delete", entity: "UserAchievement", ids: rs.map((r) => r.id) });
      if (!res.data?.success) throw new Error(res.data?.error);
      toast({ title: `${rs.length} badges revoked` });
      qc.invalidateQueries({ queryKey: ["admin-achievements"] });
    } catch (e) { toast({ title: "Bulk revoke failed", description: e.message, variant: "destructive" }); }
  };

  const columns = [
    { key: "unlocked_date", header: "Awarded", sortable: true, exportVal: (r) => r.unlocked_date ? new Date(r.unlocked_date).toISOString() : "", render: (r) => r.unlocked_date ? new Date(r.unlocked_date).toLocaleDateString() : "—" },
    { key: "user_name", header: "Operator", sortable: true, render: (r) => r.user_name || r.user_id },
    { key: "achievement_id", header: "Achievement", sortable: true, render: (r) => <span className="font-mono text-primary">{r.achievement_id}</span> },
    { key: "achievement_name", header: "Name", render: (r) => r.achievement_name || "—" },
    { key: "rarity", header: "Rarity", sortable: true, render: (r) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${RARITY_BADGE[r.rarity] || RARITY_BADGE.common}`}>{r.rarity}</span> },
    { key: "collection", header: "Collection", render: (r) => r.collection || "—" },
    { key: "actions", header: "Actions", render: (r) => <button title="Revoke" className={rowBtn} onClick={() => revoke(r.id)}><Trash2 className="w-4 h-4" /></button> },
  ];
  const bulkActions = [{ label: "Revoke", variant: "destructive", onClick: bulkRevoke }];

  return (
    <AdminSection
      title="Badge System"
      description="Award and revoke operator badges and achievements across the platform."
      action={
        <div className="flex gap-2">
          <Select value={rarityFilter} onValueChange={setRarityFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Rarities" /></SelectTrigger>
            <SelectContent><SelectItem value={null}>All Rarities</SelectItem>{Object.keys(RARITY_BADGE).map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Refresh</Button>
          <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4" /> Award Badge</Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-xl bg-card border border-border animate-pulse" />)}</div>
      ) : isError ? (
        <div className="text-center py-12 rounded-2xl border border-border bg-card">
          <Award className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">Couldn't load badges.</p>
          <p className="text-[11px] text-destructive/70 mb-3 font-mono px-4 break-all">{error?.message}</p>
          <Button size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Retry</Button>
        </div>
      ) : (
        <AdminDataTable
          columns={columns}
          rows={rows}
          rowKey="id"
          searchKeys={["user_name", "achievement_id", "achievement_name", "collection"]}
          bulkActions={rows.length ? bulkActions : []}
          exportFilename="badges"
          emptyMessage="No badges awarded yet."
        />
      )}
      <AwardBadgeDialog open={dialogOpen} onOpenChange={setDialogOpen} users={users} onSave={award} />
    </AdminSection>
  );
}