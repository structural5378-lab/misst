import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { mist } from '@/api/mist';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCw, Eye, Clock } from "lucide-react";
import AdminSection from "@/components/platform/AdminSection";
import AdminDataTable from "@/components/platform/AdminDataTable";
import NotificationAdminTabs from "@/components/platform/NotificationAdminTabs";
import { NOTIF_FILTERS } from "@/lib/notificationTypes";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STATUS_STYLE = {
  sent: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", label: "Sent" },
  delivered: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", label: "Delivered" },
  pending: { color: "#eab308", bg: "rgba(234,179,8,0.12)", label: "Pending" },
  failed: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Failed" },
  expired: { color: "#6b7280", bg: "rgba(107,114,128,0.12)", label: "Expired" },
  opened: { color: "#06b6d4", bg: "rgba(6,182,212,0.12)", label: "Opened" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || { color: "#6b7280", bg: "rgba(107,114,128,0.12)", label: status };
  return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ color: s.color, background: s.bg }}>{s.label}</span>;
}

function fmtTime(iso) { if (!iso) return "—"; try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }); } catch { return "—"; } }
function fmtDateTime(iso) { if (!iso) return "—"; try { return new Date(iso).toLocaleString(); } catch { return "—"; } }

export default function PlatformAdminNotificationLogs() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [viewRow, setViewRow] = useState(null);

  const { data: deliveries = [] } = useQuery({ queryKey: ["notif-deliveries"], queryFn: () => base44.asServiceRole?.entities?.NotificationDelivery ? base44.asServiceRole.entities.NotificationDelivery.filter({}, "-created_date", 2000) : mist.entities.NotificationDelivery.filter({}, "-created_date", 2000) });
  const { data: users = [] } = useQuery({ queryKey: ["notif-users"], queryFn: () => mist.entities.User.list("-created_date", 500) });
  const { data: communities = [] } = useQuery({ queryKey: ["notif-communities"], queryFn: () => mist.entities.Community.list("-created_date", 500) });
  const { data: notifications = [] } = useQuery({ queryKey: ["notif-records"], queryFn: () => mist.entities.Notification.list("-created_date", 2000) });

  const userMap = useMemo(() => new Map((users || []).map((u) => [u.id, u.full_name || u.email || u.id])), [users]);
  const commMap = useMemo(() => new Map((communities || []).map((c) => [c.id, c.name])), [communities]);
  const notifMap = useMemo(() => new Map((notifications || []).map((n) => [n.id, n])), [notifications]);

  const rows = useMemo(() => {
    return (deliveries || []).filter((d) => !statusFilter || d.status === statusFilter).map((d) => {
      const notif = notifMap.get(d.notification_id);
      const dur = d.sent_at && d.created_date ? Math.max(0, new Date(d.sent_at) - new Date(d.created_date)) : null;
      return {
        ...d,
        user_name: userMap.get(d.recipient_id) || d.recipient_id?.slice(0, 8) || "—",
        community_name: notif?.community_id ? (commMap.get(notif.community_id) || "—") : "—",
        category_label: NOTIF_FILTERS.find((f) => f.id === d.type)?.label || d.type,
        duration_ms: dur,
      };
    });
  }, [deliveries, statusFilter, userMap, commMap, notifMap]);

  const retry = useMutation({
    mutationFn: (id) => mist.functions.invoke("adminNotifications", { action: "retry", delivery_id: id }),
    onSuccess: (res) => {
      const d = res?.data;
      toast({ title: d?.ok ? `Retry ${d.status}` : "Retry failed", description: d?.errors?.[0] || "", duration: 2500 });
      qc.invalidateQueries(["notif-deliveries"]);
    },
    onError: (e) => toast({ title: "Retry error", description: String(e?.message || e), variant: "destructive" }),
  });

  const columns = [
    { key: "created_date", header: "Time", sortable: true, render: (r) => <span className="text-xs">{fmtDateTime(r.created_date)}</span> },
    { key: "user_name", header: "User", sortable: true },
    { key: "community_name", header: "Community" },
    { key: "category_label", header: "Category", render: (r) => <span className="text-xs">{r.category_label}</span> },
    { key: "title", header: "Title", render: (r) => <span className="text-xs max-w-[180px] truncate inline-block align-bottom">{r.title || "—"}</span> },
    { key: "status", header: "Status", sortable: true, render: (r) => <StatusBadge status={r.status} /> },
    { key: "fcm_message_id", header: "FCM Message ID", render: (r) => <span className="text-[10px] text-muted-foreground font-mono">{r.fcm_message_id ? r.fcm_message_id.slice(-12) : "—"}</span> },
    { key: "platforms", header: "Platform", render: (r) => { try { return JSON.parse(r.platforms || "[]").join(", ") || "web"; } catch { return "web"; } } },
    { key: "token_preview", header: "Token", render: (r) => <span className="text-[10px] text-muted-foreground font-mono">{r.token_preview || "—"}</span> },
    { key: "duration_ms", header: "Duration", sortable: true, render: (r) => r.duration_ms != null ? `${r.duration_ms}ms` : "—" },
    { key: "_actions", header: "", render: (r) => (
      <div className="flex items-center gap-1">
        {r.status === "failed" && <button onClick={() => retry.mutate(r.id)} title="Retry" className="p-1.5 text-primary hover:bg-primary/10 rounded"><RotateCw className="w-3.5 h-3.5" /></button>}
        <button onClick={() => setViewRow(r)} title="View" className="p-1.5 text-muted-foreground hover:bg-muted rounded"><Eye className="w-3.5 h-3.5" /></button>
      </div>
    ) },
  ];

  return (
    <AdminSection title="Delivery Logs" description="Every notification delivery — searchable, filterable, exportable">
      <NotificationAdminTabs />
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground">Status:</span>
        {[{ id: "", label: "All" }, { id: "sent", label: "Sent" }, { id: "delivered", label: "Delivered" }, { id: "failed", label: "Failed" }, { id: "pending", label: "Pending" }, { id: "expired", label: "Expired" }].map((s) => (
          <button key={s.id} onClick={() => setStatusFilter(s.id)} className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${statusFilter === s.id ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground border border-border"}`}>{s.label}</button>
        ))}
      </div>
      <AdminDataTable
        columns={columns}
        rows={rows}
        searchKeys={["user_name", "title", "recipient_id", "type", "fcm_message_id"]}
        pageSize={15}
        exportFilename="notification-deliveries"
        emptyMessage="No delivery records found."
      />

      <Dialog open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Delivery Details</DialogTitle></DialogHeader>
          {viewRow && (
            <div className="space-y-2 text-sm">
              <Row label="Status"><StatusBadge status={viewRow.status} /></Row>
              <Row label="Category">{viewRow.category_label}</Row>
              <Row label="Title">{viewRow.title || "—"}</Row>
              <Row label="Recipient">{viewRow.user_name}</Row>
              <Row label="Community">{viewRow.community_name}</Row>
              <Row label="FCM Message ID"><code className="text-xs">{viewRow.fcm_message_id || "—"}</code></Row>
              <Row label="Token Preview"><code className="text-xs">{viewRow.token_preview || "—"}</code></Row>
              <Row label="Platforms">{(() => { try { return JSON.parse(viewRow.platforms || "[]").join(", ") || "web"; } catch { return "web"; } })()}</Row>
              <Row label="Last Error">{viewRow.last_error || "—"}</Row>
              <Row label="Attempts">{viewRow.attempts || 0} / {viewRow.max_attempts || 5}</Row>
              <div className="border-t border-border pt-2 mt-2">
                <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Timeline</p>
                <Timeline label="Created" value={fmtDateTime(viewRow.created_date)} />
                <Timeline label="Sent" value={fmtDateTime(viewRow.sent_at)} />
                <Timeline label="Delivered" value={fmtDateTime(viewRow.delivered_at)} />
                <Timeline label="Opened" value={fmtDateTime(viewRow.opened_at)} />
                <Timeline label="Failed" value={fmtDateTime(viewRow.failed_at)} />
                {viewRow.next_retry_at && <Timeline label="Next Retry" value={fmtDateTime(viewRow.next_retry_at)} />}
              </div>
              {viewRow.status === "failed" && <button onClick={() => { retry.mutate(viewRow.id); setViewRow(null); }} className="w-full mt-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5"><RotateCw className="w-4 h-4" /> Retry Now</button>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminSection>
  );
}

function Row({ label, children }) {
  return <div className="flex justify-between gap-3 py-0.5"><span className="text-muted-foreground">{label}</span><span className="text-right">{children}</span></div>;
}
function Timeline({ label, value }) {
  return <div className="flex justify-between text-xs py-0.5"><span className="text-muted-foreground">{label}</span><span className="text-foreground">{value}</span></div>;
}