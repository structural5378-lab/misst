import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trash2, Mail, MessageSquare } from "lucide-react";
import AdminSection from "@/components/platform/AdminSection";
import AdminDataTable from "@/components/platform/AdminDataTable";
import AdminStatCard from "@/components/platform/AdminStatCard";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

export default function PlatformAdminPrivateMessages() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: convos } = useQuery({ queryKey: ["admin-pm-convos"], queryFn: async () => await base44.entities.Conversation.list(300), refetchInterval: 60000 });
  const { data: messages } = useQuery({ queryKey: ["admin-pm-messages"], queryFn: async () => await base44.entities.DMMessage.list(200), refetchInterval: 60000 });

  const convRows = convos || [];
  const totalMsgs = (messages || []).length;

  const deleteConvo = async (id) => {
    try {
      await base44.entities.Conversation.delete(id);
      toast({ title: "Conversation removed" });
      qc.invalidateQueries(["admin-pm-convos"]);
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const bulkDelete = async (selected) => {
    if (!selected.length) return;
    for (const r of selected) {
      try { await base44.entities.Conversation.delete(r.id); } catch (e) { /* ignore */ }
    }
    toast({ title: `${selected.length} conversation(s) removed` });
    qc.invalidateQueries(["admin-pm-convos"]);
  };

  const columns = [
    { key: "type", header: "Type", sortable: true, render: (r) => <span className={`text-xs px-2 py-0.5 rounded ${r.type === "group" ? "bg-violet-500/15 text-violet-300" : "bg-cyan-500/15 text-cyan-300"}`}>{r.type === "group" ? "Group" : "Direct"}</span> },
    { key: "title", header: "Title / Preview", render: (r) => <div className="min-w-[180px]"><div className="text-sm text-foreground truncate">{r.title || "Direct conversation"}</div><div className="text-xs text-muted-foreground truncate">{r.last_message_preview || "—"}</div></div> },
    { key: "last_message_sender_name", header: "Last Sender", sortable: true, render: (r) => r.last_message_sender_name || "—" },
    { key: "last_message_at", header: "Last Activity", sortable: true, render: (r) => r.last_message_at ? new Date(r.last_message_at).toLocaleString() : "—" },
    { key: "actions", header: "Actions", render: (r) => <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => deleteConvo(r.id)}><Trash2 className="w-3.5 h-3.5" /></Button> },
  ];

  return (
    <AdminSection title="Private Messages" description="Oversight of direct and group conversations across the platform.">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <AdminStatCard icon={MessageSquare} label="Conversations" value={convRows.length} color="violet" />
        <AdminStatCard icon={Mail} label="Messages (sample)" value={totalMsgs} color="cyan" />
        <AdminStatCard icon={MessageSquare} label="Group Chats" value={convRows.filter((c) => c.type === "group").length} color="emerald" />
      </div>
      <AdminDataTable columns={columns} rows={convRows} searchKeys={["title", "last_message_preview", "last_message_sender_name"]} bulkActions={[{ label: "Delete Selected", variant: "destructive", onClick: bulkDelete }]} exportFilename="private-messages" />
    </AdminSection>
  );
}