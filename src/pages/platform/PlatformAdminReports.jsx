import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mist } from '@/api/mist';
import { useToast } from "@/components/ui/use-toast";
import AdminSection from "@/components/platform/AdminSection";
import AdminDataTable from "@/components/platform/AdminDataTable";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardList, RefreshCw, Trash2, CheckCircle2, XCircle } from "lucide-react";

const REASON_BADGE = {
  spam: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  harassment: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  offensive: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  misinformation: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  illegal: "bg-red-600/15 text-red-400 border-red-600/30",
  safety: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  other: "bg-muted text-muted-foreground border-border",
};
const STATUS_BADGE = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  dismissed: "bg-muted text-muted-foreground border-border",
};

export default function PlatformAdminReports() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [detail, setDetail] = useState(null); // report being reviewed
  const [resolution, setResolution] = useState("no_action");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: reports = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-reports", statusFilter],
    queryFn: async () => (await mist.functions.invoke("adminManageReport", { action: "list", status: statusFilter || undefined }))?.data?.reports || [],
  });

  const columns = [
    { key: "created_date", header: "Reported", sortable: true, exportVal: (r) => r.created_date ? new Date(r.created_date).toISOString() : "", render: (r) => r.created_date ? new Date(r.created_date).toLocaleString() : "—" },
    { key: "reporter_name", header: "Reporter", sortable: true, render: (r) => r.reporter_name || r.reporter_email || "—" },
    { key: "target_type", header: "Type", sortable: true, render: (r) => <span className="capitalize">{r.target_type}</span> },
    { key: "target_name", header: "Content", render: (r) => <span className="text-muted-foreground truncate max-w-[220px] inline-block align-bottom">{r.target_name || r.target_id}</span> },
    { key: "reason", header: "Reason", sortable: true, render: (r) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${REASON_BADGE[r.reason] || REASON_BADGE.other}`}>{r.reason}</span> },
    { key: "community_name", header: "Community", render: (r) => r.community_name || "—" },
    { key: "status", header: "Status", sortable: true, render: (r) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${STATUS_BADGE[r.status]}`}>{r.status}</span> },
  ];

  const call = async (action, payload, okMsg) => {
    setBusy(true);
    try {
      const res = await mist.functions.invoke("adminManageReport", { action, ...payload });
      if (!res.data?.success) throw new Error(res.data?.error || "Action failed");
      toast({ title: okMsg });
      setDetail(null);
      setNotes("");
      qc.invalidateQueries({ queryKey: ["admin-reports"] });
    } catch (e) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const bulkActions = [
    { label: "Resolve", variant: "secondary", onClick: (rows) => call("bulk_resolve", { report_ids: rows.map((r) => r.id) }, `${rows.length} reports resolved`) },
    { label: "Dismiss", variant: "ghost", onClick: (rows) => call("bulk_dismiss", { report_ids: rows.map((r) => r.id) }, `${rows.length} reports dismissed`) },
  ];

  return (
    <AdminSection
      title="Reports & Moderation Queue"
      description="User-submitted reports and flagged content across the platform."
      action={
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Refresh</Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-xl bg-card border border-border animate-pulse" />)}</div>
      ) : isError ? (
        <div className="text-center py-12 rounded-2xl border border-border bg-card">
          <ClipboardList className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">Couldn't load reports.</p>
          <p className="text-[11px] text-destructive/70 mb-3 font-mono px-4 break-all">{error?.message}</p>
          <Button size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Retry</Button>
        </div>
      ) : (
        <AdminDataTable
          columns={columns}
          rows={reports}
          rowKey="id"
          searchKeys={["reporter_name", "reporter_email", "target_name", "target_type", "reason", "details"]}
          bulkActions={reports.length ? bulkActions : []}
          exportFilename="reports"
          emptyMessage={statusFilter === "pending" ? "No pending reports. The queue is clear." : "No reports for this filter."}
        />
      )}

      {/* When a single report is selected for review — render a review panel is handled inline below via a button column? AdminDataTable has no row action. Add a quick review bar: */}
      {reports.length > 0 && (
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reports.slice(0, 6).map((r) => (
            <button key={r.id} onClick={() => { setDetail(r); setResolution("no_action"); setNotes(""); }} className="text-left rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${REASON_BADGE[r.reason] || REASON_BADGE.other}`}>{r.reason}</span>
                <span className="text-[10px] text-muted-foreground">{r.created_date ? new Date(r.created_date).toLocaleDateString() : ""}</span>
              </div>
              <p className="text-sm font-medium text-foreground truncate">{r.target_name || r.target_type}</p>
              <p className="text-xs text-muted-foreground truncate">by {r.reporter_name || r.reporter_email || "Unknown"}</p>
              {r.details && <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">{r.details}</p>}
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 py-1">
              <div className="text-xs space-y-1">
                <div><span className="text-muted-foreground">Type:</span> <span className="capitalize text-foreground">{detail.target_type}</span></div>
                <div><span className="text-muted-foreground">Reason:</span> <span className="capitalize text-foreground">{detail.reason}</span></div>
                <div><span className="text-muted-foreground">Reporter:</span> <span className="text-foreground">{detail.reporter_name || detail.reporter_email || "—"}</span></div>
                <div><span className="text-muted-foreground">Community:</span> <span className="text-foreground">{detail.community_name || "—"}</span></div>
                <div><span className="text-muted-foreground">Target:</span> <span className="text-foreground">{detail.target_name || detail.target_id}</span></div>
              </div>
              {detail.details && <div className="rounded-xl bg-secondary/40 border border-border p-3 text-sm text-foreground/90">{detail.details}</div>}
              <div>
                <Label>Resolution</Label>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_action">No Action</SelectItem>
                    <SelectItem value="warned">Warned User</SelectItem>
                    <SelectItem value="removed">Removed Content</SelectItem>
                    <SelectItem value="banned">Banned User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Admin Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" placeholder="Optional internal note…" rows={3} />
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-between gap-2">
            <Button variant="destructive" disabled={busy} onClick={() => call("delete_target", { report_id: detail?.id, admin_notes: notes }, "Content removed & report closed")}><Trash2 className="w-4 h-4" /> Remove Content</Button>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={busy} onClick={() => call("dismiss", { report_id: detail?.id, admin_notes: notes }, "Report dismissed")}><XCircle className="w-4 h-4" /> Dismiss</Button>
              <Button disabled={busy} onClick={() => call("resolve", { report_id: detail?.id, resolution, admin_notes: notes }, "Report resolved")}><CheckCircle2 className="w-4 h-4" /> Resolve</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminSection>
  );
}