import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mist } from '@/api/mist';
import { Building, Users, ShieldCheck, Eye, EyeOff, Archive, PauseCircle, PlayCircle, Trash2, ExternalLink } from "lucide-react";
import AdminSection from "@/components/platform/AdminSection";
import AdminStatCard from "@/components/platform/AdminStatCard";
import AdminDataTable from "@/components/platform/AdminDataTable";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function StatusBadge({ status }) {
  const map = {
    active: "bg-success/15 text-success",
    suspended: "bg-warning/15 text-warning",
    archived: "bg-muted text-muted-foreground",
    pending: "bg-info/15 text-info",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${map[status] || map.active}`}>{status || "active"}</span>;
}

function PrivacyBadge({ v }) {
  return v === "public"
    ? <span className="inline-flex items-center gap-1 text-xs text-success"><Eye className="w-3 h-3" />Public</span>
    : <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><EyeOff className="w-3 h-3" />Private</span>;
}

export default function PlatformAdminCommunities() {
  const qc = useQueryClient();
  const { data: communities = [], isLoading } = useQuery({
    queryKey: ["admin-community-list"],
    queryFn: async () => {
      const res = await mist.functions.invoke("adminManageCommunity", { action: "list" });
      return res.data?.communities || [];
    },
  });

  const [statusFilter, setStatusFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");

  const filtered = useMemo(() => {
    return communities.filter((c) => {
      if (statusFilter !== "all" && (c.status || "active") !== statusFilter) return false;
      if (visibilityFilter !== "all" && c.visibility !== visibilityFilter) return false;
      return true;
    });
  }, [communities, statusFilter, visibilityFilter]);

  const stats = useMemo(() => {
    const total = communities.length;
    const active = communities.filter((c) => (c.status || "active") === "active").length;
    const suspended = communities.filter((c) => c.status === "suspended").length;
    const archived = communities.filter((c) => c.status === "archived").length;
    const pub = communities.filter((c) => c.visibility === "public").length;
    const members = communities.reduce((s, c) => s + (c.member_count_real || c.member_count || 0), 0);
    const mods = communities.reduce((s, c) => s + (c.moderator_count || 0), 0);
    return { total, active, suspended, archived, pub, priv: total - pub, members, mods };
  }, [communities]);

  const runBulk = async (action, rows) => {
    const ids = rows.map((r) => r.id);
    if (!ids.length) return;
    if (action === "bulk_delete" && !window.confirm(`Permanently delete ${ids.length} communities and all their data? This cannot be undone.`)) return;
    try {
      await mist.functions.invoke("adminManageCommunity", { action, community_ids: ids });
      qc.invalidateQueries(["admin-community-list"]);
    } catch (e) {
      window.alert(e?.response?.data?.error || e?.message || "Action failed");
    }
  };

  const rowAction = async (action, c) => {
    if (action === "delete" && !window.confirm(`Permanently delete "${c.name}" and all its data?`)) return;
    try {
      await mist.functions.invoke("adminManageCommunity", { action, community_id: c.id });
      qc.invalidateQueries(["admin-community-list"]);
    } catch (e) {
      window.alert(e?.response?.data?.error || e?.message || "Action failed");
    }
  };

  const columns = [
    {
      key: "name", header: "Community", sortable: true,
      render: (c) => (
        <div className="flex items-center gap-2.5 min-w-[180px]">
          {c.logo_url
            ? <img src={c.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
            : <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center"><Building className="w-4 h-4 text-primary" /></div>}
          <div className="min-w-0">
            <Link to={`/platform/admin/communities/${c.id}`} className="text-sm font-medium text-foreground hover:text-primary truncate block">{c.name}</Link>
            <span className="text-xs text-muted-foreground truncate block">{c.slug}</span>
          </div>
        </div>
      )
    },
    { key: "id", header: "ID", render: (c) => <span className="font-mono text-[10px] text-muted-foreground">{String(c.id).slice(-8)}</span> },
    { key: "owner_name", header: "Owner", sortable: true, render: (c) => <span className="text-xs">{c.owner_name || "—"}</span> },
    { key: "member_count_real", header: "Members", sortable: true, render: (c) => <span className="text-xs font-medium">{c.member_count_real ?? c.member_count ?? 0}</span> },
    { key: "moderator_count", header: "Mods", sortable: true, render: (c) => <span className="text-xs">{c.moderator_count || 0}</span> },
    { key: "created_date", header: "Created", sortable: true, render: (c) => <span className="text-xs text-muted-foreground">{c.created_date ? new Date(c.created_date).toLocaleDateString() : "—"}</span> },
    { key: "visibility", header: "Privacy", sortable: true, render: (c) => <PrivacyBadge v={c.visibility} /> },
    { key: "status", header: "Status", sortable: true, render: (c) => <StatusBadge status={c.status || "active"} /> },
    { key: "updated_date", header: "Last Activity", sortable: true, render: (c) => <span className="text-xs text-muted-foreground">{c.updated_date ? new Date(c.updated_date).toLocaleString() : "—"}</span> },
    {
      key: "_actions", header: "",
      render: (c) => (
        <div className="flex items-center gap-1">
          <Link to={`/platform/admin/communities/${c.id}`}><Button size="sm" variant="ghost" className="h-7 px-2 text-xs">Manage</Button></Link>
          <Link to={`/c/${c.slug}`} target="_blank"><Button size="icon" variant="ghost" className="h-7 w-7"><ExternalLink className="w-3.5 h-3.5" /></Button></Link>
          {c.status === "suspended"
            ? <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-success" onClick={() => rowAction("reactivate", c)}>Reactivate</Button>
            : <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-warning" onClick={() => rowAction("suspend", c)}>Suspend</Button>}
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => rowAction("delete", c)}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      )
    },
  ];

  const bulkActions = [
    { label: "Suspend", variant: "secondary", onClick: (rows) => runBulk("bulk_suspend", rows) },
    { label: "Activate", variant: "secondary", onClick: (rows) => runBulk("bulk_activate", rows) },
    { label: "Archive", variant: "secondary", onClick: (rows) => runBulk("bulk_archive", rows) },
    { label: "Delete", variant: "destructive", onClick: (rows) => runBulk("bulk_delete", rows) },
  ];

  return (
    <AdminSection
      title="Community Management"
      description="Full platform-wide control over every community"
      action={
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
            <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Privacy" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Privacy</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <AdminStatCard icon={Building} label="Total Communities" value={stats.total} color="violet" loading={isLoading} />
        <AdminStatCard icon={PlayCircle} label="Active" value={stats.active} color="emerald" loading={isLoading} />
        <AdminStatCard icon={PauseCircle} label="Suspended" value={stats.suspended} color="amber" loading={isLoading} />
        <AdminStatCard icon={Archive} label="Archived" value={stats.archived} color="cyan" loading={isLoading} />
        <AdminStatCard icon={Users} label="Total Members" value={stats.members} color="blue" loading={isLoading} />
        <AdminStatCard icon={ShieldCheck} label="Moderators" value={stats.mods} color="rose" loading={isLoading} />
        <AdminStatCard icon={Eye} label="Public" value={stats.pub} color="emerald" loading={isLoading} />
        <AdminStatCard icon={EyeOff} label="Private" value={stats.priv} color="violet" loading={isLoading} />
      </div>
      <AdminDataTable
        columns={columns}
        rows={filtered}
        searchKeys={["name", "slug", "owner_name"]}
        pageSize={12}
        bulkActions={bulkActions}
        exportFilename="communities"
        rowKey="id"
        emptyMessage="No communities found."
      />
    </AdminSection>
  );
}