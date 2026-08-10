import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { mist } from '@/api/mist';
import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Send, CheckCircle, XCircle, Clock, Eye, Smartphone, Radio, Inbox, Bell, TrendingUp, Activity, Users } from "lucide-react";
import AdminSection from "@/components/platform/AdminSection";
import NotificationAdminTabs from "@/components/platform/NotificationAdminTabs";
import { useThemeColors } from "@/hooks/useThemeColors";
import { NOTIF_FILTERS } from "@/lib/notificationTypes";

const RANGES = [{ id: "all", label: "All Time" }, { id: "today", label: "Today" }, { id: "week", label: "This Week" }, { id: "month", label: "This Month" }];
const PLATFORMS = [{ id: "", label: "All Platforms" }, { id: "web", label: "Web" }, { id: "android", label: "Android" }, { id: "ios", label: "iOS" }];

function Card({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl bg-card border border-border p-4 fade-in">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}22`, color }}><Icon className="w-4 h-4" /></div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function ChartCard({ title, icon: Icon, children, color }) {
  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3"><Icon className="w-4 h-4" style={{ color }} />{title}</h3>
      {children}
    </div>
  );
}

export default function PlatformAdminNotifications() {
  const tc = useThemeColors();
  const [communityId, setCommunityId] = useState("");
  const [category, setCategory] = useState("");
  const [range, setRange] = useState("all");
  const [platform, setPlatform] = useState("");

  const { data: communities = [] } = useQuery({ queryKey: ["admin-communities-list"], queryFn: () => mist.entities.Community.list("-created_date", 200) });

  const { data, isLoading } = useQuery({
    queryKey: ["notif-analytics", communityId, category, range, platform],
    queryFn: async () => (await base44.functions.invoke("getNotificationAnalytics", { community_id: communityId, category, range, platform }))?.data,
    refetchInterval: 30000,
  });

  const a = data || {};
  const cards = [
    { icon: Send, label: "Sent Today", value: a.cards?.today ?? 0, color: tc.chart1 },
    { icon: TrendingUp, label: "This Week", value: a.cards?.week ?? 0, color: tc.chart2 },
    { icon: Bell, label: "This Month", value: a.cards?.month ?? 0, color: tc.chart3 },
    { icon: CheckCircle, label: "Push Success", value: `${(a.cards?.pushSuccessRate ?? 0).toFixed(1)}%`, color: tc.success },
    { icon: XCircle, label: "Push Failure", value: `${(a.cards?.pushFailureRate ?? 0).toFixed(1)}%`, color: tc.destructive },
    { icon: Clock, label: "Avg Delivery", value: a.cards?.avgDeliveryMs ? `${Math.round(a.cards.avgDeliveryMs)}ms` : "—", color: tc.info },
    { icon: Eye, label: "Avg Read Time", value: a.cards?.avgReadMs ? `${Math.round(a.cards.avgReadMs / 1000)}s` : "—", color: tc.accent },
    { icon: Smartphone, label: "Active Tokens", value: a.cards?.activeTokens ?? 0, color: tc.chart4 },
    { icon: Radio, label: "Total Devices", value: a.cards?.totalDevices ?? 0, color: tc.chart5 },
    { icon: Inbox, label: "Pending Queue", value: a.cards?.pendingQueue ?? 0, color: tc.warning },
  ];

  const PIE_COLORS = [tc.success, tc.destructive, tc.warning, tc.chart4];

  return (
    <AdminSection title="Notification Analytics" description="Real-time delivery metrics across the platform">
      <NotificationAdminTabs />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <select value={communityId} onChange={(e) => setCommunityId(e.target.value)} className="h-9 rounded-lg bg-card border border-border px-3 text-sm text-foreground">
          <option value="">All Communities</option>
          {communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 rounded-lg bg-card border border-border px-3 text-sm text-foreground">
          <option value="">All Categories</option>
          {NOTIF_FILTERS.filter((f) => f.id !== "all").map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
        <select value={range} onChange={(e) => setRange(e.target.value)} className="h-9 rounded-lg bg-card border border-border px-3 text-sm text-foreground">
          {RANGES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="h-9 rounded-lg bg-card border border-border px-3 text-sm text-foreground">
          {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <span className="ml-auto text-[11px] text-muted-foreground self-center">Auto-refresh 30s · sample {a.sample?.notifications ?? 0}N / {a.sample?.deliveries ?? 0}D</span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {isLoading && !a.cards
          ? Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-card border border-border animate-pulse" />)
          : cards.map((c) => <Card key={c.label} {...c} />)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Notifications Per Day (14d)" icon={Activity} color={tc.chart1}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={a.perDay || []}>
              <defs><linearGradient id="g-perday" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={tc.chart1} stopOpacity={0.4} /><stop offset="100%" stopColor={tc.chart1} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={tc.border} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: tc.mutedForeground }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tc.mutedForeground }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: tc.card, border: `1px solid ${tc.border}`, borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke={tc.chart1} fill="url(#g-perday)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Notifications By Category" icon={Bell} color={tc.chart2}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={a.perCategory || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={tc.border} />
              <XAxis type="number" tick={{ fontSize: 10, fill: tc.mutedForeground }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 9, fill: tc.mutedForeground }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ background: tc.card, border: `1px solid ${tc.border}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill={tc.chart2} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Push Success vs Failure" icon={CheckCircle} color={tc.success}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={a.successFailure || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {(a.successFailure || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: tc.card, border: `1px solid ${tc.border}`, borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Read vs Unread" icon={Eye} color={tc.accent}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={a.readUnread || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {(a.readUnread || []).map((_, i) => <Cell key={i} fill={[tc.success, tc.mutedForeground][i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: tc.card, border: `1px solid ${tc.border}`, borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Top Communities" icon={Activity} color={tc.chart3}>
          <div className="space-y-2">
            {(a.topCommunities || []).map((c, i) => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/50 border border-border">
                <span className="text-sm text-foreground truncate"><span className="text-xs font-bold text-primary mr-2">{i + 1}</span>{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.count}</span>
              </div>
            ))}
            {(!a.topCommunities || a.topCommunities.length === 0) && <div className="py-6 text-center text-sm text-muted-foreground">No data</div>}
          </div>
        </ChartCard>

        <ChartCard title="Most Active Users" icon={Users} color={tc.chart4}>
          <div className="space-y-2">
            {(a.topUsers || []).map((u, i) => (
              <div key={u.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/50 border border-border">
                <span className="text-sm text-foreground truncate"><span className="text-xs font-bold text-primary mr-2">{i + 1}</span>{u.name}</span>
                <span className="text-xs text-muted-foreground">{u.count}</span>
              </div>
            ))}
            {(!a.topUsers || a.topUsers.length === 0) && <div className="py-6 text-center text-sm text-muted-foreground">No data</div>}
          </div>
        </ChartCard>

        <ChartCard title="Most Triggered Types" icon={TrendingUp} color={tc.chart5}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={a.topTypes || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={tc.border} />
              <XAxis dataKey="label" tick={{ fontSize: 8, fill: tc.mutedForeground }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10, fill: tc.mutedForeground }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: tc.card, border: `1px solid ${tc.border}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill={tc.chart5} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </AdminSection>
  );
}