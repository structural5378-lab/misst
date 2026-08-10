import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mist } from '@/api/mist';
import { useToast } from "@/components/ui/use-toast";
import AdminSection from "@/components/platform/AdminSection";
import AdminDataTable from "@/components/platform/AdminDataTable";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { MessagesSquare, RefreshCw, Trash2 } from "lucide-react";

const rowBtn = "p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10";

export default function PlatformAdminChat() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [communityFilter, setCommunityFilter] = useState("");

  const { data: messages = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-chat", communityFilter],
    queryFn: async () => (await mist.functions.invoke("adminEntityAdmin", { action: "list", entity: "ChatMessage", community_id: communityFilter || undefined }))?.data?.rows || [],
  });
  const { data: communities = [] } = useQuery({
    queryKey: ["admin-communities-mini"],
    queryFn: async () => (await mist.functions.invoke("adminManageCommunity", { action: "list" }))?.data?.communities || [],
  });

  const del = async (id) => {
    try {
      const res = await mist.functions.invoke("adminEntityAdmin", { action: "delete", entity: "ChatMessage", id });
      if (!res.data?.success) throw new Error(res.data?.error);
      toast({ title: "Message deleted" });
      qc.invalidateQueries({ queryKey: ["admin-chat"] });
    } catch (e) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  const bulkDel = async (rows) => {
    try {
      const res = await mist.functions.invoke("adminEntityAdmin", { action: "bulk_delete", entity: "ChatMessage", ids: rows.map((r) => r.id) });
      if (!res.data?.success) throw new Error(res.data?.error);
      toast({ title: `${rows.length} messages deleted` });
      qc.invalidateQueries({ queryKey: ["admin-chat"] });
    } catch (e) {
      toast({ title: "Bulk delete failed", description: e.message, variant: "destructive" });
    }
  };

  const columns = [
    { key: "created_date", header: "Sent", sortable: true, exportVal: (r) => r.created_date ? new Date(r.created_date).toISOString() : "", render: (r) => r.created_date ? new Date(r.created_date).toLocaleString() : "—" },
    { key: "sender_name", header: "Sender", sortable: true, render: (r) => r.sender_name || "—" },
    { key: "community_name", header: "Community", render: (r) => r.community_name || "—" },
    { key: "content", header: "Message", render: (r) => (
      <div className="max-w-[360px]">
        <span className="text-foreground/90 line-clamp-1">{r.content}</span>
        {r.image_url && <span className="ml-2 text-[10px] text-primary">[image]</span>}
      </div>
    ) },
    { key: "actions", header: "Actions", render: (r) => (
      <button title="Delete" className={rowBtn} onClick={() => del(r.id)}><Trash2 className="w-4 h-4" /></button>
    ) },
  ];

  const bulkActions = [
    { label: "Delete", variant: "destructive", onClick: bulkDel },
  ];

  return (
    <AdminSection
      title="Chat Moderation"
      description="Monitor and moderate chat messages across all communities."
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
          <MessagesSquare className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">Couldn't load chat messages.</p>
          <p className="text-[11px] text-destructive/70 mb-3 font-mono px-4 break-all">{error?.message}</p>
          <Button size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Retry</Button>
        </div>
      ) : (
        <AdminDataTable
          columns={columns}
          rows={messages}
          rowKey="id"
          searchKeys={["sender_name", "content", "community_name"]}
          bulkActions={messages.length ? bulkActions : []}
          exportFilename="chat-messages"
          emptyMessage="No chat messages found."
        />
      )}
    </AdminSection>
  );
}