import React, { useState } from "react";
import { X, Search, Check, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { COMMUNITY_ROLES, COMMUNITY_ROLE_PERMISSIONS, communityRoleLabel } from "@/lib/communityPermissions";
import { useToast } from "@/components/ui/use-toast";

// MemberRoleManager — per-member role sheet for community admins/owners.
// Assign / remove community roles, search roles, and preview the member's
// effective community permissions. Saves immediately via CommunityMember.update.
export default function MemberRoleManager({ member, onClose, onSaved }) {
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const currentRole = member.role || "member";
  const filtered = COMMUNITY_ROLES.filter((r) =>
    !search || r.label.toLowerCase().includes(search.toLowerCase()) || r.key.includes(search.toLowerCase())
  );

  const assign = async (roleKey) => {
    if (roleKey === currentRole || saving) return;
    setSaving(true);
    try {
      await base44.entities.CommunityMember.update(member.id, { role: roleKey });
      toast({ title: `Role set to ${communityRoleLabel(roleKey)}` });
      onSaved?.({ ...member, role: roleKey });
    } catch (e) {
      toast({ title: "Failed to update role", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (currentRole === "member" || saving) return;
    setSaving(true);
    try {
      await base44.entities.CommunityMember.update(member.id, { role: "member" });
      toast({ title: "Role removed — set to Member" });
      onSaved?.({ ...member, role: "member" });
    } catch (e) {
      toast({ title: "Failed to remove role", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const effectivePerms = COMMUNITY_ROLE_PERMISSIONS[currentRole] || [];

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
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles…"
            className="w-full h-10 rounded-xl border border-input bg-background pl-9 pr-3 text-sm"
          />
        </div>

        <div className="space-y-1.5 mb-4 max-h-64 overflow-y-auto">
          {filtered.map((r) => {
            const on = r.key === currentRole;
            return (
              <button
                key={r.key}
                disabled={saving}
                onClick={() => assign(r.key)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${on ? "border-primary/50 bg-primary/10" : "border-border hover:bg-muted/40"}`}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${r.color}22`, color: r.color }}>
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{r.label}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{r.desc}</p>
                </div>
                {on && <Check className="w-4 h-4 text-primary" />}
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-border p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-foreground">Current: {communityRoleLabel(currentRole)}</h4>
            {currentRole !== "member" && currentRole !== "community_owner" && (
              <button onClick={remove} disabled={saving} className="text-[11px] font-semibold text-destructive hover:underline">
                Remove role
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {effectivePerms.length === 0 ? (
              <span className="text-[11px] text-muted-foreground">No community permissions</span>
            ) : (
              effectivePerms.map((p) => (
                <span key={p} className="text-[10px] px-2 py-1 rounded-md bg-primary/10 text-primary">{p.replace("community:", "")}</span>
              ))
            )}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          Changes save instantly and are enforced server-side. Multiple/custom platform roles are managed in the admin Roles panel.
        </p>
      </div>
    </div>
  );
}