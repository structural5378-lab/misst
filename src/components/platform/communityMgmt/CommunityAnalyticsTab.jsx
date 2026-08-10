import React from "react";
import { useQuery } from "@tanstack/react-query";
import { mist } from '@/api/mist';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AdminStatCard from "@/components/platform/AdminStatCard";
import { Users, ShieldCheck, MessageSquare, CalendarClock, RadioTower, Radio } from "lucide-react";

export default function CommunityAnalyticsTab({ community, members }) {
  const { data: threads = [] } = useQuery({ queryKey: ["cm-analytics", "threads", community.id], queryFn: async () => (await mist.entities.ForumThread.filter({ community_id: community.id }, "-created_date", 500)) || [] });
  const { data: posts = [] } = useQuery({ queryKey: ["cm-analytics", "posts", community.id], queryFn: async () => (await mist.entities.ForumPost.list("-created_date", 1000)) || [] });
  const { data: events = [] } = useQuery({ queryKey: ["cm-analytics", "events", community.id], queryFn: async () => (await mist.entities.Event.filter({ community_id: community.id }, "-created_date", 500)) || [] });
  const { data: repeaters = [] } = useQuery({ queryKey: ["cm-analytics", "repeaters", community.id], queryFn: async () => (await mist.entities.Repeater.filter({ community_id: community.id }, "-created_date", 500)) || [] });
  const { data: nets = [] } = useQuery({ queryKey: ["cm-analytics", "nets", community.id], queryFn: async () => (await mist.entities.Net.filter({ community_id: community.id }, "-created_date", 500)) || [] });

  const activeMembers = members.filter((m) => m.status === "active").length;
  const mods = members.filter((m) => m.role === "moderator" || m.role === "community_admin" || m.role === "community_owner").length;
  const threadIds = new Set(threads.map((t) => t.id));
  const communityPosts = posts.filter((p) => threadIds.has(p.thread_id)).length;

  const chartData = [
    { name: "Members", value: activeMembers },
    { name: "Mods", value: mods },
    { name: "Threads", value: threads.length },
    { name: "Posts", value: communityPosts },
    { name: "Events", value: events.length },
    { name: "Repeaters", value: repeaters.length },
    { name: "Nets", value: nets.length },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <AdminStatCard icon={Users} label="Active Members" value={activeMembers} color="violet" />
        <AdminStatCard icon={ShieldCheck} label="Moderators" value={mods} color="rose" />
        <AdminStatCard icon={MessageSquare} label="Threads" value={threads.length} color="cyan" />
        <AdminStatCard icon={MessageSquare} label="Posts" value={communityPosts} color="blue" />
        <AdminStatCard icon={CalendarClock} label="Events" value={events.length} color="emerald" />
        <AdminStatCard icon={RadioTower} label="Repeaters" value={repeaters.length} color="amber" />
      </div>
      <div className="rounded-xl bg-card border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Community Snapshot</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}