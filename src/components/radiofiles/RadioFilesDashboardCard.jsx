import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Radio, FolderOpen, Upload, Zap, ChevronRight } from 'lucide-react';
import {
  fetchUserRadios, fetchCompatibleFiles, fetchMyUploads, parseJSON,
} from '@/lib/radioFiles';
import { useMistUser } from '@/hooks/useMistUser';
import RadioFileCard from './RadioFileCard';

// RadioFilesDashboardCard — the "📻 RADIO FILES" dashboard module. Shows the
// member's radio count, compatible community files count, their upload count,
// and a short list of the newest compatible files. Links to the library.
export default function RadioFilesDashboardCard() {
  const { user } = useMistUser();
  const uid = user?.id;

  const { data: myRadios = [] } = useQuery({
    queryKey: ['my-radios', uid], queryFn: () => fetchUserRadios(uid), enabled: !!uid, staleTime: 30000,
  });
  const modelIds = myRadios.map((r) => r.radio_model_id).filter(Boolean);
  const { data: compatible = [] } = useQuery({
    queryKey: ['compatible-files', modelIds.join(',')],
    queryFn: () => fetchCompatibleFiles(modelIds),
    enabled: modelIds.length > 0,
    staleTime: 30000,
  });
  const { data: myUploads = [] } = useQuery({
    queryKey: ['my-uploads', uid], queryFn: () => fetchMyUploads(uid), enabled: !!uid, staleTime: 30000,
  });

  const newest = [...compatible].slice(0, 3);

  return (
    <section className="rounded-2xl bg-card/50 border border-border/60 p-4 backdrop-blur-md">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center"><Radio className="w-4 h-4 text-primary" /></div>
        <h3 className="text-sm font-bold text-foreground">Radio Files</h3>
        <Link to="/radio-files" className="ml-auto text-xs text-primary font-medium flex items-center gap-0.5 hover:text-primary/80">
          Open Library <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <Stat icon={Radio} label="My Radios" value={myRadios.length} color="text-violet-300" />
        <Stat icon={Zap} label="Compatible" value={compatible.length} color="text-cyan-300" />
        <Stat icon={Upload} label="My Uploads" value={myUploads.length} color="text-emerald-300" />
      </div>

      {newest.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <FolderOpen className="w-3 h-3" /> Newest for your radios
          </p>
          <div className="space-y-2">
            {newest.map((f) => <RadioFileCard key={f.id} file={f} compat />)}
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground mb-2">
            {myRadios.length === 0 ? 'Add radios to your profile to see compatible files.' : 'No compatible files yet.'}
          </p>
          <Link to="/radio-files" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            Browse Library <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </section>
  );
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-lg bg-background/40 border border-border/40 p-2.5 text-center">
      <Icon className={`w-4 h-4 ${color} mx-auto`} />
      <p className="text-lg font-black text-foreground tabular-nums leading-none mt-1">{value}</p>
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}