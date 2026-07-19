import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PermissionMatrix from "./PermissionMatrix";
import { parseJsonArray, parseBadgeConfig, ALL_PERMISSION_KEYS } from "@/lib/rbacClient";

/**
 * RoleEditor — modal to create, edit, or clone a role.
 * Fields: name, description, icon, color, priority, parent (inheritance),
 * permissions (matrix), deny overrides, and badge config. On save calls
 * onSave(roleData) where roleData is ready for rbacManage.
 */
export default function RoleEditor({ open, onClose, onSave, role = null, allRoles = [], mode = "create" }) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState({
    name: "", description: "", icon: "Shield", color: "#8b5cf6", priority: 100,
    parent_role_id: null, permissions: [], denied_permissions: [],
    badge_config: { name_color: "#8b5cf6", banner_accent: "#8b5cf6", forum_flair: "", dashboard_indicator: false, icon: "Shield" }
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (role && (isEdit || mode === "clone")) {
      setForm({
        name: mode === "clone" ? `${role.name} (Copy)` : role.name,
        description: role.description || "",
        icon: role.icon || "Shield",
        color: role.color || "#8b5cf6",
        priority: role.priority ?? 100,
        parent_role_id: role.parent_role_id || null,
        permissions: parseJsonArray(role.permissions),
        denied_permissions: parseJsonArray(role.denied_permissions),
        badge_config: parseBadgeConfig(role.badge_config)
      });
    } else {
      setForm({
        name: "", description: "", icon: "Shield", color: "#8b5cf6", priority: 100,
        parent_role_id: null, permissions: [], denied_permissions: [],
        badge_config: { name_color: "#8b5cf6", banner_accent: "#8b5cf6", forum_flair: "", dashboard_indicator: false, icon: "Shield" }
      });
    }
  }, [open, role, mode]);

  if (!open) return null;

  const parentOptions = allRoles.filter((r) => r.id !== role?.id);

  const togglePerm = (key) => {
    setForm((f) => {
      const has = f.permissions.includes(key);
      const permissions = has ? f.permissions.filter((p) => p !== key) : [...f.permissions, key];
      const denied_permissions = f.denied_permissions.filter((p) => p !== key);
      return { ...f, permissions, denied_permissions };
    });
  };
  const toggleAll = (allOn) => setForm((f) => ({ ...f, permissions: allOn ? ["*"] : [], denied_permissions: [] }));
  const toggleDeny = (key) => {
    setForm((f) => {
      const has = f.denied_permissions.includes(key);
      const denied_permissions = has ? f.denied_permissions.filter((p) => p !== key) : [...f.denied_permissions, key];
      const permissions = f.permissions.filter((p) => p !== key);
      return { ...f, denied_permissions, permissions };
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        ...(isEdit ? { role_id: role.id } : {}),
        name: form.name.trim(),
        description: form.description,
        icon: form.icon,
        color: form.color,
        priority: Number(form.priority) || 100,
        parent_role_id: form.parent_role_id || null,
        permissions: form.permissions,
        denied_permissions: form.denied_permissions,
        badge_config: form.badge_config
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-card pb-3 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">
            {isEdit ? "Edit Role" : mode === "clone" ? "Clone Role" : "Create Role"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <Label className="text-xs">Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 bg-background" />
          </div>
          <div>
            <Label className="text-xs">Priority (lower = higher rank)</Label>
            <Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="h-9 bg-background" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-9 bg-background" />
          </div>
          <div>
            <Label className="text-xs">Icon (Lucide name)</Label>
            <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="h-9 bg-background" />
          </div>
          <div>
            <Label className="text-xs">Color</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-9 h-9 rounded-md bg-transparent border border-border" />
              <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-9 bg-background" />
            </div>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Parent role (inheritance)</Label>
            <select
              value={form.parent_role_id || ""}
              onChange={(e) => setForm({ ...form, parent_role_id: e.target.value || null })}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">None (root)</option>
              {parentOptions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-border p-3 mb-4">
          <h4 className="text-xs font-bold text-foreground mb-3">Permissions</h4>
          <PermissionMatrix
            selected={form.permissions}
            denied={form.denied_permissions}
            onTogglePerm={togglePerm}
            onToggleAll={toggleAll}
            onToggleDeny={toggleDeny}
          />
        </div>

        <div className="rounded-xl border border-border p-3 mb-4">
          <h4 className="text-xs font-bold text-foreground mb-3">Group Badge</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Name color</Label>
              <input type="color" value={form.badge_config.name_color || "#8b5cf6"} onChange={(e) => setForm({ ...form, badge_config: { ...form.badge_config, name_color: e.target.value } })} className="w-full h-9 rounded-md bg-transparent border border-border" />
            </div>
            <div>
              <Label className="text-xs">Banner accent</Label>
              <input type="color" value={form.badge_config.banner_accent || "#8b5cf6"} onChange={(e) => setForm({ ...form, badge_config: { ...form.badge_config, banner_accent: e.target.value } })} className="w-full h-9 rounded-md bg-transparent border border-border" />
            </div>
            <div>
              <Label className="text-xs">Forum flair</Label>
              <Input value={form.badge_config.forum_flair || ""} onChange={(e) => setForm({ ...form, badge_config: { ...form.badge_config, forum_flair: e.target.value } })} className="h-9 bg-background" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-xs pb-2">
                <input type="checkbox" checked={!!form.badge_config.dashboard_indicator} onChange={(e) => setForm({ ...form, badge_config: { ...form.badge_config, dashboard_indicator: e.target.checked } })} />
                Dashboard indicator
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 sticky bottom-0 bg-card pt-3 border-t border-border">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="bg-primary text-primary-foreground">
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Role"}
          </Button>
        </div>
      </div>
    </div>
  );
}