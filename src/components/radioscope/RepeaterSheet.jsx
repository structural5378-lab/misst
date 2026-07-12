import React, { useMemo } from "react";
import { X, Navigation, Star, Radio, Users, Link2, Activity, MapPin } from "lucide-react";
import { haversine, bearing, compassDirection, formatDistance } from "@/lib/geoUtils";

export default function RepeaterSheet({ repeater, userPosition, onlineUsers, repeaters, onClose }) {
  const dist = userPosition
    ? haversine(userPosition[0], userPosition[1], repeater.latitude, repeater.longitude)
    : null;
  const dir = userPosition
    ? bearing(userPosition[0], userPosition[1], repeater.latitude, repeater.longitude)
    : null;

  const linked = useMemo(
    () => repeaters.filter(
      (r) => r.id !== repeater.id && r.latitude && r.longitude &&
        haversine(repeater.latitude, repeater.longitude, r.latitude, r.longitude) < 50
    ),
    [repeaters, repeater]
  );

  const connectedUsers = useMemo(
    () => onlineUsers.filter((u) => {
      if (!u.latitude || !u.longitude) return false;
      const d = haversine(u.latitude, u.longitude, repeater.latitude, repeater.longitude);
      return d < 25;
    }),
    [onlineUsers, repeater]
  );

  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${repeater.latitude},${repeater.longitude}`;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/60 z-[60] fade-in" style={{ touchAction: "none" }} />
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-card rounded-t-3xl border-t border-cyan-500/20 pb-[env(safe-area-inset-bottom)] sheet-up max-h-[80vh] overflow-y-auto">
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex items-start justify-between px-4 pt-2 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
              <Radio className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{repeater.callsign}</h2>
              <p className="text-xs text-muted-foreground">{repeater.location || "Location unknown"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 -m-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 px-4 mb-4">
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Frequency</p>
            <p className="text-sm font-bold text-foreground mt-1">{repeater.frequency?.toFixed(4) || "—"} MHz</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tone</p>
            <p className="text-sm font-bold text-foreground mt-1">{repeater.tone || "None"}</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Distance</p>
            <p className="text-sm font-bold text-cyan-400 mt-1">
              {dist != null ? `${formatDistance(dist)} ${dir != null ? compassDirection(dir) : ""}` : "—"}
            </p>
          </div>
        </div>

        <div className="px-4 space-y-3 pb-4">
          <InfoRow icon={Activity} label="Coverage Estimate" value="~25 km radius" />
          <InfoRow icon={Users} label="Users Connected" value={`${connectedUsers.length} nearby`} />
          <InfoRow icon={Link2} label="Linked Repeaters" value={linked.length > 0 ? linked.map((r) => r.callsign).join(", ") : "None"} />
          {repeater.owner_callsign && <InfoRow icon={Radio} label="Owner" value={repeater.owner_callsign} />}
          <InfoRow icon={MapPin} label="Coordinates" value={`${repeater.latitude?.toFixed(4)}, ${repeater.longitude?.toFixed(4)}`} />
        </div>

        <div className="flex gap-3 px-4 pb-4">
          <a
            href={navUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-600 text-white font-semibold text-sm active:scale-95 transition-transform"
          >
            <Navigation className="w-4 h-4" /> Navigate
          </a>
          <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm border border-border active:scale-95 transition-transform">
            <Star className="w-4 h-4" /> Favorite
          </button>
        </div>
      </div>
    </>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50">
      <div className="flex items-center gap-2">
        {React.createElement(icon, { className: "w-4 h-4 text-muted-foreground" })}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}