import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { useQuery } from "@tanstack/react-query";
import { Bell, Radio, MapPin, Users, Wrench, Globe, Info, AlertTriangle, Settings, LogOut, Sun, Camera, ChevronRight, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import StormTracker from "@/components/weather/StormTracker";
import PropagationGauge from "@/components/dashboard/PropagationGauge";

const LOGO_URL = "https://media.base44.com/images/public/6a24d788be1af31b2258fab2/5e4366214_insomniacsgmrslogo.png";

const quickItems = [
  { icon: Radio, label: "Repeaters", path: "/repeaters", bg: "bg-violet-500/15", color: "text-violet-400" },
  { icon: MapPin, label: "Map", path: "/map", bg: "bg-teal-500/15", color: "text-teal-400" },
  { icon: Users, label: "Nets", path: "/nets", bg: "bg-purple-500/15", color: "text-purple-400" },
  { icon: Sun, label: "Weather", path: "/weather", bg: "bg-yellow-500/15", color: "text-yellow-400" },
  { icon: Wrench, label: "Tools", path: "/tools", bg: "bg-orange-500/15", color: "text-orange-400" },
  { icon: Globe, label: "Forum", path: "/community-forum", bg: "bg-indigo-500/15", color: "text-indigo-400" },
  { icon: Sun, label: "Live Cams", path: "/live-cams", bg: "bg-cyan-500/15", color: "text-cyan-400" },
  { icon: Camera, label: "Gallery", path: "/gallery", bg: "bg-pink-500/15", color: "text-pink-400" },
  { icon: UserCircle2, label: "Members", path: "/members", bg: "bg-cyan-500/15", color: "text-cyan-400" },
];

export default function Dashboard() {
  const { mybbUser, logout: mybbLogout } = useMyBBAuth();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      // Update last active timestamp
      if (u?.id) {
        await base44.auth.updateMe({ last_active: new Date().toISOString() });
      }
    }).catch(() => {});
  }, []);

  const { data: nets } = useQuery({
    queryKey: ["nets"],
    queryFn: () => base44.entities.Net.list("-created_date", 3),
    initialData: [],
  });

  const { data: alerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => base44.entities.Alert.list("-created_date", 3),
    initialData: [],
  });

  const { data: onlineMembers } = useQuery({
    queryKey: ["onlineMembers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("fetchMyBBForums", { action: "online_users" });
      return res.data?.users || [];
    },
    initialData: [],
    refetchInterval: 15000,
  });

  const typeIcons = {
    info: Info,
    warning: AlertTriangle,
    emergency: Radio,
    system: Settings,
  };

  const typeColors = {
    info: "bg-primary/10 text-primary",
    warning: "bg-amber-500/10 text-amber-400",
    emergency: "bg-red-500/10 text-red-400",
    system: "bg-muted text-muted-foreground",
  };

  const callsign = user?.callsign || mybbUser?.username || "MIST Member";
  const avatarUrl = mybbUser?.avatar || LOGO_URL;
  const location = user?.location || "GMRS Community";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        {/* Purple glow background */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/60 via-background/80 to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />

        <div className="relative px-4 pt-4 pb-1 flex items-center justify-end gap-2">
          <Link
            to="/alerts"
            className="p-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell className="w-5 h-5" />
          </Link>
          <button
            onClick={() => { mybbLogout(); window.location.href = "/login"; }}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* User identity banner */}
        <div className="relative px-4 pb-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl border-2 border-violet-500/40 bg-violet-950/50 overflow-hidden flex items-center justify-center shadow-lg shadow-violet-900/30">
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" onError={(e) => { e.target.src = LOGO_URL; e.target.className = "w-full h-full object-contain scale-110"; }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">{callsign}</span>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ● Online
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {location}{mybbUser?.role ? ` · ${mybbUser.role.charAt(0).toUpperCase() + mybbUser.role.slice(1)}` : " · GMRS Operator"}
            </p>
            <Link to="/profile" className="text-xs text-violet-400 font-medium hover:text-violet-300 mt-1 inline-block">
              Edit Profile →
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-6 pb-4">
        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4 text-violet-400" />
                Important Updates
              </h3>
              <Link to="/alerts" className="text-xs text-violet-400 font-medium hover:text-violet-300">View All</Link>
            </div>
            <div className="space-y-2">
              {alerts.map((alert) => {
                const Icon = typeIcons[alert.type] || Info;
                const colorClass = typeColors[alert.type] || typeColors.info;
                return (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] ${!alert.is_read ? "border-l-2 border-l-violet-500" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground">{alert.title}</h4>
                      {alert.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.message}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {alert.created_date && format(new Date(alert.created_date), "MMM d 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Propagation Gauge */}
        <PropagationGauge />

        {/* Storm Tracker */}
        <StormTracker />

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Reputation", value: mybbUser?.reputation ?? 0 },
            { label: "Threads", value: mybbUser?.threadcount ?? 0 },
            { label: "Posts", value: mybbUser?.postcount ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center py-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
              <span className="text-xl font-bold text-foreground">{value}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{label}</span>
            </div>
          ))}
        </div>

        {/* Online Members */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Online Now
            </h3>
            <span className="text-xs text-emerald-400 font-medium">{onlineMembers.length} members</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
            <div className="flex -space-x-2">
              {onlineMembers.slice(0, 5).map((member) => (
                <div
                  key={member.uid}
                  className="w-8 h-8 rounded-full border-2 border-background bg-violet-950/50 overflow-hidden"
                  title={member.username}
                >
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.username} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-violet-400">
                      {(member.username || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {onlineMembers.length > 5 && (
              <span className="text-xs text-muted-foreground">+{onlineMembers.length - 5} more</span>
            )}
            {onlineMembers.length === 0 && (
              <span className="text-xs text-muted-foreground">No members online</span>
            )}
          </div>
        </div>

        {/* Quick Access */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Quick Access</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {quickItems.map(({ icon: Icon, label, path, bg, color }) => (
              <Link
                key={label}
                to={path}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-violet-500/30 hover:bg-violet-500/5 transition-all active:scale-95"
              >
                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming Nets */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Upcoming Nets</h3>
            <Link to="/nets" className="text-xs text-violet-400 font-medium hover:text-violet-300">View All</Link>
          </div>
          <div className="space-y-2">
            {nets.slice(0, 3).map((net) => (
              <div key={net.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-violet-500/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center">
                    <Radio className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{net.name}</p>
                    <p className="text-xs text-muted-foreground">{net.time} · {net.frequency} MHz</p>
                  </div>
                </div>
                <Link to="/nets" className="h-7 text-xs bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border-0 px-3 rounded-md flex items-center gap-1 font-medium">
                  Join <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
            {nets.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No upcoming nets scheduled</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}