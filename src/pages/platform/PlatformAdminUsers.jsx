import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import AdminSection from "@/components/platform/AdminSection";
import UserActionModal from "@/components/platform/UserActionModal";
import { Input } from "@/components/ui/input";

export default function PlatformAdminUsers() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await base44.functions.invoke("adminManageUser", { action: "list" });
      return res.data?.users || [];
    },
  });

  const filtered = users.filter(u =>
    !search ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.callsign?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminSection
      title="User Management"
      description={`${users.length} users on the platform`}
      action={
        <div className="relative w-48 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="pl-9 h-9 bg-card" />
        </div>
      }
    >
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-4 py-2.5 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span>User</span><span>Callsign</span><span>Role</span><span>Status</span>
        </div>
        <div className="divide-y divide-border">
          {filtered.map(u => (
            <button key={u.id} onClick={() => setSelectedUser(u)} className="w-full grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 sm:gap-4 px-4 py-3 hover:bg-muted/50 transition-colors text-left">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {(u.callsign || u.email || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{u.full_name || u.callsign || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground self-center">{u.callsign || "—"}</div>
              <div className="self-center">
                <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>
                  {u.role || "user"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 self-center flex-wrap">
                {u.is_banned && <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/15 text-destructive">Banned</span>}
                {u.is_platform_suspended && <span className="text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning">Suspended</span>}
                {u.is_muted && <span className="text-xs px-2 py-0.5 rounded-full bg-info/15 text-info">Muted</span>}
                {u.is_verified && <span className="text-xs px-2 py-0.5 rounded-full bg-success/15 text-success">Verified</span>}
                {!u.is_banned && !u.is_platform_suspended && !u.is_muted && !u.is_verified && <span className="text-xs text-muted-foreground">Active</span>}
              </div>
            </button>
          ))}
          {filtered.length === 0 && !isLoading && <div className="py-12 text-center text-sm text-muted-foreground">No users found</div>}
        </div>
      </div>
      {selectedUser && (
        <UserActionModal user={selectedUser} onClose={() => setSelectedUser(null)} onAction={() => queryClient.invalidateQueries(["admin-users"])} />
      )}
    </AdminSection>
  );
}