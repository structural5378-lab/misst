import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Shield, Plus, Search, Copy, Trash2, UserPlus, X, Crown, Terminal, ShieldCheck,
  ShieldAlert, Users, BadgeCheck, Sparkles, User,
  VolumeX, PauseCircle, Ban, History, Lock
} from "lucide-react";
import AdminSection from "@/components/platform/AdminSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RoleEditor from "@/components/admin/RoleEditor";
import { parseJsonArray, parseBadgeConfig } from "@/lib/rbacClient";

const ICON_MAP = {
  Crown, Shield, Terminal, ShieldCheck, ShieldAlert, Users, BadgeCheck,
  Sparkles, User, UserPlus, VolumeX, PauseCircle, Ban
};

export default function PlatformAdminRoles() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [editor, setEditor] = useState({ open: false, mode: "create", role: null });
  const [assign, setAssign] = useState({ open: false, ids: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("detail");

  const { data } = useQuery({
    queryKey: ["rbac-manage"],
    queryFn: async () => (await base44.functions.invoke("rbacManage", { action: "list" })).data,
  });
  const roles = data?.roles || [];
  const assignments = data?.assignments || [];
  const audit = data?.audit || [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return roles.filter((r) => !q || r.name.toLowerCase().includes(q) || r.slug.includes(q));
  }, [roles, search]);

  const selected = roles.find((r) => r.id === selectedId) || filtered[0] || null;

  const reload = () => {
    queryClient.invalidateQueries(["rbac-manage"]);
    queryClient.invalidateQueries(["rbac-access"]);
  };

  const saveRole = async (payload) => {
    const action = editor.mode === "edit" ? "update_role" : editor.mode === "clone" ? "clone_role" : "create_role";
    const body = editor.mode === "edit"
      ? { action, role_id: editor.role.id, patch: payload }
      : { action, ...payload };
    await base44.functions.invoke("rbacManage", body);
    reload();
  };

  const deleteRole = async (role) => {
    if (role.is_system) return;
    if (!confirm(`Delete role "${role.name}"? This removes all assignments.`)) return;
    await base44.functions.invoke("rbacManage", { action: "delete_role", role_id: role.id });
    setSelectedId(null);
    reload();
  };

  const assignUsers = async () => {
    const ids = assign.ids.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
    if (!ids.length || !selected) return;
    setBusy(true);
    try {
      if (ids.length > 1) {
        await base44.functions.invoke("rbacManage", { action: "bulk_assign", target_user_ids: ids, role_id: selected.id });
      } else {
        await base44.functions.invoke("rbacManage", { action: "assign_user", target_user_id: ids[0], target_user_email: assign.email, role_id: selected.id });
      }
      setAssign({ open: false, ids: "", email: "" });
      reload();
    } finally {
      setBusy(false);
    }
  };

  const unassign = async (assignment) => {
    await base44.functions.invoke("rbacManage", { action: "unassign_user", target_user_id: assignment.user_id, role_id: assignment.role_id });
    reload();
  };

  const roleAssignments = assignments.filter((a) => a.role_id === selected?.id);
  const Icon = (name) => ICON_MAP[name] || Shield;

  return (
    <AdminSection
      title="Role Manager"
      description="Unified RBAC — the single permission system for the entire platform"
      action={
        <Button onClick={() => setEditor({ open: true, mode: "create", role: null })} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-1" /> Create Role
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Role list */}
        <div className="lg:col-span-1 space-y-2">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search roles…" className="h-9 bg-background pl-9" />
          </div>
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
            {filtered.map((r) => {
              const RIcon = Icon(r.icon);
              const isSel = r.id === selected?.id;
              return (
                <button
                  key={r.id}
                  onClick={() => { setSelectedId(r.id); setTab("detail"); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${isSel ? "border-primary/40 bg-primary/10" : "border-border hover:bg-muted/40"}`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${r.color}22`, color: r.color }}>
                    <RIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground">priority {r.priority} · {r.is_system ? "system" : "custom"}</p>
                  </div>
                  {r.is_system && <Lock className="w-3 h-3 text-muted-foreground" />}
                </button>
              );
            })}
            {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No roles found</p>}
          </div>
        </div>

        {/* Detail / assignments / audit */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">Select a role to view details</div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${selected.color}22`, color: selected.color }}>
                  {(() => { const RIcon = Icon(selected.icon); return <RIcon className="w-5 h-5" />; })()}
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-foreground">{selected.name}</p>
                  <p className="text-xs text-muted-foreground">{selected.description || "No description"}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditor({ open: true, mode: "edit", role: selected })} className="px-2.5 py-1.5 rounded-lg text-xs bg-muted hover:bg-muted/70 text-foreground">Edit</button>
                  <button onClick={() => setEditor({ open: true, mode: "clone", role: selected })} className="p-2 rounded-lg text-muted-foreground hover:bg-muted/70" title="Clone"><Copy className="w-3.5 h-3.5" /></button>
                  {!selected.is_system && (
                    <button onClick={() => deleteRole(selected)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              </div>

              <div className="flex border-b border-border text-xs">
                {[["detail", "Permissions"], ["assign", `Assignments (${roleAssignments.length})`], ["audit", "Audit"]].map(([k, label]) => (
                  <button key={k} onClick={() => setTab(k)} className={`px-4 py-2.5 font-medium ${tab === k ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}>{label}</button>
                ))}
              </div>

              <div className="p-4">
                {tab === "detail" && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-foreground">Effective Permissions</h4>
                      {selected.parent_role_id && (
                        <span className="text-[10px] text-muted-foreground">inherits from {roles.find(r => r.id === selected.parent_role_id)?.name || "—"}</span>
                      )}
                    </div>
                    {parseJsonArray(selected.permissions).includes("*") ? (
                      <p className="text-sm text-warning">All permissions (wildcard)</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {[...parseJsonArray(selected.permissions), ...parseJsonArray(selected.denied_permissions).map((d) => `✕ ${d}`)].map((p, i) => (
                          <span key={i} className={`text-[10px] px-2 py-1 rounded-md ${p.startsWith("✕") ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"}`}>{p}</span>
                        ))}
                      </div>
                    )}
                    <BadgePreview role={selected} />
                  </div>
                )}

                {tab === "assign" && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-bold text-foreground">Assigned Users</h4>
                      <Button onClick={() => setAssign({ open: true, ids: "", email: "" })} className="h-7 text-xs bg-primary text-primary-foreground">
                        <UserPlus className="w-3.5 h-3.5 mr-1" /> Assign
                      </Button>
                    </div>
                    <div className="divide-y divide-border max-h-72 overflow-y-auto">
                      {roleAssignments.map((a) => (
                        <div key={a.id} className="flex items-center justify-between py-2.5">
                          <div>
                            <p className="text-sm text-foreground">{a.user_email || a.user_id}</p>
                            <p className="text-[10px] text-muted-foreground">by {a.assigned_by_email || "—"}</p>
                          </div>
                          <button onClick={() => unassign(a)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                      {roleAssignments.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No users assigned</p>}
                    </div>
                  </div>
                )}

                {tab === "audit" && (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {audit.map((log) => (
                      <div key={log.id} className="text-xs border border-border rounded-lg p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{log.action.replace(/_/g, " ")}</span>
                          <span className="text-muted-foreground">{log.role_name || log.target_user_email || ""}</span>
                        </div>
                        <p className="text-muted-foreground mt-1">by {log.admin_email || log.admin_id} · {log.reason || "no reason"}</p>
                      </div>
                    ))}
                    {audit.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No audit entries yet</p>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assign modal */}
      {assign.open && selected && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setAssign({ ...assign, open: false })}>
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground">Assign "{selected.name}"</h3>
              <button onClick={() => setAssign({ ...assign, open: false })} className="text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Enter one or more MIST user IDs (comma-separated for bulk assign).</p>
            <div className="space-y-3">
              <Input value={assign.ids} onChange={(e) => setAssign({ ...assign, ids: e.target.value })} placeholder="user-id, user-id, …" className="h-9 bg-background" />
              <Input value={assign.email} onChange={(e) => setAssign({ ...assign, email: e.target.value })} placeholder="email (single assign, optional)" className="h-9 bg-background" />
              <Button onClick={assignUsers} disabled={busy || !assign.ids.trim()} className="w-full bg-primary text-primary-foreground">
                {busy ? "Assigning…" : "Assign Role"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <RoleEditor
        open={editor.open}
        mode={editor.mode}
        role={editor.role}
        allRoles={roles}
        onClose={() => setEditor({ ...editor, open: false })}
        onSave={saveRole}
      />
    </AdminSection>
  );
}

function BadgePreview({ role }) {
  const cfg = parseBadgeConfig(role.badge_config);
  return (
    <div className="mt-4 pt-4 border-t border-border">
      <h4 className="text-xs font-bold text-foreground mb-2">Live Preview</h4>
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${cfg.banner_accent || role.color}11`, border: `1px solid ${cfg.banner_accent || role.color}33` }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${role.color}22`, color: role.color }}>
          {(() => { const RIcon = ICON_MAP[role.icon] || Shield; return <RIcon className="w-4 h-4" />; })()}
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: cfg.name_color || role.color }}>{role.name}</p>
          {cfg.forum_flair && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${role.color}22`, color: role.color }}>{cfg.forum_flair}</span>}
        </div>
        {cfg.dashboard_indicator && <span className="ml-auto text-[10px] text-muted-foreground">● dashboard</span>}
      </div>
    </div>
  );
}