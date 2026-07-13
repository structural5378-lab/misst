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
    <Link
      to="/radioscope"
      className="relative w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-violet-950/50 border border-cyan-500/20 hover:border-cyan-500/40 transition-all active:scale-[0.98] overflow-hidden group"
    >
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-1/2 left-4 w-20 h-20 -mt-10 rounded-full border-2 border-cyan-500/20" />
        <div className="absolute top-1/2 left-4 w-14 h-14 -mt-7 rounded-full border border-cyan-500/30" />
        <div className="rs-tile-radar absolute top-1/2 left-4 w-20 h-20 -mt-10 rounded-full" />
      </div>

      <div className="relative w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 z-10">
        <Radar className="w-7 h-7 text-cyan-400" />
      </div>

      <div className="relative z-10 flex-1">
        <h3 className="text-sm font-bold text-foreground">RadioScope</h3>
        <p className="text-[10px] text-cyan-500/70 uppercase tracking-widest">Tactical RF Map</p>
      </div>

      <div className="relative z-10 flex gap-4">
        <Stat icon={Radio} label="Repeaters" value={nearbyRepeaters.length} color="text-violet-400" />
        <Stat icon={Users} label="Online" value={onlineCount} color="text-emerald-400" />
        <Stat icon={MapPin} label="Closest" value={closestDist != null ? formatDistance(closestDist) : "—"} color="text-cyan-400" />
      </div>
    </Link>
  );
}

function Stat({ icon, label, value, color }) {
  return (
    <div className="flex flex-col items-center min-w-[44px]">
      {React.createElement(icon, { className: `w-4 h-4 ${color} mb-0.5` })}
      <span className="text-sm font-bold text-foreground">{value}</span>
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}