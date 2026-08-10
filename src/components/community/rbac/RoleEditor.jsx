import React, { useState } from 'react';
import { mist } from '@/api/mist';
import { useToast } from '@/components/ui/use-toast';
import { X, Save, Copy, Trash2 } from 'lucide-react';
import PermissionMatrix from './PermissionMatrix';
import { ROLE_ICON_NAMES, RoleIcon } from './roleIcons';

// RoleEditor — create / edit / duplicate / delete a single community role.
// Owner role permissions are locked to ['*'] (read-only matrix).
export default function RoleEditor({ community, role, catalog, onClose, onSaved }) {
  const isNew = !role;
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [color, setColor] = useState(role?.color || '#94a3b8');
  const [icon, setIcon] = useState(role?.icon || 'Shield');
  const [mentionable, setMentionable] = useState(!!role?.mentionable);
  const [hoisted, setHoisted] = useState(!!role?.hoisted);
  const [permissions, setPermissions] = useState(role?.permissions ? (role.permissions.includes('*') ? ['*'] : role.permissions) : []);

  const isOwner = role?.slug === 'owner';
  const isProtected = !!role?.is_protected;

  const togglePerm = (key) => {
    if (isOwner) return;
    setPermissions((prev) => {
      if (key === '*') return prev.includes('*') ? prev.filter((k) => k !== '*') : ['*'];
      const set = new Set(prev.filter((k) => k !== '*'));
      if (set.has(key)) set.delete(key); else set.add(key);
      return Array.from(set);
    });
  };

  const save = async () => {
    if (!name.trim()) return toast({ title: 'Name required', variant: 'destructive' });
    setBusy(true);
    try {
      const payload = { community_id: community.id, name, description, color, icon, mentionable, hoisted, permissions: isOwner ? ['*'] : permissions };
      if (isNew) {
        await mist.functions.invoke('manageCommunityRole', { action: 'create', ...payload });
      } else {
        await mist.functions.invoke('manageCommunityRole', { action: 'update', community_id: community.id, role_id: role.id, ...payload });
      }
      toast({ title: isNew ? 'Role created' : 'Role saved' });
      onSaved?.();
    } catch (e) {
      toast({ title: 'Save failed', description: e?.response?.data?.error || e?.message, variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const duplicate = async () => {
    setBusy(true);
    try {
      await mist.functions.invoke('manageCommunityRole', { action: 'duplicate', community_id: community.id, role_id: role.id });
      toast({ title: 'Role duplicated' });
      onSaved?.();
    } catch (e) {
      toast({ title: 'Duplicate failed', description: e?.response?.data?.error || e?.message, variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!window.confirm(`Delete the "${role.name}" role? Members holding it will lose the role.`)) return;
    setBusy(true);
    try {
      await mist.functions.invoke('manageCommunityRole', { action: 'delete', community_id: community.id, role_id: role.id });
      toast({ title: 'Role deleted' });
      onSaved?.();
    } catch (e) {
      toast({ title: 'Delete failed', description: e?.response?.data?.error || e?.message, variant: 'destructive' });
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/90 backdrop-blur">
        <button onClick={onClose} className="p-2 -ml-2 rounded-lg hover:bg-muted/60 min-w-[44px] min-h-[44px] flex items-center justify-center"><X className="w-5 h-5" /></button>
        <h1 className="text-base font-semibold flex-1">{isNew ? 'New Role' : 'Edit Role'}</h1>
        {!isNew && !isProtected && (
          <button onClick={duplicate} disabled={busy} className="p-2 rounded-lg hover:bg-muted/60 text-muted-foreground" title="Duplicate"><Copy className="w-4 h-4" /></button>
        )}
        {!isNew && !isProtected && (
          <button onClick={remove} disabled={busy} className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="w-4 h-4" /></button>
        )}
        <button onClick={save} disabled={busy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"><Save className="w-4 h-4" /> Save</button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Role Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl bg-card border border-border text-sm focus:border-primary outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="mt-1 w-full px-3 py-2 rounded-xl bg-card border border-border text-sm focus:border-primary outline-none resize-y" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground">Color</label>
              <div className="mt-1 flex items-center gap-2">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-9 rounded-lg bg-card border border-border p-0.5" />
                <input value={color} onChange={(e) => setColor(e.target.value)} className="flex-1 px-3 py-2 rounded-xl bg-card border border-border text-sm" />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground">Icon</label>
              <div className="mt-1 flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}22`, color }}><RoleIcon name={icon} className="w-4 h-4" /></div>
                <select value={icon} onChange={(e) => setIcon(e.target.value)} className="flex-1 px-2 py-2 rounded-xl bg-card border border-border text-sm">
                  {ROLE_ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mentionable} onChange={(e) => setMentionable(e.target.checked)} className="accent-[hsl(var(--primary))]" /> Mentionable</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hoisted} onChange={(e) => setHoisted(e.target.checked)} className="accent-[hsl(var(--primary))]" /> Hoisted (display separately)</label>
          </div>
          {!isNew && <p className="text-[11px] text-muted-foreground">Member count: {role?.member_count ?? 0} · Position: {role?.position}</p>}
        </div>

        <div>
          <h3 className="text-xs font-semibold text-foreground mb-2">Permissions {isOwner && <span className="text-amber-400">· Owner has all permissions (locked)</span>}</h3>
          {isOwner ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-400">The Owner role always holds every permission and cannot be restricted.</div>
          ) : (
            <PermissionMatrix catalog={catalog} selected={permissions} onToggle={togglePerm} />
          )}
        </div>
      </div>
    </div>
  );
}