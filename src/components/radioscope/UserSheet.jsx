import React, { useMemo } from "react";
import { MessageSquare, Phone, UserCircle, Radio, Clock, MapPin, Ruler, Navigation } from "lucide-react";
import { haversine, bearing, compassDirection, formatDistanceMixed } from "@/lib/geoUtils";
import DraggableSheet from "./DraggableSheet";

const STATUS_LABELS = {
  online: "Online", typing: "Typing", away: "Away", idle: "Idle",
  monitoring: "Monitoring", emergency: "Emergency", offline: "Offline",
};
const STATUS_COLORS = {
  online: "text-emerald-400", typing: "text-emerald-400", away: "text-yellow-400",
  idle: "text-yellow-400", monitoring: "text-blue-400", emergency: "text-red-400",
  offline: "text-gray-500",
};

export default function UserSheet({ user, userPosition, repeaters, onClose }) {
  const distFromYou = userPosition && user.latitude
    ? haversine(userPosition[0], userPosition[1], user.latitude, user.longitude)
    : null;
  const dir = userPosition && user.latitude
    ? bearing(userPosition[0], userPosition[1], user.latitude, user.longitude)
    : null;

  // Find the user's connected repeater (by current_repeater_id), fall back to nearest
  const currentRepeater = useMemo(() => {
    if (!user.latitude) return null;
    if (user.current_repeater_id) {
      const found = repeaters.find((r) => r.id === user.current_repeater_id);
      if (found && found.latitude && found.longitude) {
        return { repeater: found, dist: haversine(user.latitude, user.longitude, found.latitude, found.longitude) };
      }
    }
    if (!repeaters.length) return null;
    let best = null;
    for (const r of repeaters) {
      if (!r.latitude || !r.longitude) continue;
      const d = haversine(user.latitude, user.longitude, r.latitude, r.longitude);
      if (!best || d < best.dist) best = { repeater: r, dist: d };
    }
    return best;
  }, [user, repeaters]);

  const status = user.status || "online";
  const lastActive = user.last_active ? new Date(user.last_active) : null;

  const sheetHeader = (
    <div className="flex items-center gap-3">
      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-cyan-500/40 bg-violet-950/50 shrink-0">
        {user.user_avatar ? (
          <img src={user.user_avatar} alt={user.user_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl font-bold text-violet-400">
            {(user.user_name || "?").charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-foreground truncate">{user.user_name}</h2>
        <p className={`text-xs font-semibold ${STATUS_COLORS[status] || "text-muted-foreground"}`}>
          ● {STATUS_LABELS[status] || status}
        </p>
      </div>
    </div>
  );

  const sheetFooter = (
    <div className="grid grid-cols-3 gap-2">
      <button className="flex flex-col items-center gap-1 py-3 rounded-xl bg-cyan-600 text-white text-xs font-semibold active:scale-95 transition-transform">
        <MessageSquare className="w-5 h-5" /> Message
      </button>
      <button className="flex flex-col items-center gap-1 py-3 rounded-xl bg-secondary text-foreground text-xs font-semibold border border-border active:scale-95 transition-transform">
        <Phone className="w-5 h-5" /> Call
      </button>
      <button className="flex flex-col items-center gap-1 py-3 rounded-xl bg-secondary text-foreground text-xs font-semibold border border-border active:scale-95 transition-transform">
        <UserCircle className="w-5 h-5" /> Profile
      </button>
    </div>
  );

  return (
    <DraggableSheet onClose={onClose} header={sheetHeader} footer={sheetFooter} initialSnap={0.75}>
      <div className="space-y-4">
        {/* Distance cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-secondary/50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Ruler className="w-3.5 h-3.5 text-cyan-500/70" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Distance From You</p>
            </div>
            <p className="text-base font-bold text-cyan-400">
              {distFromYou != null ? formatDistanceMixed(distFromYou) : "—"}
            </p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Navigation className="w-3.5 h-3.5 text-cyan-500/70" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Direction</p>
            </div>
            <p className="text-base font-bold text-cyan-400">
              {dir != null ? compassDirection(dir) : "—"}
            </p>
          </div>
        </div>

        {/* Current repeater + distance to repeater */}
        {currentRepeater && (
          <div className="bg-violet-500/10 rounded-xl p-3 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-4 h-4 text-violet-400" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Current Repeater</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">{currentRepeater.repeater.callsign}</span>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Distance To Repeater</p>
                <p className="text-sm font-bold text-violet-400">{formatDistanceMixed(currentRepeater.dist)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info rows */}
        <div className="space-y-1">
          {lastActive && (
            <div className="flex items-center justify-between py-2.5 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Last Heard</span>
              </div>
              <span className="text-sm font-medium text-foreground">
                {lastActive.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between py-2.5 border-b border-border/50">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Position</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {user.latitude ? `${user.latitude.toFixed(3)}, ${user.longitude.toFixed(3)}` : "Unknown"}
            </span>
          </div>
        </div>
      </div>
    </DraggableSheet>
  );
}