import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mist } from '@/api/mist';
import { useToast } from "@/components/ui/use-toast";
import AdminSection from "@/components/platform/AdminSection";
import AdminDataTable from "@/components/platform/AdminDataTable";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Pin, PinOff, Lock, Unlock, Star, StarOff, Trash2, RotateCcw, MessageSquare, RefreshCw,
} from "lucide-react";

const rowBtn = "p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10";

export default function PlatformAdminForum() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [communityFilter, setCommunityFilter] = useState("");

  const { data: threads = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-threads", communityFilter],
    queryFn: async () => (await mist.functions.invoke("adminModerateContent", { action: "list", community_id: communityFilter || undefined }))?.data?.threads || [],
  });
  const { data: communities = [] } = useQuery({
    queryKey: ["admin-communities-mini"],
    queryFn: async () => (await mist.functions.invoke("adminManageCommunity", { action: "list" }))?.data?.communities || [],
  });

  const act = async (action, payload, okMsg) => {
    try {
      const res = await mist.functions.invoke("adminModerateContent", { action, ...payload });
      if (!res.data?.success) throw new Error(res.data?.error || "Action failed");
      toast({ title: okMsg });
      qc.invalidateQueries({ queryKey: ["admin-threads"] });
    } catch (e) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    }
  };

  const columns = [
    { key: "title", header: "Thread", sortable: true, render: (r) => (
      <div className="flex items-center gap-1.5 max-w-[260px]">
        {r.is_deleted && <span className="text-[9px] font-bold text-destructive border border-destructive/40 px-1 rounded">DELETED</span>}
        <span className="truncate text-foreground font-medium">{r.title}</span>
      </div>
    ) },
    { key: "author_name", header: "Author", sortable: true, render: (r) => r.author_name || "—" },
    { key: "community_name", header: "Community", sortable: true, render: (r) => r.community_name || "—" },
    { key: "category_name", header: "Category", render: (r) => r.category_name || "—" },
    { key: "reply_count", header: "Replies", sortable: true },
    { key: "view_count", header: "Views", sortable: true },
    { key: "flags", header: "Flags", render: (r) => (
      <div className="flex gap-1">
        {r.is_pinned && <Pin className="w-3.5 h-3.5 text-primary" />}
        {r.is_locked && <Lock className="w-3.5 h-3.5 text-amber-400" />}
        {r.is_featured && <Star className="w-3.5 h-3.5 text-yellow-400" />}
      </div>
    ) },
    { key: "updated_date", header: "Updated", sortable: true, exportVal: (r) => r.updated_date ? new Date(r.updated_date).toISOString() : "", render: (r) => r.updated_date ? new Date(r.updated_date).toLocaleDateString() : "—" },
    { key: "actions", header: "Actions", render: (r) => (
      <div className="flex items-center gap-0.5">
        <button title={r.is_pinned ? "Unpin" : "Pin"} className={rowBtn} onClick={() => act(r.is_pinned ? "unpin" : "pin", { thread_id: r.id }, r.is_pinned ? "Unpinned" : "Pinned")}>{r.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}</button>
        <button title={r.is_locked ? "Unlock" : "Lock"} className={rowBtn} onClick={() => act(r.is_locked ? "unlock" : "lock", { thread_id: r.id }, r.is_locked ? "Unlocked" : "Locked")}>{r.is_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}</button>
        <button title={r.is_featured ? "Unfeature" : "Feature"} className={rowBtn} onClick={() => act(r.is_featured ? "unfeature" : "feature", { thread_id: r.id }, r.is_featured ? "Unfeatured" : "Featured")}>{r.is_featured ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}</button>
        {r.is_deleted ? (
          <button title="Restore" className={rowBtn} onClick={() => act("restore", { thread_id: r.id }, "Thread restored")}><RotateCcw className="w-4 h-4" /></button>
        ) : (
          <button title="Delete" className={`${rowBtn} hover:text-destructive hover:bg-destructive/10`} onClick={() => act("delete", { thread_id: r.id }, "Thread deleted")}><Trash2 className="w-4 h-4" /></button>
        )}
      </div>
    ) },
  ];

  const bulkActions = [
    { label: "Pin", variant: "secondary", onClick: (rows) => act("bulk_pin", { thread_ids: rows.map((r) => r.id) }, `${rows.length} pinned`) },
    { label: "Lock", variant: "secondary", onClick: (rows) => act("bulk_lock", { thread_ids: rows.map((r) => r.id) }, `${rows.length} locked`) },
    { label: "Feature", variant: "secondary", onClick: (rows) => act("bulk_feature", { thread_ids: rows.map((r) => r.id) }, `${rows.length} featured`) },
    { label: "Delete", variant: "destructive", onClick: (rows) => act("bulk_delete", { thread_ids: rows.map((r) => r.id) }, `${rows.length} deleted`) },
    { label: "Restore", variant: "ghost", onClick: (rows) => act("bulk_restore", { thread_ids: rows.map((r) => r.id) }, `${rows.length} restored`) },
  ];

  const stats = useMemo(() => ({
    total: threads.length,
    pinned: threads.filter((t) => t.is_pinned).length,
    locked: threads.filter((t) => t.is_locked).length,
    deleted: threads.filter((t) => t.is_deleted).length,
  }), [threads]);

  return (
    <AdminSection
      title="Forum Moderation"
      description="Pin, lock, feature, delete, and restore threads across every community."
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total Threads", value: stats.total },
          { label: "Pinned", value: stats.pinned },
          { label: "Locked", value: stats.locked },
          { label: "Deleted", value: stats.deleted },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-xl bg-card border border-border animate-pulse" />)}</div>
      ) : isError ? (
        <div className="text-center py-12 rounded-2xl border border-border bg-card">
          <MessageSquare className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">Couldn't load forum threads.</p>
          <p className="text-[11px] text-destructive/70 mb-3 font-mono px-4 break-all">{error?.message}</p>
          <Button size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Retry</Button>
        </div>
      ) : (
        <AdminDataTable
          columns={columns}
          rows={threads}
          rowKey="id"
          searchKeys={["title", "author_name", "community_name", "category_name"]}
          bulkActions={threads.length ? bulkActions : []}
          exportFilename="forum-threads"
          emptyMessage="No forum threads found."
        />
      )}
    </AdminSection>
  );
}