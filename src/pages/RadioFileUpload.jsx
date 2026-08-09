import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, Loader2, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchFile, radioFileOps, uploadRadioFile, isAllowedFile, MAX_FILE_SIZE, SUGGESTED_TAGS, formatSize, fileExt, parseJSON } from '@/lib/radioFiles';
import RadioModelSelect from '@/components/radiofiles/RadioModelSelect';

// RadioFileUpload — upload a new radio programming file, or edit an existing
// file's metadata (?edit=id). Validates the file type/size client-side before
// uploading via the UploadFile integration, then creates the record through
// the radioFileOps backend function (which re-validates server-side).
export default function RadioFileUpload() {
  const [params] = useSearchParams();
  const editId = params.get('edit');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileInputRef = useRef(null);

  const [model, setModel] = useState({});
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [version, setVersion] = useState('1.0');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: existing } = useQuery({ queryKey: ['radio-file', editId], queryFn: () => fetchFile(editId), enabled: !!editId, staleTime: 30000 });

  useEffect(() => {
    if (existing) {
      setModel({ radio_model_id: existing.radio_model_id, manufacturer_name: existing.manufacturer_name, model_name: existing.model_name });
      setFileName(existing.file_name);
      setDescription(existing.description || '');
      setNotes(existing.notes || '');
      setVisibility(existing.visibility || 'public');
      setVersion(existing.version || '1.0');
      setTags(parseJSON(existing.tags, []));
    }
  }, [existing]);

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setFileName(f.name);
  };

  const addTag = (t) => {
    const v = (t || tagInput).trim();
    if (v && !tags.includes(v)) setTags([...tags, v]);
    setTagInput('');
  };
  const removeTag = (t) => setTags(tags.filter((x) => x !== t));

  const submit = async () => {
    setError('');
    if (!model.radio_model_id) { setError('Select a radio model.'); return; }
    if (editId) {
      setSaving(true);
      try {
        await base44.entities.RadioFile.update(editId, {
          radio_model_id: model.radio_model_id, manufacturer_name: model.manufacturer_name, model_name: model.model_name,
          file_name: fileName, description, notes, visibility, tags: JSON.stringify(tags),
        });
        qc.invalidateQueries({ queryKey: ['radio-file', editId] });
        navigate(`/radio-files/${editId}`);
      } catch (e) { setError(e.message || 'Save failed'); }
      setSaving(false);
      return;
    }
    if (!file) { setError('Choose a file to upload.'); return; }
    if (!isAllowedFile(file.name)) { setError('File type not allowed. Use radio programming/config/doc files.'); return; }
    if (file.size > MAX_FILE_SIZE) { setError('File too large (max 25MB).'); return; }
    setSaving(true);
    try {
      const url = await uploadRadioFile(file);
      await radioFileOps({
        action: 'upload', file_url: url, file_name: fileName || file.name, file_size: file.size,
        radio_model_id: model.radio_model_id, manufacturer_name: model.manufacturer_name, model_name: model.model_name,
        description, notes, visibility, version, tags,
      });
      qc.invalidateQueries({ queryKey: ['radio-files-public'] });
      navigate('/radio-files');
    } catch (e) { setError(e.message || 'Upload failed'); }
    setSaving(false);
  };

  return (
    <div>
      <PageHeader title={editId ? 'Edit Radio File' : 'Upload Radio File'} showBack />
      <div className="px-4 pt-4 pb-6 space-y-4 max-w-2xl mx-auto">
        <div className="p-4 rounded-xl bg-card border border-border/60 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Radio Model *</Label>
            <RadioModelSelect value={model} onChange={setModel} />
          </div>

          {!editId && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">File *</Label>
              <input ref={fileInputRef} type="file" onChange={onPick} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-border hover:border-primary/40 bg-background/40 text-left">
                <Upload className="w-5 h-5 text-primary shrink-0" />
                {file ? (
                  <div><p className="text-sm text-foreground">{file.name}</p><p className="text-[10px] text-muted-foreground">{formatSize(file.size)} · {fileExt(file.name).toUpperCase()}</p></div>
                ) : <p className="text-sm text-muted-foreground">Choose a radio programming/config file (max 25MB)</p>}
              </button>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">File Name</Label>
            <Input value={fileName} onChange={(e) => setFileName(e.target.value)} className="h-10 bg-background/50" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What channels/config does this file contain?" className="bg-background/50" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Tones, offsets, usage notes…" className="bg-background/50" />
          </div>

          {!editId && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Version</Label>
                <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0" className="h-10 bg-background/50" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Visibility</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger className="h-10 bg-background/50"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="public">Public</SelectItem><SelectItem value="private">Private</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tags</Label>
            <div className="flex gap-2">
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Add a tag…" className="h-9 bg-background/50 text-sm" />
              <Button size="sm" variant="outline" onClick={() => addTag()}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((t) => <span key={t} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg flex items-center gap-1">{t}<button onClick={() => removeTag(t)} className="text-primary/60 hover:text-primary">×</button></span>)}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).slice(0, 8).map((t) => <button key={t} onClick={() => addTag(t)} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded hover:bg-secondary/70">+ {t}</button>)}
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button onClick={submit} disabled={saving} className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? <><Save className="w-4 h-4 mr-2" /> Save Changes</> : <><Upload className="w-4 h-4 mr-2" /> Upload File</>}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">Allowed: CSV, RDT, ALG, DAT, XML, JSON, TXT, PDF, XLSX and other radio config types. Executables are blocked.</p>
      </div>
    </div>
  );
}