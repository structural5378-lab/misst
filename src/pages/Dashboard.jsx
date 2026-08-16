import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { mist } from '@/api/mist';
import { useMistUser } from "@/hooks/useMistUser";
import { useQuery } from "@tanstack/react-query";
import { Bell, Radio, Users, Info, AlertTriangle, Settings, MessageSquare, ChevronRight, MapPin, Sun, Wrench, Globe, Camera, UserCircle2, ShoppingBag, SignalHigh, Shield } from "lucide-react";
import { format } from "date-fns";
import StormTracker from "@/components/weather/StormTracker";
import LightningActivityStrip from "@/components/weather/LightningActivityStrip";
import PropagationGauge from "@/components/dashboard/PropagationGauge";
import { useNetControlAccess } from "@/hooks/useNetControlAccess";
import OnlineMembersSheet from "@/components/members/OnlineMembersSheet";
import RadioScopeTile from "@/components/radioscope/RadioScopeTile";
import OperatorCard from "@/components/profile/OperatorCard";
import DashboardQuickActions from "@/components/dashboard/DashboardQuickActions";
import DashboardCommandCenter from "@/components/dashboard/DashboardCommandCenter";
import NextNetCard from "@/components/dashboard/NextNetCard";
import RadioFilesDashboardCard from "@/components/radiofiles/RadioFilesDashboardCard";
import DashboardMetadata from "@/components/dashboard/DashboardMetadata";
import { MISST_ASSETS } from "@/lib/misstAssets";

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
  { icon: MessageSquare, label: "Chat", path: "/messages", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10" },
  { icon: Radio, label: "Radio Files", path: "/radio-files", color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: Settings, label: "Settings", path: "/account", color: "text-muted-foreground", bg: "bg-muted/40" },
  { icon: Shield, label: "Admin", path: "/platform/admin", color: "text-rose-400", bg: "bg-rose-500/10", adminOnly: true },
];

export default function Dashboard() {
  const { mistUser, signOut, mybbUser } = useMistUser();
  const { canControl } = useNetControlAccess();
  const [showOnlineSheet, setShowOnlineSheet] = useState(false);

  useEffect(() => {
    if (mistUser.id) {
      mist.auth.updateMe({ last_active: new Date().toISOString() }).catch(() => {});
    }
  }, [mistUser.id]);

  const { data: nets = [] } = useQuery({
    queryKey: ["nets"],
    queryFn: () => mist.entities.Net.list("-created_date", 10),
    initialData: [],
  });

  const { data: alerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const all = await mist.entities.Alert.list("-created_date", 10);
      return all.filter((a) => !a.title?.startsWith("__")).slice(0, 3);
    },
    initialData: [],
  });

  const { data: onlineMembers } = useQuery({
    queryKey: ["onlineMembers"],
    queryFn: async () => {
      const res = await mist.functions.invoke("fetchMyBBForums", { action: "online_users" });
      return res.data?.users || [];
    },
    initialData: [],
    refetchInterval: 60000,
  });

  const { data: forumMembers } = useQuery({
    queryKey: ["forum-members"],
    queryFn: async () => {
      const res = await mist.functions.invoke("fetchMyBBForums", { action: "members" });
      return res.data?.members || [];
    },
    staleTime: 60000,
  });
  const totalMembers = forumMembers?.length ?? null;

  const { data: platformData } = useQuery({
    queryKey: ["platform-roles-dashboard"],
    queryFn: async () => {
      const res = await mist.functions.invoke("getPlatformRoles", {});
      return res.data;
    },
  });
  const isAdmin = (platformData?.platform_roles || []).length > 0;

  const { data: syncData } = useQuery({
    queryKey: ["operator-card-stats"],
    queryFn: async () => {
      const res = await mist.functions.invoke("syncUserStats", { uid: mybbUser?.uid || mistUser?.id });
      return res.data;
    },
    enabled: !!mybbUser?.uid || !!mistUser?.id,
    staleTime: 30000,
  });
  const stats = syncData?.stats || {};

  const typeIcons = { info: Info, warning: AlertTriangle, emergency: Radio, system: Settings };
  const typeColors = {
    info: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    emergency: "bg-destructive/10 text-destructive",
    system: "bg-muted text-muted-foreground",
  };

  return (
    <div className="relative min-h-screen bg-[#050208]">
      {/* Shared atmospheric environment — one layer, not repeated per card */}
      <img src={MISST_ASSETS.MISST_DASHBOARD_BACKGROUND.url} alt="" aria-hidden className="fixed inset-0 w-full h-full object-cover opacity-[0.22] pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(139,92,246,0.10), transparent 60%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(6,182,212,0.06), transparent 60%), linear-gradient(to bottom, rgba(5,2,8,0.35), rgba(5,2,8,0.55))' }} />

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-3 pb-6 max-w-6xl mx-auto">
        {/* OPERATOR HERO — identity composition on the shared environment */}
        <div className="mt-4 sm:mt-6">
          <OperatorCard onLogout={signOut} />
        </div>

        {/* OPERATOR DATA — subtle metadata, under avatar block */}
        <div className="mt-4 sm:mt-5">
          <DashboardMetadata />
        </div>

        {/* NEXT NET — compact operational strip */}
        <div className="mt-5 sm:mt-6">
          <NextNetCard net={nets[0]} />
        </div>

        {/* FOUR FEATURE MODULES */}
        <div className="mt-6 sm:mt-8">
          <DashboardQuickActions />
        </div>

        {/* COMMAND CENTER — cinematic */}
        <div className="mt-6 sm:mt-8">
          <DashboardCommandCenter />
        </div>

        {/* RADIO FILES — library + compatible files */}
        <div className="mt-6 sm:mt-8">
          <RadioFilesDashboardCard />
        </div>

        {/* ── Secondary content (functional, preserved) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          <RadioScopeTile />
          <PropagationGauge />
        </div>

        <LightningActivityStrip />
        <StormTracker />

        {/* Alerts + Online (side by side on desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {alerts.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" /> Updates
                </h3>
                <Link to="/alerts" className="text-xs text-primary font-medium hover:text-primary/80">View all</Link>
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

          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-success" /> Online now
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
              <span className="text-xs font-semibold text-success border border-success/30 bg-success/10 px-2.5 py-1 rounded-lg">View all</span>
            </button>
          </section>
        </div>
        {showOnlineSheet && <OnlineMembersSheet members={onlineMembers} onClose={() => setShowOnlineSheet(false)} />}

        {/* Explore — full nav grid, responsive columns */}
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-3">Explore</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {quickItems.filter(i => (i.adminOnly ? isAdmin : true) && (i.netControlOnly ? canControl : true)).map(({ icon: Icon, label, path, bg, color }) => (
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
            <h3 className="text-sm font-semibold text-foreground">Upcoming nets</h3>
            <Link to="/nets" className="text-xs text-primary font-medium hover:text-primary/80">View all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {nets.slice(0, 3).map((net) => (
              <div key={net.id} className="flex items-center justify-between p-3 rounded-2xl bg-card/60 border border-white/[0.06] backdrop-blur-md hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <Radio className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{net.name}</p>
                    <p className="text-xs text-muted-foreground">{net.time} · {net.frequency} MHz</p>
                  </div>
                </div>
                <Link to="/nets" className="h-7 text-xs bg-primary/30 hover:bg-primary/50 text-primary border-0 px-3 rounded-md flex items-center gap-1 font-medium shrink-0">
                  Join <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
            {nets.length === 0 && <p className="text-sm text-muted-foreground text-center py-6 col-span-full">No upcoming nets scheduled</p>}
          </div>
        </section>
      </div>
    </div>
  );
}