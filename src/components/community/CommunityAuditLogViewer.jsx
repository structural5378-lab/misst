import React, { useState } from 'react';
import { useCommunity } from '@/contexts/CommunityContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, Download, History } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'membership', label: 'Membership' },
  { id: 'moderation', label: 'Moderation' },
  { id: 'roles', label: 'Role Changes' },
  { id: 'settings', label: 'Settings' },
  { id: 'other', label: 'Other' },
];

function formatAction(action) {
  if (action && action.startsWith('set_role:')) return 'Set role → ' + action.split(':')[1];
  const map = {
    approve: 'Approved', reject: 'Rejected', ban: 'Banned', unban: 'Unbanned',
    suspend: 'Suspended', unsuspend: 'Unsuspended', mute: 'Muted', unmute: 'Unmuted',
    kick: 'Removed', update_settings: 'Updated Settings',
  };
  return map[action] || action;
}

export default function CommunityAuditLogViewer() {
  const { community } = useCommunity();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [skip, setSkip] = useState(0);
  const limit = 25;

  const { data, isLoading } = useQuery({
    queryKey: ['community-audit-log', community.id, category, search, dateFrom, dateTo, skip],
    queryFn: async () =>
      (await base44.functions.invoke('listCommunityAuditLog', {
        community_id: community.id,
        category,
        search,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        skip,
        limit,
      })).data,
  });

  const entries = data?.entries || [];
  const total = data?.total || 0;

  const exportCSV = () => {
    const rows = [['Timestamp', 'Admin', 'Action', 'Category', 'Target', 'Reason']];
    entries.forEach((e) =>
      rows.push([
        e.created_date || '',
        e.admin_name || '',
        e.action || '',
        e.category || '',
        e.target_user_name || '',
        (e.reason || '').replace(/,/g, ';'),
      ])
    );
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${community.slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSkip(0); }}
          placeholder="Search admin, action, target…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary outline-none"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => { setCategory(c.id); setSkip(0); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
              category === c.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/40'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setSkip(0); }} className="flex-1 px-2 py-2 rounded-lg bg-card border border-border text-xs text-foreground" />
        <span className="text-muted-foreground text-xs">to</span>
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setSkip(0); }} className="flex-1 px-2 py-2 rounded-lg bg-card border border-border text-xs text-foreground" />
        <button onClick={exportCSV} className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-primary shrink-0" title="Export CSV">
          <Download className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8">
          <History className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No audit entries found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.id} className="p-3 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">{e.admin_name || 'Admin'}</span>
                <span className="text-[10px] text-muted-foreground">{e.created_date && format(new Date(e.created_date), "MMM d, yyyy 'at' h:mm a")}</span>
              </div>
              <p className="text-sm text-foreground mt-1">
                {formatAction(e.action)}
                {e.target_user_name ? <span className="text-muted-foreground"> · {e.target_user_name}</span> : null}
              </p>
              {e.reason && <p className="text-xs text-muted-foreground mt-0.5">{e.reason}</p>}
              <span className="inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground capitalize">{e.category}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button disabled={skip === 0} onClick={() => setSkip((s) => Math.max(0, s - limit))} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-card border border-border text-muted-foreground disabled:opacity-40">Previous</button>
        <span className="text-xs text-muted-foreground">{total === 0 ? '0' : `${Math.min(skip + 1, total)}–${Math.min(skip + limit, total)} of ${total}`}</span>
        <button disabled={skip + limit >= total} onClick={() => setSkip((s) => s + limit)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-card border border-border text-muted-foreground disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}