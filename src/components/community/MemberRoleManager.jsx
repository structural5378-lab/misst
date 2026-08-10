import React, { useState } from "react";
import { X, Search, Star, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mist } from '@/api/mist';
import { useToast } from "@/components/ui/use-toast";
import { RoleIcon } from "@/components/community/rbac/roleIcons";

// MemberRoleManager — per-member multi-role assignment sheet for community
// admins/owners. Assign / remove custom roles (multiple allowed), set primary,
// search roles, and preview the member's effective permissions. Saves
// immediately through the hierarchy-enforced manageCommunityRoleAssignment
// function. CommunityMember.role is re-synced server-side to the highest
// system custom role for back-compat with existing moderation checks.
export default function MemberRoleManager({ member, onClose, onSaved }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["community-roles-member", member.community_id, member.user_id],
    queryFn: async () => (await mist.functions.invoke("listCommunityRoles", { community_id: member.community_id, target_user_id: member.user_id })).data,
  });

  const roles = (data?.roles || []).filter((r) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.slug.includes(search.toLowerCase())
  );
  const assignments = data?.assignments || [];
  const assignedIds = new Set(assignments.map((a) => a.role_id));
  const primaryId = assignments.find((a) => a.is_primary)?.role_id || null;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["community-roles-member", member.community_id, member.user_id] });
    qc.invalidateQueries({ queryKey: ["community-roles", member.community_id] });
    qc.invalidateQueries({ queryKey: ["community-admin-members", member.community_id] });
  };

  const toggle = async (role) => {
    if (busy) return;
    setBusy(true);
    try {
      const action = assignedIds.has(role.id) ? "remove" : "assign";
      await mist.functions.invoke("manageCommunityRoleAssignment", { action, community_id: member.community_id, target_user_id: member.user_id, role_id: role.id });
      toast({ title: action === "assign" ? "Role assigned" : "Role removed" });
      invalidate();
      onSaved?.();
    } catch (e) {
      toast({ title: "Failed", description: e?.response?.data?.error || e?.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const setPrimary = async (role) => {
    if (busy || primaryId === role.id) return;
    setBusy(true);
    try {
      await mist.functions.invoke("manageCommunityRoleAssignment", { action: "set_primary", community_id: member.community_id, target_user_id: member.user_id, role_id: role.id });
      toast({ title: `${role.name} set as primary` });
      invalidate();
      onSaved?.();
    } catch (e) {
      toast({ title: "Failed", description: e?.response?.data?.error || e?.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const totalPerms = new Set();
  roles.forEach((r) => { if (assignedIds.has(r.id)) r.permissions.forEach((p) => totalPerms.add(p)); });

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-card border border-border rounded-t-2xl sm:rounded-2xl p-5 sheet-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-foreground">{member.user_name || "Member"}</h3>
            <p className="text-xs text-muted-foreground">{member.user_email || member.user_id}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search roles…"
            className="w-full h-10 rounded-xl border border-input bg-background pl-9 pr-3 text-sm focus:border-primary outline-none" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-1.5 mb-4 max-h-72 overflow-y-auto">
            {roles.map((r) => {
              const on = assignedIds.has(r.id);
              const isPrimary = primaryId === r.id;
              return (
                <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${on ? "border-primary/50 bg-primary/10" : "border-border hover:bg-muted/40"}`}>
                  <button disabled={busy} onClick={() => toggle(r)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${r.color}22`, color: r.color }}><RoleIcon name={r.icon} className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{r.is_system ? "System role" : "Custom role"} · {r.permissions.includes("*") ? "all perms" : `${r.permissions.length} perms`}</p>
                    </div>
                    {on && !isPrimary && <span className="text-[10px] text-muted-foreground">assigned</span>}
                  </button>
                  {on && (
                    <button disabled={busy} onClick={() => setPrimary(r)} className={`p-1.5 rounded-lg shrink-0 ${isPrimary ? "text-amber-400" : "text-muted-foreground hover:text-amber-400"}`} title="Set as primary">
                      <Star className={`w-4 h-4 ${isPrimary ? "fill-amber-400" : ""}`} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="rounded-xl border border-border p-3 mb-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-foreground">Effective Permissions</h4>
            <span className="text-[11px] text-muted-foreground">{totalPerms.size} permission(s)</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {totalPerms.size === 0 ? (
              <span className="text-[11px] text-muted-foreground">No roles assigned.</span>
            ) : (
              Array.from(totalPerms).slice(0, 24).map((p) => (
                <span key={p} className="text-[10px] px-2 py-1 rounded-md bg-primary/10 text-primary">{p.replace("community:", "")}</span>
              ))
            )}
            {totalPerms.size > 24 && <span className="text-[10px] text-muted-foreground self-center">+{totalPerms.size - 24} more</span>}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">Members can hold multiple roles. The highest role sets display color, badge, and hierarchy. Changes are enforced server-side.</p>
      </div>
    </div>
  );
}