import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Download, FileText, Shield, Users, Ban, UserX, Trash2, AlertTriangle, Megaphone, Lock, Activity } from 'lucide-react';
import AnalyticsCharts from './AnalyticsCharts';
import { exportAnalyticsCSV, exportAnalyticsPDFFromDOM } from '@/lib/moderationExport';

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
  { id: 'custom', label: 'Custom' },
];

function Card({ icon: Icon, label, value, tone = 'primary' }) {
  const tones = {
    primary: 'bg-primary/10 text-primary', amber: 'bg-amber-500/10 text-amber-500',
    red: 'bg-destructive/10 text-destructive', violet: 'bg-violet-500/10 text-violet-500', cyan: 'bg-cyan-500/10 text-cyan-500',
  };
  return (
    <div className="rounded-xl border border-border bg-card/40 p-3 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tones[tone]}`}><Icon className="w-5 h-5" /></div>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-none">{value ?? 0}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );
}

export default function ModerationAnalytics({ community }) {
  const captureRef = useRef(null);
  const [range, setRange] = useState('30d');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['moderation-analytics', community.id, range, dateFrom, dateTo],
    queryFn: async () => (await base44.functions.invoke('getModerationAnalytics', {
      community_id: community.id, range, date_from: dateFrom || undefined, date_to: dateTo || undefined,
    })).data,
    refetchInterval: 15000, // real-time auto-refresh
  });

  const s = data?.summary || {};
  const effectiveRange = range === 'custom' ? `${dateFrom || '…'} → ${dateTo || '…'}` : RANGES.find((r) => r.id === range)?.label || range;

  const doExportCSV = () => exportAnalyticsCSV(data || {});
  const doExportPDF = async () => {
    if (!captureRef.current) return;
    setExporting(true);
    try { await exportAnalyticsPDFFromDOM(captureRef.current, { ...data, range: effectiveRange }); }
    finally { setExporting(false); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {RANGES.map((r) => (
            <button key={r.id} onClick={() => setRange(r.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border ${range === r.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'}`}>
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <button onClick={doExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card border border-border text-muted-foreground hover:text-primary"><Download className="w-3.5 h-3.5" /> CSV</button>
          <button onClick={doExportPDF} disabled={exporting} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card border border-border text-muted-foreground hover:text-primary disabled:opacity-50"><FileText className="w-3.5 h-3.5" /> {exporting ? 'PDF…' : 'PDF'}</button>
        </div>
      </div>

      {range === 'custom' && (
        <div className="flex gap-2 items-center">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="flex-1 px-2 py-2 rounded-lg bg-card border border-border text-xs" />
          <span className="text-muted-foreground text-xs">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="flex-1 px-2 py-2 rounded-lg bg-card border border-border text-xs" />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div ref={captureRef} className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-foreground">{community.name} · Moderation Analytics</h3>
            <span className="text-[10px] text-muted-foreground">{effectiveRange}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <Card icon={Activity} label="Total Actions" value={s.totalActions} tone="cyan" />
            <Card icon={Users} label="Active Mutes" value={s.activeMutes} tone="amber" />
            <Card icon={UserX} label="Active Suspensions" value={s.activeSuspensions} tone="red" />
            <Card icon={Ban} label="Total Bans" value={s.totalBans} tone="red" />
            <Card icon={Trash2} label="Deleted Messages" value={s.deletedMessages} tone="red" />
            <Card icon={AlertTriangle} label="Reports Reviewed" value={s.reportsReviewed} tone="amber" />
            <Card icon={Megaphone} label="Announcements" value={s.announcements} tone="violet" />
            <Card icon={Lock} label="Locked Rooms" value={s.lockedRooms} tone="primary" />
          </div>
          <AnalyticsCharts charts={data?.charts || {}} />
        </div>
      )}
    </div>
  );
}