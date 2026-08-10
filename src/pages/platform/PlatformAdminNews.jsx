import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mist } from '@/api/mist';
import { useToast } from "@/components/ui/use-toast";
import AdminSection from "@/components/platform/AdminSection";
import AdminDataTable from "@/components/platform/AdminDataTable";
import NewsFormDialog from "@/components/platform/news/NewsFormDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Newspaper, Plus, RefreshCw, Trash2 } from "lucide-react";

const TYPE_BADGE = {
  info: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  emergency: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  system: "bg-violet-500/15 text-violet-400 border-violet-500/30",
};
const rowBtn = "p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10";

export default function PlatformAdminNews() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [communityFilter, setCommunityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: alerts = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-news", communityFilter],
    queryFn: async () => (await mist.functions.invoke("adminEntityAdmin", { action: "list", entity: "Alert", community_id: communityFilter || undefined }))?.data?.rows || [],
  });
  const { data: communities = [] } = useQuery({
    queryKey: ["admin-communities-mini"],
    queryFn: async () => (await mist.functions.invoke("adminManageCommunity", { action: "list" }))?.data?.communities || [],
  });

  const rows = typeFilter ? alerts.filter((a) => a.type === typeFilter) : alerts;

  const publish = async (data) => {
    const res = await mist.functions.invoke("adminEntityAdmin", { action: "create", entity: "Alert", fields: data });
    if (!res.data?.success) throw new Error(res.data?.error || "Publish failed");
    toast({ title: "Announcement published", description: data.title });
    setDialogOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-news"] });
  };
  const del = async (id) => {
    try {
      const res = await mist.functions.invoke("adminEntityAdmin", { action: "delete", entity: "Alert", id });
      if (!res.data?.success) throw new Error(res.data?.error);
      toast({ title: "Announcement deleted" });
      qc.invalidateQueries({ queryKey: ["admin-news"] });
    } catch (e) { toast({ title: "Delete failed", description: e.message, variant: "destructive" }); }
  };
  const bulkDel = async (rs) => {
    try {
      const res = await mist.functions.invoke("adminEntityAdmin", { action: "bulk_delete", entity: "Alert", ids: rs.map((r) => r.id) });
      if (!res.data?.success) throw new Error(res.data?.error);
      toast({ title: `${rs.length} announcements deleted` });
      qc.invalidateQueries({ queryKey: ["admin-news"] });
    } catch (e) { toast({ title: "Bulk delete failed", description: e.message, variant: "destructive" }); }
  };

  const columns = [
    { key: "created_date", header: "Published", sortable: true, exportVal: (r) => r.created_date ? new Date(r.created_date).toISOString() : "", render: (r) => r.created_date ? new Date(r.created_date).toLocaleString() : "—" },
    { key: "title", header: "Title", sortable: true, render: (r) => <span className="font-medium text-foreground">{r.title}</span> },
    { key: "type", header: "Type", sortable: true, render: (r) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${TYPE_BADGE[r.type] || TYPE_BADGE.info}`}>{r.type}</span> },
    { key: "message", header: "Message", render: (r) => <span className="text-muted-foreground truncate max-w-[260px] inline-block align-bottom">{r.message}</span> },
    { key: "community_name", header: "Audience", render: (r) => r.community_name || "All Platform" },
    { key: "actions", header: "Actions", render: (r) => <button title="Delete" className={rowBtn} onClick={() => del(r.id)}><Trash2 className="w-4 h-4" /></button> },
  ];
  const bulkActions = [{ label: "Delete", variant: "destructive", onClick: bulkDel }];

  return (
    <AdminSection
      title="News & Announcements"
      description="Publish platform-wide and community announcements delivered to the alert feed."
      action={
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent><SelectItem value={null}>All Types</SelectItem>{["info", "warning", "emergency", "system"].map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={communityFilter} onValueChange={setCommunityFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Audiences" /></SelectTrigger>
            <SelectContent><SelectItem value={null}>All Audiences</SelectItem>{communities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Refresh</Button>
          <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4" /> Publish</Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-xl bg-card border border-border animate-pulse" />)}</div>
      ) : isError ? (
        <div className="text-center py-12 rounded-2xl border border-border bg-card">
          <Newspaper className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">Couldn't load announcements.</p>
          <p className="text-[11px] text-destructive/70 mb-3 font-mono px-4 break-all">{error?.message}</p>
          <Button size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Retry</Button>
        </div>
      ) : (
        <AdminDataTable
          columns={columns}
          rows={rows}
          rowKey="id"
          searchKeys={["title", "message", "community_name"]}
          bulkActions={rows.length ? bulkActions : []}
          exportFilename="announcements"
          emptyMessage="No announcements published yet."
        />
      )}
      <NewsFormDialog open={dialogOpen} onOpenChange={setDialogOpen} communities={communities} onSave={publish} />
    </AdminSection>
  );
}