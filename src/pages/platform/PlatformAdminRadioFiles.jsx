import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Star, EyeOff, Eye, Trash2, Users, Search } from 'lucide-react';
import { mist } from '@/api/mist';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatSize, fileExt } from '@/lib/radioFiles';

// PlatformAdminRadioFiles — moderation console for all uploaded radio files
// (admin sees private, hidden, and soft-deleted records via RLS). Search,
// filter by manufacturer, and toggle verified / featured / community / hidden
// or soft-delete. Admin-only (route gated by PlatformAdminRoute).
export default function PlatformAdminRadioFiles() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [mfr, setMfr] = useState('');

  const { data: files = [] } = useQuery({ queryKey: ['admin-radio-files'], queryFn: () => mist.entities.RadioFile.list('-created_date', 500), staleTime: 30000 });
  const { data: manufacturers = [] } = useQuery({ queryKey: ['radio-manufacturers'], queryFn: () => mist.entities.RadioManufacturer.list(500), staleTime: 60000 });

  const mfrName = manufacturers.find((m) => m.id === mfr)?.name || '';
  const filtered = useMemo(() => {
    let list = files;
    const term = q.toLowerCase().trim();
    if (term) list = list.filter((f) => [f.file_name, f.manufacturer_name, f.model_name, f.uploader_name, f.description].some((v) => String(v || '').toLowerCase().includes(term)));
    if (mfrName) list = list.filter((f) => f.manufacturer_name === mfrName);
    return list;
  }, [files, q, mfrName]);

  const set = async (id, field, val) => { await mist.entities.RadioFile.update(id, { [field]: val }); qc.invalidateQueries({ queryKey: ['admin-radio-files'] }); };
  const del = async (id) => { if (!confirm('Soft-delete this file?')) return; await mist.entities.RadioFile.update(id, { deleted: true, file_url: '' }); qc.invalidateQueries({ queryKey: ['admin-radio-files'] }); };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files…" className="pl-9 h-9" />
        </div>
        <Select value={mfr || undefined} onValueChange={setMfr}>
          <SelectTrigger className="h-9 sm:w-48"><SelectValue placeholder="All manufacturers" /></SelectTrigger>
          <SelectContent>{manufacturers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} files</p>

      <div className="overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border bg-card/40">
              <th className="py-2 px-3">File</th>
              <th className="py-2 px-3">Model</th>
              <th className="py-2 px-3">Uploader</th>
              <th className="py-2 px-3">DL</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id} className="border-b border-border/40 hover:bg-card/30">
                <td className="py-2 px-3">
                  <Link to={`/radio-files/${f.id}`} className="text-foreground hover:text-primary font-medium">{f.file_name}</Link>
                  <p className="text-[10px] text-muted-foreground">{fileExt(f.file_name).toUpperCase()} · {formatSize(f.file_size)}</p>
                </td>
                <td className="py-2 px-3 text-xs whitespace-nowrap">{f.manufacturer_name} {f.model_name}</td>
                <td className="py-2 px-3 text-xs">{f.uploader_name}</td>
                <td className="py-2 px-3 text-xs">{f.download_count || 0}</td>
                <td className="py-2 px-3">
                  <div className="flex flex-wrap gap-1">
                    {f.verified && <span className="text-[9px] text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded">Verified</span>}
                    {f.featured && <span className="text-[9px] text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded">Featured</span>}
                    {f.community && <span className="text-[9px] text-cyan-300 bg-cyan-500/15 px-1.5 py-0.5 rounded">Community</span>}
                    {f.hidden && <span className="text-[9px] text-warning bg-warning/15 px-1.5 py-0.5 rounded">Hidden</span>}
                    {f.deleted && <span className="text-[9px] text-destructive bg-destructive/15 px-1.5 py-0.5 rounded">Deleted</span>}
                    {f.visibility === 'private' && <span className="text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">Private</span>}
                  </div>
                </td>
                <td className="py-2 px-3">
                  <div className="flex gap-1">
                    <button onClick={() => set(f.id, 'verified', !f.verified)} title="Verify" className={f.verified ? 'text-emerald-400' : 'text-muted-foreground hover:text-emerald-400'}><ShieldCheck className="w-4 h-4" /></button>
                    <button onClick={() => set(f.id, 'featured', !f.featured)} title="Feature" className={f.featured ? 'text-amber-400' : 'text-muted-foreground hover:text-amber-400'}><Star className="w-4 h-4" /></button>
                    <button onClick={() => set(f.id, 'community', !f.community)} title="Community" className={f.community ? 'text-cyan-400' : 'text-muted-foreground hover:text-cyan-400'}><Users className="w-4 h-4" /></button>
                    <button onClick={() => set(f.id, 'hidden', !f.hidden)} title="Hide/Restore" className={f.hidden ? 'text-warning' : 'text-muted-foreground hover:text-warning'}>{f.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
                    {!f.deleted && <button onClick={() => del(f.id)} title="Delete" className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No files.</p>}
      </div>
    </div>
  );
}