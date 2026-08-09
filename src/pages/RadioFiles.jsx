import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Radio, Upload, Search } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchAllPublicFiles, fetchManufacturers, fetchModels, searchFiles } from '@/lib/radioFiles';
import RadioFileCard from '@/components/radiofiles/RadioFileCard';

// RadioFiles — the community Radio File Library. Browse by manufacturer/model/
// file type, sort by newest/most-downloaded/most-popular, and full-text search
// across model, name, description, uploader, and tags. Supports ?uploader=
// and ?model= deep links from profiles and the dashboard.
export default function RadioFiles() {
  const [params] = useSearchParams();
  const [q, setQ] = useState('');
  const [mfr, setMfr] = useState('');
  const [model, setModel] = useState('');
  const [ftype, setFtype] = useState('');
  const [sort, setSort] = useState('newest');

  const { data: files = [] } = useQuery({ queryKey: ['radio-files-public'], queryFn: fetchAllPublicFiles, staleTime: 30000 });
  const { data: manufacturers = [] } = useQuery({ queryKey: ['radio-manufacturers'], queryFn: fetchManufacturers, staleTime: 60000 });
  const { data: models = [] } = useQuery({ queryKey: ['radio-models'], queryFn: fetchModels, staleTime: 60000 });

  const uploaderFilter = params.get('uploader');

  const filtered = useMemo(() => {
    let list = files;
    if (uploaderFilter) list = list.filter((f) => f.uploader_id === uploaderFilter);
    list = searchFiles(list, q);
    if (mfr) list = list.filter((f) => models.find((x) => x.id === f.radio_model_id)?.manufacturer_id === mfr);
    if (model) list = list.filter((f) => f.radio_model_id === model);
    if (ftype) list = list.filter((f) => (f.file_type || '') === ftype);
    if (sort === 'downloads' || sort === 'popular') list = [...list].sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
    else list = [...list].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    return list;
  }, [files, uploaderFilter, q, mfr, model, ftype, sort, models]);

  const modelOptions = mfr ? models.filter((m) => m.manufacturer_id === mfr) : models;
  const ftypes = useMemo(() => [...new Set(files.map((f) => f.file_type).filter(Boolean))].sort(), [files]);

  return (
    <div>
      <PageHeader
        title="Radio File Library"
        showBack
        rightAction={<Link to="/radio-files/upload"><Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white"><Upload className="w-4 h-4 mr-1" /> Upload</Button></Link>}
      />
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by model, name, description, uploader, tag…" className="pl-9 h-10" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Select value={mfr || undefined} onValueChange={(v) => { setMfr(v); setModel(''); }}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Manufacturer" /></SelectTrigger>
            <SelectContent>{manufacturers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={model || undefined} onValueChange={setModel}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Model" /></SelectTrigger>
            <SelectContent>{modelOptions.map((m) => <SelectItem key={m.id} value={m.id}>{m.model_name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={ftype || undefined} onValueChange={setFtype}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="File type" /></SelectTrigger>
            <SelectContent>{ftypes.map((t) => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="downloads">Most Downloaded</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground">{filtered.length} file{filtered.length !== 1 ? 's' : ''}</p>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Radio className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No files match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((f) => <RadioFileCard key={f.id} file={f} />)}
          </div>
        )}
      </div>
    </div>
  );
}