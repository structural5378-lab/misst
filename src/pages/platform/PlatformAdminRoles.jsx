import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, Plus, X, Crown, Wrench, Headphones, Trash2 } from "lucide-react";
import AdminSection from "@/components/platform/AdminSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ROLE_DEFS = [
  { role: "platform_owner", label: "Super Admin", icon: Crown, color: "text-amber-400 bg-amber-500/15", desc: "Full platform control" },
  { role: "platform_admin", label: "Administrator", icon: Shield, color: "text-violet-400 bg-violet-500/15", desc: "Manage users and content" },
  { role: "platform_support", label: "Support", icon: Headphones, color: "text-cyan-400 bg-cyan-500/15", desc: "View and assist users" },
];

const PERMISSIONS = [
  { key: "manage_users", label: "Manage Users" },
  { key: "manage_roles", label: "Manage Roles" },
  { key: "manage_content", label: "Manage Content" },
  { key: "manage_badges", label: "Manage Badges" },
  { key: "manage_features", label: "Toggle Features" },
  { key: "send_broadcasts", label: "Send Broadcasts" },
  { key: "view_analytics", label: "View Analytics" },
  { key: "view_audit_log", label: "View Audit Log" },
  { key: "manage_themes", label: "Manage Themes" },
  { key: "developer_tools", label: "Developer Tools" },
];

export default function PlatformAdminRoles() {
  const [showAssign, setShowAssign] = useState(false);
  const [targetEmail, setTargetEmail] = useState("");
  const [targetId, setTargetId] = useState("");
  const [selectedRole, setSelectedRole] = useState("platform_admin");
  const [assigning, setAssigning] = useState(false);
  const queryClient = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ["platform-roles-all"],
    queryFn: async () => await base44.entities.PlatformRole.list("-created_date", 200),
  });

  const handleAssign = async () => {
    if (!targetId || !selectedRole) return;
    setAssigning(true);
    try {
      await base44.functions.invoke("assignPlatformRole", {
        target_user_id: targetId,
        target_user_email: targetEmail,
        role: selectedRole,
      });
      queryClient.invalidateQueries(["platform-roles-all"]);
      setShowAssign(false);
      setTargetEmail("");
      setTargetId("");
    } catch (e) {
      console.error(e);
    } finally {
      setAssigning(false);
    }
  };

  const handleRevoke = async (roleId) => {
    try {
      await base44.functions.invoke("assignPlatformRole", { action: "revoke", role_id: roleId });
      queryClient.invalidateQueries(["platform-roles-all"]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AdminSection
      title="Roles & Permissions"
      description="Manage platform-level roles and permissions"
      action={
        <Button onClick={() => setShowAssign(true)} className="bg-violet-600 hover:bg-violet-700 text-white">
          <Plus className="w-4 h-4 mr-1" /> Assign Role
        </Button>
      }
    >
      {/* Role definitions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {ROLE_DEFS.map(r => (
          <div key={r.role} className="rounded-xl bg-card border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${r.color}`}>
                <r.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {roles.filter(a => a.role === r.role && a.is_active).length} assigned
            </div>
          </div>
        ))}
      </div>

      {/* Permission matrix */}
      <div className="rounded-xl bg-card border border-border p-4 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Permission Matrix</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {PERMISSIONS.map(p => (
            <div key={p.key} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50 border border-border text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              {p.label}
            </div>
          ))}
        </div>
      </div>

      {/* Active assignments */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">Active Assignments</div>
        <div className="divide-y divide-border">
          {roles.filter(r => r.is_active).map(r => {
            const def = ROLE_DEFS.find(d => d.role === r.role) || {};
            return (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${def.color || "bg-muted text-muted-foreground"}`}>
                    {def.icon ? <def.icon className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.user_email || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{def.label || r.role} · by {r.assigned_by_email || "—"}</p>
                  </div>
                </div>
                <button onClick={() => handleRevoke(r.id)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
          {roles.filter(r => r.is_active).length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No active role assignments</div>}
        </div>
      </div>

      {/* Assign modal */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowAssign(false)}>
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground">Assign Platform Role</h3>
              <button onClick={() => setShowAssign(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">User ID</label>
                <Input value={targetId} onChange={e => setTargetId(e.target.value)} placeholder="UUID" className="h-9 bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">User Email (optional)</label>
                <Input value={targetEmail} onChange={e => setTargetEmail(e.target.value)} placeholder="user@example.com" className="h-9 bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Role</label>
                <div className="space-y-1.5">
                  {ROLE_DEFS.map(r => (
                    <button key={r.role} onClick={() => setSelectedRole(r.role)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${selectedRole === r.role ? "border-violet-500/40 bg-violet-500/10" : "border-border hover:bg-white/[0.02]"}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.color}`}><r.icon className="w-4 h-4" /></div>
                      <div className="text-left"><p className="text-sm font-medium text-foreground">{r.label}</p><p className="text-xs text-muted-foreground">{r.desc}</p></div>
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={handleAssign} disabled={assigning || !targetId} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                {assigning ? "Assigning..." : "Assign Role"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminSection>
  );
}