import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { mist } from '@/api/mist';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { StickyNote, Loader2, Search, Trash2, Edit3 } from 'lucide-react';

export default function MemberNotesTab({ community, targetUser }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['member-notes', community.id, targetUser.user_id],
    queryFn: async () => (await mist.functions.invoke('manageModeratorNote', {
      action: 'list', community_id: community.id, target_user_id: targetUser.user_id,
    })).data,
    refetchInterval: 30000,
  });

  const notes = (data?.notes || []).filter((n) =>
    !search || (n.content || '').toLowerCase().includes(search.toLowerCase()) || (n.author_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const invalidate = () => qc.invalidateQueries({ queryKey: ['member-notes', community.id, targetUser.user_id] });

  const submit = async () => {
    const content = draft.trim();
    if (!content) return;
    setBusy(true);
    try {
      if (editingId) {
        await mist.functions.invoke('manageModeratorNote', { action: 'update', community_id: community.id, note_id: editingId, content });
        setEditingId(null);
      } else {
        await mist.functions.invoke('manageModeratorNote', { action: 'create', community_id: community.id, target_user_id: targetUser.user_id, content });
      }
      setDraft('');
      invalidate();
      toast({ title: editingId ? 'Note updated' : 'Note added' });
    } catch (e) {
      toast({ title: 'Failed', description: e?.response?.data?.error || e?.message, variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this note? This is logged.')) return;
    setBusy(true);
    try {
      await mist.functions.invoke('manageModeratorNote', { action: 'delete', community_id: community.id, note_id: id });
      invalidate();
      toast({ title: 'Note deleted' });
    } catch (e) {
      toast({ title: 'Failed', description: e?.response?.data?.error || e?.message, variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const startEdit = (n) => { setEditingId(n.id); setDraft(n.content); };
  const cancelEdit = () => { setEditingId(null); setDraft(''); };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-2.5 text-[11px] text-amber-400 flex items-center gap-1.5">
        <StickyNote className="w-3.5 h-3.5 shrink-0" /> Moderator notes are private to staff and never visible to the member.
      </div>

      <div className="rounded-xl bg-card border border-border p-2.5 space-y-2">
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} disabled={busy}
          placeholder={editingId ? 'Edit note…' : 'Add an internal note about this member…'}
          className="w-full bg-secondary/40 border border-border rounded-lg p-2 text-sm resize-y min-h-[70px] focus:border-primary outline-none" />
        <div className="flex gap-2 justify-end">
          {editingId && <button onClick={cancelEdit} disabled={busy} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary/60 text-muted-foreground">Cancel</button>}
          <button onClick={submit} disabled={busy || !draft.trim()} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground disabled:opacity-40">
            {editingId ? 'Update' : 'Add Note'}
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes…"
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-card border border-border text-sm focus:border-primary outline-none" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : notes.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">No notes yet.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="p-3 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">{n.author_name || 'Moderator'}</span>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(n)} className="p-1 rounded hover:bg-muted text-muted-foreground" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(n.id)} className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{n.content}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {n.created_date ? format(new Date(n.created_date), 'MMM d, yyyy h:mm a') : ''}
                {n.edited_at && ` · edited ${format(new Date(n.edited_at), 'MMM d, h:mm a')}${n.edited_by_name ? ` by ${n.edited_by_name}` : ''}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}