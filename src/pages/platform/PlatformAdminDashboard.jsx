import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Users, UserPlus, Radio, Wifi, MessageSquare, Bell, Award, Activity, Server, Database, HardDrive, Cpu, MemoryStick, Zap } from "lucide-react";
import AdminStatCard from "@/components/platform/AdminStatCard";
import AdminSection from "@/components/platform/AdminSection";

export default function PlatformAdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getAdminStats", {});
      return res.data?.stats || {};
    },
    refetchInterval: 30000,
  });

  const stats = [
    { icon: Users, label: "Total Users", value: data?.totalUsers ?? 0, color: "violet" },
    { icon: Wifi, label: "Online Now", value: data?.onlineUsers ?? 0, color: "emerald" },
    { icon: UserPlus, label: "New Today", value: data?.newUsersToday ?? 0, color: "cyan" },
    { icon: Radio, label: "Repeaters", value: data?.repeaters ?? 0, color: "blue" },
    { icon: Activity, label: "Active Nets", value: data?.activeNets ?? 0, color: "amber" },
    { icon: MessageSquare, label: "Forum Posts", value: data?.forumPosts ?? 0, color: "violet" },
    { icon: Zap, label: "Messages Today", value: data?.messagesSentToday ?? 0, color: "cyan" },
    { icon: Bell, label: "Reports Pending", value: data?.reportsPending ?? 0, color: "rose" },
    { icon: Award, label: "Badges Earned", value: data?.badgesEarned ?? 0, color: "amber" },
  ];

  const systemStats = [
    { icon: Server, label: "Server Status", value: "Operational", color: "emerald" },
    { icon: Zap, label: "API Status", value: "Operational", color: "emerald" },
    { icon: Database, label: "Database", value: "Connected", color: "emerald" },
    { icon: HardDrive, label: "Storage", value: "42%", color: "blue" },
    { icon: Cpu, label: "CPU Usage", value: "18%", color: "cyan" },
    { icon: MemoryStick, label: "Memory", value: "34%", color: "violet" },
  ];

  return (
    <AdminSection title="Platform Overview" description="Real-time command center for the entire MIST platform.">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 mb-6">
        {stats.map((s) => (
          <AdminStatCard key={s.label} {...s} loading={isLoading} />
        ))}
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" /> System Health
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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