import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mist } from '@/api/mist';
import AdminSection from "@/components/platform/AdminSection";
import AdminDataTable from "@/components/platform/AdminDataTable";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ShieldAlert, RefreshCw } from "lucide-react";

export default function PlatformAdminAuditLog() {
  const [source, setSource] = useState("platform");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-audit-logs", source],
    queryFn: async () => {
      const res = await mist.functions.invoke("adminListAuditLogs", { source });
      console.log("[AuditLog] loaded", res.data);
      return res.data || { platform: [], rbac: [] };
    },
  });

  const rows = useMemo(() => {
    if (source === "platform") {
      return (data?.platform || []).map((r) => ({
        id: r.id,
        created_date: r.created_date,
        admin_email: r.admin_email || "—",
        action: r.action || "",
        target_type: r.target_type || "",
        target_name: r.target_name || "—",
        community_name: r.community_name || "",
        ip_address: r.ip_address || "",
        notes: r.notes || "",
      }));
    }
    return (data?.rbac || []).map((r) => ({
      id: r.id,
      created_date: r.created_date,
      admin_email: r.admin_email || "—",
      action: r.action || "",
      target_type: r.target_user_email || r.role_name || "",
      target_name: r.role_name || r.target_user_email || "—",
      community_name: "",
      ip_address: r.ip_address || "",
      notes: r.reason || r.permission_required || "",
    }));
  }, [data, source]);

  const columns = [
    { key: "created_date", header: "Timestamp", sortable: true, exportVal: (r) => r.created_date ? new Date(r.created_date).toISOString() : "", render: (r) => r.created_date ? new Date(r.created_date).toLocaleString() : "—" },
    { key: "admin_email", header: "Admin", sortable: true },
    { key: "action", header: "Action", sortable: true, render: (r) => <span className="font-mono text-primary">{r.action}</span> },
    { key: "target_type", header: "Target Type", sortable: true },
    { key: "target_name", header: "Target", render: (r) => <span className="text-muted-foreground truncate max-w-[200px] inline-block align-bottom">{r.target_name}</span> },
    { key: "community_name", header: "Community", render: (r) => r.community_name || "—" },
    { key: "ip_address", header: "IP", render: (r) => r.ip_address || "—" },
    { key: "notes", header: "Notes", render: (r) => <span className="text-muted-foreground truncate max-w-[220px] inline-block align-bottom">{r.notes}</span> },
  ];

  return (
    <AdminSection
      title="Security Audit Log"
      description="Immutable record of every administrative and permission action across the platform."
      action={<div className="flex gap-2">
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="platform">Platform Actions</SelectItem>
            <SelectItem value="rbac">Permission Changes</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Refresh</Button>
      </div>}
    >
      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-xl bg-card border border-border animate-pulse" />)}</div>
      ) : isError ? (
        <div className="text-center py-12 rounded-2xl border border-border bg-card">
          <ShieldAlert className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">Couldn't load audit logs.</p>
          <p className="text-[11px] text-destructive/70 mb-3 font-mono px-4 break-all">{error?.message}</p>
          <Button size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Retry</Button>
        </div>
      ) : (
        <AdminDataTable
          columns={columns}
          rows={rows}
          rowKey="id"
          searchKeys={["admin_email", "action", "target_name", "target_type", "notes"]}
          exportFilename={`audit-${source}`}
          emptyMessage={source === "platform" ? "No platform actions logged yet." : "No permission changes logged yet."}
        />
      )}
    </AdminSection>
  );
}