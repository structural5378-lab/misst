import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { fetchManufacturers, fetchModels } from '@/lib/radioFiles';

// PlatformAdminRadioCatalog — admin management of the radio manufacturer &
// model catalog that members select from when adding radios and uploading
// files. Admin-only (route is gated by PlatformAdminRoute).
export default function PlatformAdminRadioCatalog() {
  const qc = useQueryClient();
  const [mfrName, setMfrName] = useState('');
  const [modelMfr, setModelMfr] = useState('');
  const [modelName, setModelName] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: manufacturers = [] } = useQuery({ queryKey: ['radio-manufacturers'], queryFn: fetchManufacturers, staleTime: 30000 });
  const { data: models = [] } = useQuery({ queryKey: ['radio-models'], queryFn: fetchModels, staleTime: 30000 });

  const addMfr = async () => {
    if (!mfrName.trim()) return;
    setSaving(true);
    try { await base44.entities.RadioManufacturer.create({ name: mfrName.trim() }); setMfrName(''); qc.invalidateQueries({ queryKey: ['radio-manufacturers'] }); } catch (e) { alert(e.message); }
    setSaving(false);
  };
  const delMfr = async (id) => { if (!confirm('Delete manufacturer? Existing models remain.')) return; await base44.entities.RadioManufacturer.delete(id); qc.invalidateQueries({ queryKey: ['radio-manufacturers'] }); };

  const addModel = async () => {
    if (!modelMfr || !modelName.trim()) return;
    setSaving(true);
    const mfr = manufacturers.find((m) => m.id === modelMfr);
    try { await base44.entities.RadioModel.create({ manufacturer_id: modelMfr, manufacturer_name: mfr?.name || '', model_name: modelName.trim() }); setModelName(''); qc.invalidateQueries({ queryKey: ['radio-models'] }); } catch (e) { alert(e.message); }
    setSaving(false);
  };
  const delModel = async (id) => { if (!confirm('Delete model?')) return; await base44.entities.RadioModel.delete(id); qc.invalidateQueries({ queryKey: ['radio-models'] }); };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-foreground mb-3">Manufacturers</h2>
        <div className="flex gap-2 mb-3">
          <Input value={mfrName} onChange={(e) => setMfrName(e.target.value)} placeholder="e.g. Baofeng" className="h-9 max-w-xs" />
          <Button size="sm" onClick={addMfr} disabled={saving}><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {manufacturers.map((m) => (
            <div key={m.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-border/60">
              <Radio className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground flex-1">{m.name}</span>
              <button onClick={() => delMfr(m.id)} className="text-destructive/70 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {manufacturers.length === 0 && <p className="text-sm text-muted-foreground">No manufacturers yet.</p>}
        </div>
      </div>

      <div>
        <h2 className="text-base font-bold text-foreground mb-3">Models</h2>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 mb-3 max-w-2xl">
          <Select value={modelMfr || undefined} onValueChange={setModelMfr}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Manufacturer" /></SelectTrigger>
            <SelectContent>{manufacturers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="e.g. UV-5R" className="h-9" />
          <Button size="sm" onClick={addModel} disabled={saving}><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {models.map((m) => (
            <div key={m.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-border/60">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{m.model_name}</p>
                <p className="text-[10px] text-muted-foreground">{m.manufacturer_name}</p>
              </div>
              <button onClick={() => delModel(m.id)} className="text-destructive/70 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {models.length === 0 && <p className="text-sm text-muted-foreground">No models yet.</p>}
        </div>
      </div>
    </div>
  );
}