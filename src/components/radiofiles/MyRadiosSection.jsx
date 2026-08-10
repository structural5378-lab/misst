import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Radio, Plus, Trash2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { mist } from '@/api/mist';
import { useMistUser } from '@/hooks/useMistUser';
import { fetchUserRadios } from '@/lib/radioFiles';
import RadioModelSelect from './RadioModelSelect';

// MyRadiosSection — profile section listing a member's radios (structured
// catalog entries). The owner can add/remove radios inline; visitors see the
// read-only list. These entries drive which shared files are recommended.
export default function MyRadiosSection({ userId, isSelf }) {
  const { user } = useMistUser();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [model, setModel] = useState({});
  const [nickname, setNickname] = useState('');
  const [desc, setDesc] = useState('');

  const { data: radios = [] } = useQuery({
    queryKey: ['my-radios', userId], queryFn: () => fetchUserRadios(userId), enabled: !!userId, staleTime: 30000,
  });

  const addRadio = async () => {
    if (!model.radio_model_id) return;
    setSaving(true);
    try {
      await mist.entities.UserRadio.create({
        user_id: user.id,
        user_name: user.full_name || '',
        radio_model_id: model.radio_model_id,
        manufacturer_name: model.manufacturer_name,
        model_name: model.model_name,
        nickname: nickname.trim(),
        description: desc.trim(),
      });
      setAdding(false); setModel({}); setNickname(''); setDesc('');
      qc.invalidateQueries({ queryKey: ['my-radios', userId] });
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const removeRadio = async (id) => {
    try { await mist.entities.UserRadio.delete(id); qc.invalidateQueries({ queryKey: ['my-radios', userId] }); } catch (e) { console.error(e); }
  };

  return (
    <div className="p-4 rounded-xl bg-card border border-border/60">
      <div className="flex items-center gap-1.5 mb-3">
        <Radio className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">My Radios</h3>
        {isSelf && !adding && (
          <button onClick={() => setAdding(true)} className="ml-auto p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"><Plus className="w-4 h-4" /></button>
        )}
      </div>

      {radios.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">{isSelf ? 'Add a radio to unlock compatible community files.' : 'No radios listed.'}</p>
      )}

      <div className="space-y-2">
        {radios.map((r) => (
          <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-background/40 border border-border/40">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Radio className="w-4 h-4 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{r.manufacturer_name} {r.model_name}</p>
              {r.nickname && <p className="text-xs text-muted-foreground truncate">“{r.nickname}”{r.description ? ` · ${r.description}` : ''}</p>}
              {!r.nickname && r.description && <p className="text-xs text-muted-foreground truncate">{r.description}</p>}
            </div>
            {isSelf && <button onClick={() => removeRadio(r.id)} className="text-destructive/70 hover:text-destructive p-1"><Trash2 className="w-4 h-4" /></button>}
          </div>
        ))}
      </div>

      {isSelf && adding && (
        <div className="mt-3 p-3 rounded-lg bg-background/50 border border-primary/20 space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setAdding(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <RadioModelSelect value={model} onChange={setModel} />
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nickname (optional)</Label>
            <Input placeholder="e.g. Truck Radio" value={nickname} onChange={(e) => setNickname(e.target.value)} className="h-9 bg-background/50 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Description (optional)</Label>
            <Textarea placeholder="Notes about this radio…" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} className="bg-background/50 text-sm" />
          </div>
          <Button onClick={addRadio} disabled={saving || !model.radio_model_id} className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm h-9">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> Add Radio</>}
          </Button>
        </div>
      )}
    </div>
  );
}