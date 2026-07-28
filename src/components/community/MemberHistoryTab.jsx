import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Search, Download, FileText, Loader2 } from 'lucide-react';
import { exportHistoryCSV, exportHistoryPDF } from '@/lib/moderationExport';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'membership', label: 'Membership' },
  { id: 'moderation', label: 'Moderation' },
  { id: 'chat', label: 'Chat' },
  { id: 'reports', label: 'Reports' },
  { id: 'notes', label: 'Notes' },
  { id: 'roles', label: 'Roles' },
  { id: 'settings', label: 'Settings' },
  { id: 'other', label: 'Other' },
];

const SOURCE_TONE = {
  audit: 'bg-primary/10 text-primary', report_filed: 'bg-amber-500/10 text-amber-400',
  report_against: 'bg-rose-500/10 text-rose-400', note: 'bg-violet-500/10 text-violet-400',
};

export default function MemberHistoryTab({ community, targetUser, memberName }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [skip, setSkip] = useState(0);
  const limit = 25;

  const { data, isLoading } = useQuery({
    queryKey: ['member-mod-history', community.id, targetUser.user_id, search, category, dateFrom, dateTo, skip],
    queryFn: async () => (await base44.functions.invoke('listMemberModerationHistory', {
      community_id: community.id, target_user_id: targetUser.user_id,
      category, search, date_from: dateFrom || undefined, date_to: dateTo || undefined, skip, limit,
    })).data,
  });

  const entries = data?.entries || [];
  const total = data?.total || 0;

  const exportCSV = () => exportHistoryCSV(entries, memberName);
  const exportPDF = () => exportHistoryPDF(entries, community.name, memberName);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setSkip(0); }}
          placeholder="Search actions, reasons, admins…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-card border border-border text-sm focus:border-primary outline-none" />
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => { setCategory(c.id); setSkip(0); }}
            className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border ${category === c.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'}`}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setSkip(0); }} className="flex-1 px-2 py-2 rounded-lg bg-card border border-border text-xs" />
        <span className="text-muted-foreground text-xs">to</span>
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setSkip(0); }} className="flex-1 px-2 py-2 rounded-lg bg-card border border-border text-xs" />
        <button onClick={exportCSV} className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-primary shrink-0" title="Export CSV"><Download className="w-4 h-4" /></button>
        <button onClick={exportPDF} className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-primary shrink-0" title="Export PDF"><FileText className="w-4 h-4" /></button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8"><p className="text-sm text-muted-foreground">No history entries found.</p></div>
      ) : (
        <div className="space-y-2">
          {entries.map((e, i) => (
            <div key={e.id || i} className="p-3 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${SOURCE_TONE[e.source] || 'bg-slate-500/10 text-slate-400'}`}>{e.source.replace('_', ' ')}</span>
                <span className="text-[10px] text-muted-foreground">{e.date ? format(new Date(e.date), "MMM d, yyyy 'at' h:mm a") : ''}</span>
              </div>
              <p className="text-sm text-foreground mt-1 font-medium">{e.action_label || e.action}</p>
              {e.admin_name && <p className="text-xs text-muted-foreground">by {e.admin_name}</p>}
              {e.reason && <p className="text-xs text-muted-foreground mt-0.5">{e.reason}</p>}
              <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-muted-foreground">
                {e.duration && <span>Duration: {e.duration}</span>}
                {e.room_name && <span>Room: {e.room_name}</span>}
                {e.message_preview && <span className="truncate max-w-[200px]">“{e.message_preview}”</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <button disabled={skip === 0} onClick={() => setSkip((s) => Math.max(0, s - limit))} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-card border border-border disabled:opacity-40">Previous</button>
        <span className="text-xs text-muted-foreground">{total === 0 ? '0' : `${Math.min(skip + 1, total)}–${Math.min(skip + limit, total)} of ${total}`}</span>
        <button disabled={skip + limit >= total} onClick={() => setSkip((s) => s + limit)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-card border border-border disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}