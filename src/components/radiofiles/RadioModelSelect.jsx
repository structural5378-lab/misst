import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchManufacturers, fetchModels } from '@/lib/radioFiles';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// RadioModelSelect — reusable manufacturer → model picker. Loads the admin-
// managed catalog once and cascades models by manufacturer. Calls onChange
// with { radio_model_id, manufacturer_id, manufacturer_name, model_name }.
export default function RadioModelSelect({ value, onChange }) {
  const { data: manufacturers = [] } = useQuery({ queryKey: ['radio-manufacturers'], queryFn: fetchManufacturers, staleTime: 60000 });
  const { data: models = [] } = useQuery({ queryKey: ['radio-models'], queryFn: fetchModels, staleTime: 60000 });

  const selectedMfrId = value?.manufacturer_id || models.find((m) => m.id === value?.radio_model_id)?.manufacturer_id || '';
  const filteredModels = useMemo(
    () => models.filter((m) => !selectedMfrId || m.manufacturer_id === selectedMfrId),
    [models, selectedMfrId]
  );

  const pickMfr = (mfrId) => {
    const mfr = manufacturers.find((m) => m.id === mfrId);
    onChange({ radio_model_id: '', manufacturer_id: mfrId, manufacturer_name: mfr?.name || '', model_name: '' });
  };
  const pickModel = (modelId) => {
    const m = models.find((x) => x.id === modelId);
    if (!m) return;
    onChange({ radio_model_id: m.id, manufacturer_id: m.manufacturer_id, manufacturer_name: m.manufacturer_name, model_name: m.model_name });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Manufacturer</Label>
        <Select value={selectedMfrId || undefined} onValueChange={pickMfr}>
          <SelectTrigger className="h-10 bg-background/50"><SelectValue placeholder="Select manufacturer" /></SelectTrigger>
          <SelectContent>
            {manufacturers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Model</Label>
        <Select value={value?.radio_model_id || undefined} onValueChange={pickModel}>
          <SelectTrigger className="h-10 bg-background/50"><SelectValue placeholder="Select model" /></SelectTrigger>
          <SelectContent>
            {filteredModels.map((m) => <SelectItem key={m.id} value={m.id}>{m.model_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}