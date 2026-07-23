import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Radar, Radio, Users, MapPin } from "lucide-react";
import { haversine, formatDistance } from "@/lib/geoUtils";

export default function RadioScopeTile() {
  const [userPos, setUserPos] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { maximumAge: 60000, timeout: 8000 }
    );
  }, []);

  const { data: repeaters = [] } = useQuery({
    queryKey: ["repeaters"],
    queryFn: () => base44.entities.Repeater.list("-created_date", 200),
  });

  const { data: presence = [] } = useQuery({
    queryKey: ["chat-presence"],
    queryFn: () => base44.entities.ChatPresence.list("-last_active", 100),
    refetchInterval: 30000,
  });

  const nearbyRepeaters = repeaters.filter((r) => r.latitude && r.longitude);
  const onlineCount = presence.filter(
    (p) => p.status !== "offline" && Date.now() - new Date(p.last_active).getTime() < 120000
  ).length;

  const closestDist = userPos && nearbyRepeaters.length > 0
    ? Math.min(...nearbyRepeaters.map((r) => haversine(userPos[0], userPos[1], r.latitude, r.longitude)))
    : null;

  return (
    <Link to="/radioscope" className="block group">
      <div className="relative w-full rounded-2xl bg-gradient-to-br from-slate-950 to-violet-950/60 border border-cyan-500/25 p-4 overflow-hidden active:scale-[0.99] transition-transform">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0 overflow-hidden">
            <div className="absolute inset-0 rs-tile-radar opacity-60" />
            <Radar className="w-8 h-8 text-cyan-300 relative z-10" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground">RadioScope</h3>
            <p className="text-[10px] text-cyan-400/80 uppercase tracking-widest">Tactical RF Map</p>
          </div>
          <span className="text-[11px] font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 rounded-full group-hover:bg-cyan-500/20 transition-colors shrink-0">
            View All →
          </span>
        </div>

        <div className="relative mt-4 grid grid-cols-3 gap-2">
          <Stat icon={Radio} label="Repeaters" value={nearbyRepeaters.length} color="text-violet-400" />
          <Stat icon={Users} label="Online" value={onlineCount} color="text-emerald-400" />
          <Stat icon={MapPin} label="Coverage" value={closestDist != null ? formatDistance(closestDist) : "—"} color="text-cyan-400" />
        </div>
      </div>
    </Link>
  );
}

function Stat({ icon, label, value, color }) {
  const Icon = icon;
  return (
    <div className="flex flex-col items-center min-w-[44px] rounded-xl bg-white/[0.03] border border-white/[0.06] py-2">
      <Icon className={`w-4 h-4 ${color} mb-1`} />
      <span className="text-sm font-bold text-foreground tabular-nums">{value}</span>
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}