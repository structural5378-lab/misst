import React from "react";
import { Link } from "react-router-dom";
import { CloudRain, Wind, Droplets, MapPin } from "lucide-react";

// McvWeather — weather + alerts panel (right column middle). Current conditions
// from getWeatherData, humidity/wind, NWS alerts placeholder, and a Lightning
// Detection thumbnail linking to RadioScope.
export default function McvWeather({ v2 }) {
  const { weather, net, activeSession } = v2;
  const loc = activeSession?.community_name || net?.community_name || weather?.current?.name || "—";
  return (
    <div className="rounded-xl bg-[#15191e] border border-white/[0.06] p-3 space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><CloudRain className="w-3.5 h-3.5 text-cyan-400" /> Weather / Alerts</h3>
      <div className="flex items-center gap-3">
        <div className="text-3xl font-extrabold">{weather?.current ? `${Math.round(weather.current.temp)}°` : "—"}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold capitalize">{weather?.current?.condition || "No data"}</p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {loc}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-muted-foreground"><Droplets className="w-3 h-3 text-cyan-400" /> {weather?.current?.humidity ?? "—"}%</div>
        <div className="flex items-center gap-1.5 text-muted-foreground"><Wind className="w-3 h-3 text-cyan-400" /> {weather?.current?.wind_speed ?? "—"} mph</div>
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground mb-1">NWS Alerts</p>
        <div className="text-[11px] text-muted-foreground p-2 rounded-lg bg-white/[0.02]">No active alerts.</div>
      </div>
      <Link to="/radioscope" className="block">
        <p className="text-[10px] text-muted-foreground mb-1">Lightning Detection</p>
        <div className="relative h-20 rounded-lg overflow-hidden bg-gradient-to-br from-cyan-950 to-background border border-white/[0.06] flex items-center justify-center">
          <div className="rs-tile-radar absolute inset-0 opacity-40" />
          <span className="relative text-[10px] text-cyan-300 font-semibold">Open RadioScope →</span>
        </div>
      </Link>
    </div>
  );
}