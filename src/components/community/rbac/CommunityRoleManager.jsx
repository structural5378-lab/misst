import React, { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Copy, Pencil, Trash2, Download, Upload, RotateCcw, Sparkles, GripVertical, Loader2, Crown, Users } from 'lucide-react';
import RoleEditor from './RoleEditor';
import { RoleIcon } from './roleIcons';

// CommunityRoleManager — the community owner/admin role workspace: create,
// edit, duplicate, delete, reorder (drag-and-drop), restore defaults, import/
// export JSON, and apply templates. Wired as the "Roles" tab in CommunityAdmin.
function RoleRow({ role, index, onEdit, onDuplicate, onDelete }) {
  return (
    <Draggable draggableId={role.id} index={index}>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
          className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border">
          <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${role.color}22`, color: role.color }}>
            <RoleIcon name={role.icon} className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-foreground truncate">{role.name}</p>
              {role.slug === 'owner' && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              {role.is_system && <span className="text-[9px] px-1 py-0.5 rounded bg-primary/10 text-primary font-medium">SYSTEM</span>}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              <Users className="w-3 h-3 inline -mt-0.5 mr-1" />{role.member_count} · pos {role.position} · {role.permissions.includes('*') ? 'all permissions' : `${role.permissions.length} perms`}
            </p>
          </div>
          <button onClick={() => onEdit(role)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="Edit"><Pencil className="w-4 h-4" /></button>
          {!role.is_protected && (
            <>
              <button onClick={() => onDuplicate(role)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="Duplicate"><Copy className="w-4 h-4" /></button>
              <button onClick={() => onDelete(role)} className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="w-4 h-4" /></button>
            </>
          )}
        </div>
      )}
    </Draggable>
  );
}

export default function CommunityRoleManager({ community }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const fileRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['community-roles', community.id],
    queryFn: async () => (await base44.functions.invoke('listCommunityRoles', { community_id: community.id })).data,
  });

  const roles = data?.roles || [];
  const catalog = data?.catalog || [];
  const templates = data?.templates || [];
  const invalidate = () => qc.invalidateQueries({ queryKey: ['community-roles', community.id] });

  const onDragEnd = async (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const reordered = [...roles];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    const order = reordered.map((r) => r.id);
    try { await base44.functions.invoke('manageCommunityRole', { action: 'reorder', community_id: community.id, order }); invalidate(); }
    catch (e) { toast({ title: 'Reorder failed', description: e?.message, variant: 'destructive' }); }
  };

  const quick = async (action, extra = {}, label) => {
    try { await base44.functions.invoke('manageCommunityRole', { action, community_id: community.id, ...extra }); toast({ title: label }); invalidate(); }
    catch (e) { toast({ title: 'Failed', description: e?.response?.data?.error || e?.message, variant: 'destructive' }); }
  };
  const onDuplicate = (r) => quick('duplicate', { role_id: r.id }, 'Role duplicated');
  const onDelete = async (r) => { if (!window.confirm(`Delete "${r.name}"?`)) return; quick('delete', { role_id: r.id }, 'Role deleted'); };
  const restoreDefaults = () => { if (!window.confirm('Restore missing default roles?')) return; quick('restore_defaults', {}, 'Defaults restored'); };

  const exportRoles = async () => {
    try {
      const res = await base44.functions.invoke('manageCommunityRole', { action: 'export', community_id: community.id });
      const blob = new Blob([JSON.stringify(res.data?.roles || [], null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `roles-${community.slug}.json`; a.click(); URL.revokeObjectURL(url);
    } catch (e) { toast({ title: 'Export failed', description: e?.message, variant: 'destructive' }); }
  };

  const importRoles = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : parsed.roles;
      if (!Array.isArray(arr)) throw new Error('Invalid roles JSON');
      await base44.functions.invoke('manageCommunityRole', { action: 'import', community_id: community.id, roles: arr });
      toast({ title: 'Roles imported' }); invalidate();
    } catch (err) { toast({ title: 'Import failed', description: err.message, variant: 'destructive' }); }
    finally { if (fileRef.current) fileRef.current.value = ''; }
  };

  const applyTemplate = async (t) => {
    try { await base44.functions.invoke('manageCommunityRole', { action: 'apply_template', community_id: community.id, roles: t.roles }); toast({ title: `Applied ${t.label} template` }); setShowTemplates(false); invalidate(); }
    catch (e) { toast({ title: 'Failed', description: e?.response?.data?.error || e?.message, variant: 'destructive' }); }
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"><Plus className="w-3.5 h-3.5" /> New Role</button>
        <button onClick={() => setShowTemplates((v) => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-medium"><Sparkles className="w-3.5 h-3.5" /> Templates</button>
        <button onClick={exportRoles} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-medium"><Download className="w-3.5 h-3.5" /> Export</button>
        <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-medium"><Upload className="w-3.5 h-3.5" /> Import</button>
        <button onClick={restoreDefaults} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-medium"><RotateCcw className="w-3.5 h-3.5" /> Restore Defaults</button>
        <input ref={fileRef} type="file" accept="application/json" onChange={importRoles} className="hidden" />
      </div>

      {showTemplates && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {templates.map((t) => (
            <button key={t.id} onClick={() => applyTemplate(t)} className="text-left p-3 rounded-xl bg-card border border-border hover:border-primary/40">
              <p className="text-sm font-semibold text-foreground">{t.label}</p>
              <p className="text-[11px] text-muted-foreground">{t.description}</p>
              <p className="text-[10px] text-primary mt-1">+{t.roles.length} role(s)</p>
            </button>
          ))}
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="roles">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {roles.map((r, i) => (
                <RoleRow key={r.id} role={r} index={i} onEdit={setEditing} onDuplicate={onDuplicate} onDelete={onDelete} />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {(showNew || editing) && (
        <RoleEditor community={community} role={editing} catalog={catalog} onClose={() => { setShowNew(false); setEditing(null); }} onSaved={() => { setShowNew(false); setEditing(null); invalidate(); }} />
      )}
    </div>
  );
}