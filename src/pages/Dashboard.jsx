import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Bell, Radio, MapPin, Users, MessageSquare, Wrench, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const LOGO_URL = "https://media.base44.com/images/public/6a24d788be1af31b2258fab2/5e4366214_insomniacsgmrslogo.png";

const quickItems = [
  { icon: Radio, label: "Repeaters", path: "/repeaters", bg: "bg-violet-500/15", color: "text-violet-400" },
  { icon: MapPin, label: "Map", path: "/map", bg: "bg-teal-500/15", color: "text-teal-400" },
  { icon: Users, label: "Nets", path: "/nets", bg: "bg-purple-500/15", color: "text-purple-400" },
  { icon: MessageSquare, label: "Forum", path: "/forums", bg: "bg-blue-500/15", color: "text-blue-400" },
  { icon: Zap, label: "Alerts", path: "/alerts", bg: "bg-amber-500/15", color: "text-amber-400" },
  { icon: Wrench, label: "Tools", path: "/tools", bg: "bg-orange-500/15", color: "text-orange-400" },
  { icon: Globe, label: "Community", path: "/community-forum", bg: "bg-indigo-500/15", color: "text-indigo-400" },
];

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: nets } = useQuery({
    queryKey: ["nets"],
    queryFn: () => base44.entities.Net.list("-created_date", 3),
    initialData: [],
  });

  const callsign = user?.callsign || "MIST Member";
  const location = user?.location || "GMRS Community";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        {/* Purple glow background */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/60 via-background/80 to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />

        <div className="relative px-4 pt-5 pb-4 flex items-center justify-between">
          <img src={LOGO_URL} alt="Insomniacs GMRS" className="h-12 w-auto object-contain drop-shadow-lg" />
          <Link
            to="/alerts"
            className="p-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell className="w-5 h-5" />
          </Link>
        </div>

        {/* User identity banner */}
        <div className="relative px-4 pb-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl border-2 border-violet-500/40 bg-violet-950/50 overflow-hidden flex items-center justify-center shadow-lg shadow-violet-900/30">
            <img src={LOGO_URL} alt="avatar" className="w-full h-full object-contain scale-110" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">{callsign}</span>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ● Online
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{location} · GMRS Operator</p>
            <Link to="/profile" className="text-xs text-violet-400 font-medium hover:text-violet-300 mt-1 inline-block">
              Edit Profile →
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6 pb-4">
        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Reputation", value: user?.reputation || 0 },
            { label: "Badges", value: user?.badges || 0 },
            { label: "Posts", value: user?.forum_count || 0 },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center py-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
              <span className="text-xl font-bold text-foreground">{value}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{label}</span>
            </div>
          ))}
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
                <Button size="sm" className="h-7 text-xs bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border-0">
                  Join
                </Button>
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