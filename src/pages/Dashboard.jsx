import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useMistUser } from "@/hooks/useMistUser";
import { useQuery } from "@tanstack/react-query";
import { Bell, Radio, Users, Info, AlertTriangle, Settings, MessageSquare, ChevronRight, MapPin, Sun, Wrench, Globe, Camera, UserCircle2, ShoppingBag, SignalHigh, Trophy, Shield } from "lucide-react";
import { format } from "date-fns";
import StormTracker from "@/components/weather/StormTracker";
import PropagationGauge from "@/components/dashboard/PropagationGauge";
import OnlineMembersSheet from "@/components/members/OnlineMembersSheet";
import RadioScopeTile from "@/components/radioscope/RadioScopeTile";
import OperatorCard from "@/components/profile/OperatorCard";
import NextNetCard from "@/components/dashboard/NextNetCard";
import StatsGrid from "@/components/dashboard/StatsGrid";
import XPLevelCard from "@/components/dashboard/XPLevelCard";
import MembershipFooter from "@/components/dashboard/MembershipFooter";

const quickItems = [
  { icon: Radio, label: "Repeaters", path: "/repeaters", color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: MapPin, label: "Map", path: "/map", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { icon: Users, label: "Nets", path: "/nets", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { icon: Sun, label: "Weather", path: "/weather", color: "text-amber-400", bg: "bg-amber-500/10" },
  { icon: Wrench, label: "Tools", path: "/tools", color: "text-sky-400", bg: "bg-sky-500/10" },
  { icon: Globe, label: "Forum", path: "/community-forum", color: "text-info", bg: "bg-info/10" },
  { icon: Camera, label: "Live Cams", path: "/live-cams", color: "text-accent", bg: "bg-accent/10" },
  { icon: Camera, label: "Gallery", path: "/gallery", color: "text-rose-400", bg: "bg-rose-500/10" },
  { icon: UserCircle2, label: "Members", path: "/members", color: "text-indigo-400", bg: "bg-indigo-500/10" },
  { icon: ShoppingBag, label: "Shopping", path: "/shopping", color: "text-orange-400", bg: "bg-orange-500/10" },
  { icon: SignalHigh, label: "Simplex", path: "/cineplex", color: "text-success", bg: "bg-success/10" },
  { icon: MessageSquare, label: "Live Chat", path: "/live-chat", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10" },
  { icon: Trophy, label: "Trophies", path: "/achievements", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { icon: Settings, label: "Settings", path: "/account", color: "text-muted-foreground", bg: "bg-muted/40" },
  { icon: Shield, label: "Admin", path: "/platform/admin", color: "text-rose-400", bg: "bg-rose-500/10", adminOnly: true },
];

export default function Dashboard() {
  const { mistUser, signOut, mybbUser } = useMistUser();
  const [showOnlineSheet, setShowOnlineSheet] = useState(false);

  useEffect(() => {
    if (mistUser.id) {
      base44.auth.updateMe({ last_active: new Date().toISOString() }).catch(() => {});
    }
  }, [mistUser.id]);

  const { data: nets } = useQuery({
    queryKey: ["nets"],
    queryFn: () => base44.entities.Net.list("-created_date", 3),
    initialData: [],
  });
  const nextNet = nets.length > 0 ? nets[0] : null;

  const { data: alerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const all = await base44.entities.Alert.list("-created_date", 10);
      return all.filter((a) => !a.title?.startsWith("__")).slice(0, 3);
    },
    initialData: [],
  });

  const { data: onlineMembers } = useQuery({
    queryKey: ["onlineMembers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("fetchMyBBForums", { action: "online_users" });
      return res.data?.users || [];
    },
    initialData: [],
    refetchInterval: 60000,
  });

  const { data: forumMembers } = useQuery({
    queryKey: ["forum-members"],
    queryFn: async () => {
      const res = await base44.functions.invoke("fetchMyBBForums", { action: "members" });
      return res.data?.members || [];
    },
    staleTime: 60000,
  });
  const totalMembers = forumMembers?.length ?? null;

  const { data: platformData } = useQuery({
    queryKey: ["platform-roles-dashboard"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getPlatformRoles", {});
      return res.data;
    },
  });
  const isAdmin = (platformData?.platform_roles || []).length > 0;

  // Shared stats (deduped with OperatorCard via the same query key)
  const { data: syncData } = useQuery({
    queryKey: ["operator-card-stats"],
    queryFn: async () => {
      const res = await base44.functions.invoke("syncUserStats", { uid: mybbUser?.uid || mistUser?.id });
      return res.data;
    },
    enabled: !!mybbUser?.uid || !!mistUser?.id,
    staleTime: 30000,
  });
  const stats = syncData?.stats || {};
  const memberSince = mistUser.memberSince
    ? new Date(mistUser.memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  const typeIcons = { info: Info, warning: AlertTriangle, emergency: Radio, system: Settings };
  const typeColors = {
    info: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    emergency: "bg-destructive/10 text-destructive",
    system: "bg-muted text-muted-foreground",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[28rem] h-80 bg-primary/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="px-4 pt-4 space-y-5 pb-6 max-w-2xl mx-auto">
        {/* Next Net */}
        <div className="mist-fade-up">
          <NextNetCard net={nextNet} />
        </div>

        {/* Hero Profile Card */}
        <div className="mist-fade-up" style={{ animationDelay: "60ms" }}>
          <OperatorCard onLogout={signOut} hideXpBar hidePrestige />
        </div>

        {/* XP & Level */}
        <div className="mist-fade-up" style={{ animationDelay: "120ms" }}>
          <XPLevelCard xp={stats.xp || 0} />
        </div>

        {/* Statistics */}
        <div className="mist-fade-up" style={{ animationDelay: "160ms" }}>
          <StatsGrid stats={stats} />
          <div className="mt-3">
            <MembershipFooter
              joined={memberSince ? `Joined ${memberSince}` : null}
              club={stats.club_membership}
              streak={stats.daily_login_streak}
            />
          </div>
        </div>

        {/* RadioScope */}
        <div className="mist-fade-up" style={{ animationDelay: "200ms" }}>
          <RadioScopeTile />
        </div>

        {/* Propagation Gauge */}
        <PropagationGauge />

        {/* Storm Tracker */}
        <StormTracker />

        {/* Alerts */}
        {alerts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" /> Important Updates
              </h3>
              <Link to="/alerts" className="text-xs text-primary font-medium hover:text-primary/80">View All</Link>
            </div>
            <div className="space-y-2">
              {alerts.map((alert) => {
                const Icon = typeIcons[alert.type] || Info;
                const colorClass = typeColors[alert.type] || typeColors.info;
                return (
                  <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-2xl bg-card/60 border border-white/[0.06] backdrop-blur-md ${!alert.is_read ? "border-l-2 border-l-primary" : ""}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground">{alert.title}</h4>
                      {alert.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.message}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">{alert.created_date && format(new Date(alert.created_date), "MMM d 'at' h:mm a")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Online Members */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-success" /> Online Now
            </h3>
            {totalMembers != null && (
              <span className="text-xs text-warning font-medium flex items-center gap-1"><Users className="w-3 h-3" />{totalMembers} total</span>
            )}
          </div>
          <button onClick={() => setShowOnlineSheet(true)} className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card/60 border border-white/[0.06] backdrop-blur-md hover:border-success/30 transition-all active:scale-[0.99] text-left">
            <div className="flex -space-x-2">
              {onlineMembers.slice(0, 5).map((member) => (
                <div key={member.uid} className="w-8 h-8 rounded-full border-2 border-background bg-card/50 overflow-hidden" title={member.username}>
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.username} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary">{(member.username || "?").charAt(0).toUpperCase()}</div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex-1">
              {onlineMembers.length === 0 ? (
                <span className="text-xs text-muted-foreground">No members online</span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {onlineMembers.length > 5 ? `+${onlineMembers.length - 5} more · ` : ""}
                  <span className="text-success font-medium">{onlineMembers.length} online</span>
                </span>
              )}
            </div>
            <span className="text-xs font-semibold text-success border border-success/30 bg-success/10 px-2.5 py-1 rounded-lg">View All</span>
          </button>
        </section>
        {showOnlineSheet && <OnlineMembersSheet members={onlineMembers} onClose={() => setShowOnlineSheet(false)} />}

        {/* Explore (full nav grid — preserves all routes) */}
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-3">Explore</h3>
          <div className="grid grid-cols-3 gap-3">
            {quickItems.filter(i => i.adminOnly ? isAdmin : true).map(({ icon: Icon, label, path, bg, color }) => (
              <Link key={label + path} to={path} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card/60 border border-white/[0.06] backdrop-blur-md hover:border-primary/30 hover:bg-primary/5 transition-all active:scale-95">
                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Upcoming Nets */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Upcoming Nets</h3>
            <Link to="/nets" className="text-xs text-primary font-medium hover:text-primary/80">View All</Link>
          </div>
          <div className="space-y-2">
            {nets.slice(0, 3).map((net) => (
              <div key={net.id} className="flex items-center justify-between p-3 rounded-2xl bg-card/60 border border-white/[0.06] backdrop-blur-md hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Radio className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{net.name}</p>
                    <p className="text-xs text-muted-foreground">{net.time} · {net.frequency} MHz</p>
                  </div>
                </div>
                <Link to="/nets" className="h-7 text-xs bg-primary/30 hover:bg-primary/50 text-primary border-0 px-3 rounded-md flex items-center gap-1 font-medium">
                  Join <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
            {nets.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No upcoming nets scheduled</p>}
          </div>
        </section>
      </div>
    </div>
  );
}