import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, ShieldCheck, Star, Users, AlertTriangle, Edit, Trash2, Eye, EyeOff, Plus, Loader2, Zap, FileText } from 'lucide-react';
import { mist } from '@/api/mist';
import { useMistUser } from '@/hooks/useMistUser';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchFile, formatSize, fileExt, parseJSON, radioFileOps, uploadRadioFile, isAllowedFile, MAX_FILE_SIZE } from '@/lib/radioFiles';

// RadioFileDetail — full file details, version history, download (counter
// incremented server-side), the safety warning, owner management controls
// (edit / visibility / new version / delete), and admin moderation.
export default function RadioFileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useMistUser();
  const { isAdmin } = useAdminAccess();
  const [downloading, setDownloading] = useState(false);
  const [newVerOpen, setNewVerOpen] = useState(false);
  const [verFile, setVerFile] = useState(null);
  const [verLabel, setVerLabel] = useState('');
  const [verSaving, setVerSaving] = useState(false);

  const { data: file, isLoading } = useQuery({ queryKey: ['radio-file', id], queryFn: () => fetchFile(id), enabled: !!id, staleTime: 30000 });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!file) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <p className="text-sm text-muted-foreground">File not found or not available.</p>
      <Link to="/radio-files" className="text-primary text-sm">Back to library</Link>
    </div>
  );

  const versions = parseJSON(file.versions, []);
  const tags = parseJSON(file.tags, []);
  const isOwner = user && file.created_by_id === user.id;

  const doDownload = async (version) => {
    setDownloading(true);
    try {
      const res = await radioFileOps({ action: 'download', file_id: file.id, version });
      if (res?.url) window.open(res.url, '_blank');
      qc.invalidateQueries({ queryKey: ['radio-file', id] });
    } catch (e) { alert('Download failed: ' + (e.message || 'error')); }
    setDownloading(false);
  };

  const toggleVisibility = async () => {
    await mist.entities.RadioFile.update(file.id, { visibility: file.visibility === 'public' ? 'private' : 'public' });
    qc.invalidateQueries({ queryKey: ['radio-file', id] });
  };
  const softDelete = async () => {
    if (!confirm('Delete this file? Downloads will be blocked but the record is preserved for auditing.')) return;
    await mist.entities.RadioFile.update(file.id, { deleted: true, file_url: '' });
    navigate('/radio-files');
  };
  const adminSet = async (field, val) => { await mist.entities.RadioFile.update(file.id, { [field]: val }); qc.invalidateQueries({ queryKey: ['radio-file', id] }); };

  const addVersion = async () => {
    if (!verFile) return;
    if (!isAllowedFile(verFile.name)) { alert('File type not allowed.'); return; }
    if (verFile.size > MAX_FILE_SIZE) { alert('File too large (max 25MB).'); return; }
    setVerSaving(true);
    try {
      const url = await uploadRadioFile(verFile);
      await radioFileOps({ action: 'newVersion', file_id: file.id, file_url: url, file_name: verFile.name, file_size: verFile.size, version: verLabel || String(versions.length + 1) });
      setVerFile(null); setVerLabel(''); setNewVerOpen(false);
      qc.invalidateQueries({ queryKey: ['radio-file', id] });
    } catch (e) { alert('Upload failed: ' + (e.message || 'error')); }
    setVerSaving(false);
  };

  return (
    <div>
      <PageHeader title="Radio File" showBack />
      <div className="px-4 pt-4 pb-6 space-y-4 max-w-3xl mx-auto">
        <div className="p-4 rounded-xl bg-card border border-border/60">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><FileText className="w-6 h-6 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-foreground break-words">{file.file_name}</h1>
                {file.verified && <Badge color="emerald" icon={ShieldCheck}>Verified</Badge>}
                {file.featured && <Badge color="amber" icon={Star}>Featured</Badge>}
                {file.community && <Badge color="cyan" icon={Users}>Community</Badge>}
                <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full uppercase">v{file.version}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{file.manufacturer_name} {file.model_name}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <Meta label="Format" value={(fileExt(file.file_name) || file.file_type || '—').toUpperCase()} />
            <Meta label="Size" value={formatSize(file.file_size)} />
            <Meta label="Downloads" value={file.download_count || 0} />
            <Meta label="Uploaded" value={new Date(file.created_date).toLocaleDateString()} />
          </div>
        </div>

        {file.description && <Section title="Description"><p className="text-sm text-muted-foreground">{file.description}</p></Section>}
        {file.notes && <Section title="Notes"><p className="text-sm text-muted-foreground whitespace-pre-wrap">{file.notes}</p></Section>}

        <Section title="Compatibility">
          <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Zap className="w-4 h-4 text-cyan-400" /> Designed for <span className="text-foreground font-semibold">{file.manufacturer_name} {file.model_name}</span>.</p>
          <p className="text-xs text-muted-foreground mt-1">Add this radio to your profile to see it in your “Files for My Radios” feed.</p>
        </Section>

        {tags.length > 0 && <Section title="Tags"><div className="flex flex-wrap gap-1.5">{tags.map((t, i) => <span key={i} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-lg">{t}</span>)}</div></Section>}

        <Section title="Uploaded By">
          <Link to={`/profile?user=${file.uploader_id}`} className="text-sm text-primary hover:text-primary/80 flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">{(file.uploader_name || '?').charAt(0)}</div>
            {file.uploader_name || 'Unknown'}
          </Link>
        </Section>

        <Section title="Versions">
          <div className="space-y-2">
            {versions.map((v, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-background/40 border border-border/40">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">v{v.version}</span>
                    {v.version === file.version && <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded">LATEST</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{v.uploaded_by_name} · {new Date(v.uploaded_at).toLocaleDateString()} · {formatSize(v.file_size)}</p>
                </div>
                <button onClick={() => doDownload(v.version)} className="p-2 rounded-lg bg-secondary/60 text-muted-foreground hover:text-foreground" title={`Download v${v.version}`}><Download className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </Section>

        {!file.deleted && (
          <Button onClick={() => doDownload()} disabled={downloading} className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white">
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4 mr-2" /> Download File</>}
          </Button>
        )}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/90"><strong>Important:</strong> Always verify programming files before writing them to your radio. MISST does not guarantee that a community-uploaded file is correct for your location, radio configuration, or licensing requirements.</p>
        </div>

        {isOwner && !file.deleted && (
          <Section title="Manage Your File">
            <div className="flex flex-wrap gap-2">
              <Link to={`/radio-files/upload?edit=${file.id}`}><Button size="sm" variant="outline"><Edit className="w-4 h-4 mr-1" /> Edit</Button></Link>
              <Button size="sm" variant="outline" onClick={toggleVisibility}>{file.visibility === 'public' ? <><EyeOff className="w-4 h-4 mr-1" /> Make Private</> : <><Eye className="w-4 h-4 mr-1" /> Make Public</>}</Button>
              <Button size="sm" variant="outline" onClick={() => setNewVerOpen((v) => !v)}><Plus className="w-4 h-4 mr-1" /> New Version</Button>
              <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={softDelete}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>
            </div>
            {newVerOpen && (
              <div className="mt-3 p-3 rounded-lg bg-background/50 border border-primary/20 space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">New version file</Label>
                  <input type="file" onChange={(e) => setVerFile(e.target.files?.[0] || null)} className="text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Version label (e.g. 2.0)</Label>
                  <Input value={verLabel} onChange={(e) => setVerLabel(e.target.value)} placeholder="2.0" className="h-9 bg-background/50 text-sm" />
                </div>
                <Button onClick={addVersion} disabled={verSaving || !verFile} className="bg-violet-600 text-white h-9 text-sm">{verSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Version'}</Button>
              </div>
            )}
          </Section>
        )}

        {isAdmin && (
          <Section title="Admin Moderation">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => adminSet('verified', !file.verified)} className={file.verified ? 'border-emerald-500/40 text-emerald-300' : ''}><ShieldCheck className="w-4 h-4 mr-1" /> {file.verified ? 'Unverify' : 'Verify'}</Button>
              <Button size="sm" variant="outline" onClick={() => adminSet('featured', !file.featured)} className={file.featured ? 'border-amber-500/40 text-amber-300' : ''}><Star className="w-4 h-4 mr-1" /> {file.featured ? 'Unfeature' : 'Feature'}</Button>
              <Button size="sm" variant="outline" onClick={() => adminSet('community', !file.community)} className={file.community ? 'border-cyan-500/40 text-cyan-300' : ''}><Users className="w-4 h-4 mr-1" /> {file.community ? 'Unmark' : 'Community'}</Button>
              <Button size="sm" variant="outline" onClick={() => adminSet('hidden', !file.hidden)} className={file.hidden ? 'border-warning/40 text-warning' : ''}>{file.hidden ? <><Eye className="w-4 h-4 mr-1" /> Restore</> : <><EyeOff className="w-4 h-4 mr-1" /> Hide</>}</Button>
              {!file.deleted && <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={softDelete}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Meta({ label, value }) { return <div><p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p><p className="text-sm font-semibold text-foreground mt-0.5">{value}</p></div>; }
function Section({ title, children }) { return <div className="p-4 rounded-xl bg-card border border-border/60"><h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>{children}</div>; }
function Badge({ color, icon: Icon, children }) {
  const map = { emerald: 'text-emerald-300 bg-emerald-500/15 border-emerald-400/30', amber: 'text-amber-300 bg-amber-500/15 border-amber-400/30', cyan: 'text-cyan-300 bg-cyan-500/15 border-cyan-400/30' };
  return <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${map[color]}`}><Icon className="w-3 h-3" /> {children}</span>;
}