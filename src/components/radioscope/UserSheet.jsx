import React, { useMemo } from "react";
import { X, MessageSquare, Phone, UserCircle, Radio, Clock, MapPin } from "lucide-react";
import { haversine, bearing, compassDirection, formatDistance } from "@/lib/geoUtils";

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
  const dist = userPosition && user.latitude
    ? haversine(userPosition[0], userPosition[1], user.latitude, user.longitude)
    : null;
  const dir = userPosition && user.latitude
    ? bearing(userPosition[0], userPosition[1], user.latitude, user.longitude)
    : null;

  const nearestRepeater = useMemo(() => {
    if (!user.latitude || !repeaters.length) return null;
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

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/60 z-[60] fade-in" style={{ touchAction: "none" }} />
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-card rounded-t-3xl border-t border-cyan-500/20 pb-[env(safe-area-inset-bottom)] sheet-up max-h-[80vh] overflow-y-auto">
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="flex items-start justify-between px-4 pt-2 pb-3">
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
            <div>
              <h2 className="text-lg font-bold text-foreground">{user.user_name}</h2>
              <p className={`text-xs font-semibold ${STATUS_COLORS[status] || "text-muted-foreground"}`}>
                ● {STATUS_LABELS[status] || status}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 -m-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 px-4 mb-4">
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Distance</p>
            <p className="text-sm font-bold text-cyan-400 mt-1">
              {dist != null ? formatDistance(dist) : "—"}
            </p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Direction</p>
            <p className="text-sm font-bold text-cyan-400 mt-1">
              {dir != null ? compassDirection(dir) : "—"}
            </p>
          </div>
        </div>

        <div className="px-4 space-y-1 pb-4">
          {nearestRepeater && (
            <div className="flex items-center justify-between py-2.5 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Current Repeater</span>
              </div>
              <span className="text-sm font-medium text-foreground">{nearestRepeater.repeater.callsign}</span>
            </div>
          )}
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

        <div className="grid grid-cols-3 gap-2 px-4 pb-4">
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
      </div>
    </>
  );
}