import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, MessageSquare, Users, Activity } from "lucide-react";
import AdminSection from "@/components/platform/AdminSection";
import { useThemeColors } from "@/hooks/useThemeColors";

function groupByDate(items, dateField = "created_date", days = 7) {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    result.push({ date: key.slice(5), count: 0 });
  }
  const map = {};
  result.forEach(r => { map[r.date] = r; });
  (items || []).forEach(item => {
    const d = item[dateField]?.split("T")[0]?.slice(5);
    if (d && map[d]) map[d].count++;
  });
  return result;
}

export default function PlatformAdminAnalytics() {
  const tc = useThemeColors();
  const { data: users = [] } = useQuery({ queryKey: ["analytics-users"], queryFn: async () => await base44.entities.User.list("-created_date", 500) });
  const { data: messages = [] } = useQuery({ queryKey: ["analytics-messages"], queryFn: async () => await base44.entities.ChatMessage.list("-created_date", 500) });
  const { data: posts = [] } = useQuery({ queryKey: ["analytics-posts"], queryFn: async () => await base44.entities.ForumPost.list("-created_date", 500) });

  const userData = groupByDate(users);
  const msgData = groupByDate(messages);
  const postData = groupByDate(posts);

  const topMembers = Object.entries(
    (messages || []).reduce((acc, m) => { acc[m.sender_name] = (acc[m.sender_name] || 0) + 1; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const cards = [
    { icon: Users, label: "Daily New Users", data: userData, color: tc.chart1 },
    { icon: MessageSquare, label: "Messages / Day", data: msgData, color: tc.chart2 },
    { icon: Activity, label: "Forum Posts / Day", data: postData, color: tc.chart3 },
  ];

  return (
    <AdminSection title="Analytics" description="Platform activity and growth metrics">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {cards.map(c => (
          <div key={c.label} className="rounded-xl bg-card border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3"><c.icon className="w-4 h-4" style={{ color: c.color }} />{c.label}</h3>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={c.data}>
                <defs><linearGradient id={`g-${c.label}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c.color} stopOpacity={0.4} /><stop offset="100%" stopColor={c.color} stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: tc.mutedForeground }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: tc.card, border: `1px solid ${tc.border}`, borderRadius: "8px", fontSize: "12px" }} />
                <Area type="monotone" dataKey="count" stroke={c.color} fill={`url(#g-${c.label})`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-card border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-primary" />User Growth (7 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={userData}>
              <CartesianGrid strokeDasharray="3 3" stroke={tc.border} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: tc.mutedForeground }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tc.mutedForeground }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: tc.card, border: `1px solid ${tc.border}`, borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="count" fill={tc.chart1} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-card border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3"><MessageSquare className="w-4 h-4 text-accent" />Most Active Members</h3>
          <div className="space-y-2">
            {topMembers.map(([name, count], i) => (
              <div key={name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/50 border border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary w-5">{i + 1}</span>
                  <span className="text-sm text-foreground">{name || "Unknown"}</span>
                </div>
                <span className="text-xs text-muted-foreground">{count} messages</span>
              </div>
            ))}
            {topMembers.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">No activity yet</div>}
          </div>
        </div>
      </div>
    </AdminSection>
  );
}