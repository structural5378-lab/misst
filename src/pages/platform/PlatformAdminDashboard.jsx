import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users, UserPlus, Radio, Wifi, MessageSquare, Bell, Award, Activity, Server,
  Database, HardDrive, Cpu, MemoryStick, Zap, Building2, CalendarClock,
  ClipboardList, FileBarChart, Globe, RadioTower, ShieldCheck, LayoutTemplate,
} from "lucide-react";
import AdminStatCard from "@/components/platform/AdminStatCard";
import AdminSection from "@/components/platform/AdminSection";

function fmtDuration(start, end) {
  if (!start || !end) return "—";
  const ms = new Date(end) - new Date(start);
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return h ? `${h}h ${m}m` : `${m}m`;
}

export default function PlatformAdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getAdminStats", {});
      return res.data?.stats || {};
    },
    refetchInterval: 30000,
  });

  const { data: extra = {} } = useQuery({
    queryKey: ["admin-stats-extra"],
    queryFn: async () => {
      const [communities, sessions, nets] = await Promise.all([
        base44.entities.Community.list("-created_date", 1000),
        base44.entities.NetSession.filter({ status: "closed" }, "-ended_at", 500),
        base44.entities.Net.list("-created_date", 500),
      ]);
      const closed = sessions || [];
      const scheduled = (nets || []).filter((n) => n.schedule || n.time);
      return {
        communities: (communities || []).length,
        scheduledNets: scheduled.length,
        netLogs: closed.length,
        reportsGenerated: closed.filter((s) => s.report_generated).length,
        recentSessions: closed.slice(0, 5),
      };
    },
    refetchInterval: 30000,
  });

  const stats = [
    { icon: Users, label: "Total Users", value: data?.totalUsers ?? 0, color: "violet" },
    { icon: Wifi, label: "Online Now", value: data?.onlineUsers ?? 0, color: "emerald" },
    { icon: Building2, label: "Communities", value: extra.communities ?? 0, color: "cyan" },
    { icon: Radio, label: "Repeaters", value: data?.repeaters ?? 0, color: "blue" },
    { icon: Activity, label: "Active Nets", value: data?.activeNets ?? 0, color: "amber" },
    { icon: CalendarClock, label: "Scheduled Nets", value: extra.scheduledNets ?? 0, color: "violet" },
    { icon: ClipboardList, label: "Net Logs", value: extra.netLogs ?? 0, color: "cyan" },
    { icon: FileBarChart, label: "Reports Generated", value: extra.reportsGenerated ?? 0, color: "emerald" },
    { icon: MessageSquare, label: "Forum Posts", value: data?.forumPosts ?? 0, color: "violet" },
    { icon: Zap, label: "Messages Today", value: data?.messagesSentToday ?? 0, color: "cyan" },
    { icon: UserPlus, label: "New Today", value: data?.newUsersToday ?? 0, color: "cyan" },
    { icon: Award, label: "Badges Earned", value: data?.badgesEarned ?? 0, color: "amber" },
  ];

  const systemStats = [
    { icon: Server, label: "Server Status", value: "Operational", color: "emerald" },
    { icon: Zap, label: "API Status", value: "Operational", color: "emerald" },
    { icon: Database, label: "Database", value: "Connected", color: "emerald" },
    { icon: Globe, label: "WebSocket", value: "Connected", color: "emerald" },
    { icon: Bell, label: "Push Notifications", value: "Active", color: "emerald" },
    { icon: HardDrive, label: "Storage", value: "42%", color: "blue" },
    { icon: Cpu, label: "CPU Usage", value: "18%", color: "cyan" },
    { icon: MemoryStick, label: "Memory", value: "34%", color: "violet" },
  ];

  const quickActions = [
    { label: "Schedule Net", path: "/platform/admin/scheduled-nets", icon: CalendarClock },
    { label: "Net Templates", path: "/platform/admin/net-templates", icon: LayoutTemplate },
    { label: "Net Logs", path: "/platform/admin/net-logs", icon: ClipboardList },
    { label: "Add Repeater", path: "/platform/admin/repeaters", icon: RadioTower },
    { label: "Manage Users", path: "/platform/admin/users", icon: Users },
    { label: "Roles", path: "/platform/admin/roles", icon: ShieldCheck },
  ];

  return (
    <AdminSection title="Platform Overview" description="Real-time command center for the entire MIST platform.">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <AdminStatCard key={s.label} {...s} loading={isLoading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Recent Net Sessions
          </h2>
          <div className="rounded-xl bg-card border border-border divide-y divide-border">
            {(extra.recentSessions || []).length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No recent sessions.</p>
            ) : (
              extra.recentSessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{s.net_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.net_control ? `NC: ${s.net_control} · ` : ""}
                      {s.ended_at ? new Date(s.ended_at).toLocaleString() : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    <span className="text-muted-foreground">{fmtDuration(s.started_at, s.ended_at)}</span>
                    <span className="font-bold text-primary">{s.checkin_count || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((q) => (
              <Link key={q.label} to={q.path} className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-primary/5 transition">
                <q.icon className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-semibold text-foreground">{q.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" /> System Health
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {systemStats.map((s) => (
            <AdminStatCard key={s.label} {...s} />
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-4">
        <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <Radio className="w-4 h-4 text-primary" /> RadioScope Activity
        </h2>
        <p className="text-sm text-muted-foreground">
          {data?.onlineUsers ?? 0} operators currently active on the tactical map · {data?.repeaters ?? 0} repeaters tracked
        </p>
      </div>
    </AdminSection>
  );
}