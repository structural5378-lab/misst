import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, Users, TrendingUp, Gift, Award, Search } from 'lucide-react';

const PIE_COLORS = ['#a855f7', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#94a3b8'];

// PremiumBadgeAnalytics — admin analytics dashboard: revenue, active
// subscribers, badge popularity, gift count, and an owner search. Embedded at
// the top of the Premium Badge admin page.
export default function PremiumBadgeAnalytics({ badges = [] }) {
  const [ownerQuery, setOwnerQuery] = useState('');

  const { data: ownership = [] } = useQuery({
    queryKey: ['admin-premium-ownership-all'],
    queryFn: () => base44.entities.PremiumBadgeOwnership.filter({ status: 'active' }, '-purchased_at', 500),
  });

  const activeSubs = ownership.filter((o) => o.is_active).length;
  const totalRevenue = ownership.filter((o) => !o.is_earned).reduce((sum, o) => {
    const b = badges.find((bb) => bb.id === o.badge_id);
    return sum + (b?.price || 0);
  }, 0);
  const giftCount = ownership.filter((o) => o.is_gift).length;

  // Revenue by badge (bar chart)
  const revenueByBadge = badges.map((b) => ({
    name: b.name?.length > 10 ? b.name.slice(0, 10) + '…' : b.name,
    revenue: ownership.filter((o) => o.badge_id === b.id && !o.is_earned).length * (b.price || 0),
    sales: ownership.filter((o) => o.badge_id === b.id).length,
  })).filter((x) => x.sales > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  // Popularity pie
  const popularity = badges.map((b) => ({ name: b.name, value: ownership.filter((o) => o.badge_id === b.id).length })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value).slice(0, 6);

  // Owner search
  const ownerResults = ownerQuery.trim()
    ? ownership.filter((o) => (o.user_name || o.user_id || '').toLowerCase().includes(ownerQuery.toLowerCase()) || (o.badge_name || '').toLowerCase().includes(ownerQuery.toLowerCase())).slice(0, 20)
    : [];

  const stats = [
    { icon: DollarSign, label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, color: '#22c55e' },
    { icon: Users, label: 'Active Subscribers', value: activeSubs, color: '#06b6d4' },
    { icon: TrendingUp, label: 'Total Owners', value: ownership.length, color: '#a855f7' },
    { icon: Gift, label: 'Gifts Sent', value: giftCount, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-card border border-border p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}1a` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Revenue by badge */}
        <div className="rounded-xl bg-card border border-border p-3">
          <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Revenue by Badge</p>
          {revenueByBadge.length === 0 ? <p className="text-xs text-muted-foreground py-8 text-center">No sales yet.</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueByBadge} margin={{ top: 4, right: 4, bottom: 4, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Popularity pie */}
        <div className="rounded-xl bg-card border border-border p-3">
          <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> Badge Popularity</p>
          {popularity.length === 0 ? <p className="text-xs text-muted-foreground py-8 text-center">No owners yet.</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={popularity} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}>
                  {popularity.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Owner search */}
      <div className="rounded-xl bg-card border border-border p-3">
        <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5"><Search className="w-3.5 h-3.5" /> Owner Search</p>
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={ownerQuery} onChange={(e) => setOwnerQuery(e.target.value)} placeholder="Search by member name or badge…" className="w-full h-9 rounded-lg bg-background border border-input pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        {ownerResults.length > 0 && (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {ownerResults.map((o) => (
              <div key={o.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 text-xs">
                <span className="font-medium text-foreground truncate flex-1">{o.user_name || o.user_id}</span>
                <span className="text-muted-foreground truncate">{o.badge_name}</span>
                {o.is_active && <span className="text-emerald-400">active</span>}
                {o.is_gift && <Gift className="w-3 h-3 text-amber-400" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}