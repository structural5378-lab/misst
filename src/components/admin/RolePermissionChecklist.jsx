import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PermissionMatrix from "./PermissionMatrix";
import { parseJsonArray } from "@/lib/rbacClient";

// RolePermissionChecklist — inline, immediate-save permission editor shown
// when a role is selected in the admin Roles panel. Every toggle persists
// instantly through rbacManage (update_role). The Owner role (wildcard) is
// read-only since it always holds every permission.
export default function RolePermissionChecklist({ role, allRoles, onSaved }) {
  const [perms, setPerms] = useState(() => parseJsonArray(role.permissions));
  const [denied, setDenied] = useState(() => parseJsonArray(role.denied_permissions));
  const [saving, setSaving] = useState(false);
  const isOwner = role.slug === "owner" || parseJsonArray(role.permissions).includes("*");

  const persist = async (nextPerms, nextDenied) => {
    setSaving(true);
    try {
      await base44.functions.invoke("rbacManage", {
        action: "update_role",
        role_id: role.id,
        patch: { permissions: nextPerms, denied_permissions: nextDenied },
      });
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const togglePerm = (key) => {
    if (isOwner) return;
    const has = perms.includes(key);
    const next = has ? perms.filter((p) => p !== key) : [...perms, key];
    const nextD = denied.filter((p) => p !== key);
    setPerms(next); setDenied(nextD);
    persist(next, nextD);
  };
  const toggleAll = (allOn) => {
    if (isOwner) return;
    const next = allOn ? ["*"] : [];
    setPerms(next); setDenied([]);
    persist(next, []);
  };
  const toggleDeny = (key) => {
    if (isOwner) return;
    const has = denied.includes(key);
    const nextD = has ? denied.filter((p) => p !== key) : [...denied, key];
    const nextP = perms.filter((p) => p !== key);
    setDenied(nextD); setPerms(nextP);
    persist(nextP, nextD);
  };

  if (isOwner) {
    return <p className="text-sm text-warning">Owner always holds all permissions (wildcard) and cannot be restricted.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-foreground">Permissions — changes save instantly</h4>
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
      </div>
      {role.parent_role_id && (
        <p className="text-[10px] text-muted-foreground mb-2">
          inherits from {allRoles.find((r) => r.id === role.parent_role_id)?.name || "—"}
        </p>
      )}
      <PermissionMatrix
        selected={perms}
        denied={denied}
        onTogglePerm={togglePerm}
        onToggleAll={toggleAll}
        onToggleDeny={toggleDeny}
      />
    </div>
  );
}