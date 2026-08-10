import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mist } from '@/api/mist';
import { useToast } from "@/components/ui/use-toast";
import AdminSection from "@/components/platform/AdminSection";
import AdminDataTable from "@/components/platform/AdminDataTable";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Image, RefreshCw, Trash2 } from "lucide-react";

const rowBtn = "p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10";

export default function PlatformAdminMedia() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [communityFilter, setCommunityFilter] = useState("");

  const { data: photos = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-media", communityFilter],
    queryFn: async () => (await mist.functions.invoke("adminEntityAdmin", { action: "list", entity: "GatheringPhoto", community_id: communityFilter || undefined }))?.data?.rows || [],
  });
  const { data: communities = [] } = useQuery({
    queryKey: ["admin-communities-mini"],
    queryFn: async () => (await mist.functions.invoke("adminManageCommunity", { action: "list" }))?.data?.communities || [],
  });

  const del = async (id) => {
    try {
      const res = await mist.functions.invoke("adminEntityAdmin", { action: "delete", entity: "GatheringPhoto", id });
      if (!res.data?.success) throw new Error(res.data?.error);
      toast({ title: "Photo deleted" });
      qc.invalidateQueries({ queryKey: ["admin-media"] });
    } catch (e) { toast({ title: "Delete failed", description: e.message, variant: "destructive" }); }
  };
  const bulkDel = async (rows) => {
    try {
      const res = await mist.functions.invoke("adminEntityAdmin", { action: "bulk_delete", entity: "GatheringPhoto", ids: rows.map((r) => r.id) });
      if (!res.data?.success) throw new Error(res.data?.error);
      toast({ title: `${rows.length} photos deleted` });
      qc.invalidateQueries({ queryKey: ["admin-media"] });
    } catch (e) { toast({ title: "Bulk delete failed", description: e.message, variant: "destructive" }); }
  };

  const columns = [
    { key: "photo_url", header: "Preview", render: (r) => r.photo_url ? <img src={r.photo_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-border" /> : <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center"><Image className="w-4 h-4 text-muted-foreground" /></div> },
    { key: "caption", header: "Caption", render: (r) => <span className="text-muted-foreground truncate max-w-[220px] inline-block align-bottom">{r.caption || "—"}</span> },
    { key: "gathering_label", header: "Gathering", render: (r) => r.gathering_label || "—" },
    { key: "uploader_name", header: "Uploader", sortable: true, render: (r) => r.uploader_name || "—" },
    { key: "community_name", header: "Community", render: (r) => r.community_name || "—" },
    { key: "created_date", header: "Uploaded", sortable: true, exportVal: (r) => r.created_date ? new Date(r.created_date).toISOString() : "", render: (r) => r.created_date ? new Date(r.created_date).toLocaleDateString() : "—" },
    { key: "actions", header: "Actions", render: (r) => <button title="Delete" className={rowBtn} onClick={() => del(r.id)}><Trash2 className="w-4 h-4" /></button> },
  ];
  const bulkActions = [{ label: "Delete", variant: "destructive", onClick: bulkDel }];

  return (
    <AdminSection
      title="Media Library"
      description="Manage community gallery photos and uploaded media across the platform."
      action={
        <div className="flex gap-2">
          <Select value={communityFilter} onValueChange={setCommunityFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Communities" /></SelectTrigger>
            <SelectContent><SelectItem value={null}>All Communities</SelectItem>{communities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Refresh</Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-xl bg-card border border-border animate-pulse" />)}</div>
      ) : isError ? (
        <div className="text-center py-12 rounded-2xl border border-border bg-card">
          <Image className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">Couldn't load media.</p>
          <p className="text-[11px] text-destructive/70 mb-3 font-mono px-4 break-all">{error?.message}</p>
          <Button size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Retry</Button>
        </div>
      ) : (
        <AdminDataTable
          columns={columns}
          rows={photos}
          rowKey="id"
          searchKeys={["caption", "uploader_name", "community_name", "gathering_label"]}
          bulkActions={photos.length ? bulkActions : []}
          exportFilename="media"
          emptyMessage="No media uploads found."
        />
      )}
    </AdminSection>
  );
}