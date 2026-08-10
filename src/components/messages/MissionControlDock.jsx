import { useEffect, useState } from "react";
import { Radio, Satellite, CloudLightning, Wifi, Siren, ChevronUp, ChevronDown, Activity, Crosshair, Battery, BatteryCharging, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { mist } from '@/api/mist';
// MissionControlDock — MISST's signature slim realtime status dock. Sits at
// the bottom of the messaging hub and surfaces connected repeater, GPS,
// weather, nearest lightning, active net, battery, and an emergency button.
// Collapses to a slim bar; expands into a full status panel.
function haversineMi(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function Chip({ icon: Icon, label, value, color, onClick, active }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors shrink-0 ${active ? "bg-primary/20 text-primary" : "bg-secondary/60 text-muted-foreground hover:text-foreground"}`}>
      <Icon className={`w-3.5 h-3.5 ${color || ""}`} />
      <span className="opacity-70">{label}</span>
      <span className="text-foreground font-bold">{value}</span>
    </button>
  );
}

export default function MissionControlDock({ community }) {
  const [open, setOpen] = useState(false);
  const [weather, setWeather] = useState(null);
  const [lightningDist, setLightningDist] = useState(null);
  const [activeNet, setActiveNet] = useState(null);
  const [gps, setGps] = useState(null);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [battery, setBattery] = useState(null);

  useEffect(() => {
    if (!community?.id) return;
    let alive = true;
    mist.functions
      .invoke("getWeatherData", { community_id: community.id, lat: community.location_lat, lon: community.location_lon })
      .then((r) => { if (alive) setWeather(r); })
      .catch(() => {});
    return () => { alive = false; };
  }, [community?.id]);

  useEffect(() => {
    if (!community?.location_lat) return;
    let alive = true;
    mist.entities.LightningStrike.list("-strike_time", 12)
      .then((rows) => {
        if (!alive || !rows || !rows.length) return;
        let min = Infinity;
        for (const s of rows) {
          if (s.latitude == null || s.longitude == null) continue;
          const d = haversineMi(community.location_lat, community.location_lon, s.latitude, s.longitude);
          if (d < min) min = d;
        }
        setLightningDist(min === Infinity ? null : Math.round(min));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [community?.id, community?.location_lat, community?.location_lon]);

  useEffect(() => {
    if (!community?.id) return;
    let alive = true;
    mist.entities.Net.filter({ community_id: community.id, status: "active" })
      .then((rows) => { if (alive) setActiveNet(rows && rows[0] ? rows[0] : null); })
      .catch(() => {});
    return () => { alive = false; };
  }, [community?.id]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.getBattery) return;
    let bat;
    navigator.getBattery().then((b) => {
      bat = b;
      const upd = () => setBattery({ level: Math.round((b.level || 0) * 100), charging: !!b.charging });
      upd();
      b.addEventListener("levelchange", upd);
      b.addEventListener("chargingchange", upd);
    });
    return () => {
      if (bat && bat.removeEventListener) {
        bat.removeEventListener("levelchange");
        bat.removeEventListener("chargingchange");
      }
    };
  }, []);

  const toggleGps = () => {
    if (gps) { setGps(null); return; }
    if (gpsBusy) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => setGps({ lat: p.coords.latitude, lon: p.coords.longitude, acc: Math.round(p.coords.accuracy || 0) }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
    setGpsBusy(false);
  };

  const temp = weather?.temp ?? weather?.temperature;
  const cond = weather?.condition || weather?.conditions || weather?.summary;

  return (
    <div className="shrink-0 relative z-20 border-t border-border bg-card/70 backdrop-blur-xl">
      {open && (
        <div className="absolute bottom-full left-0 right-0 sheet-up bg-card/95 border-t border-border backdrop-blur-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3">
            <Panel label="Connected Repeater" icon={Radio} value={community?.primary_repeater || "—"} sub={community?.frequency ? `${community.frequency} MHz` : ""} />
            <Panel label="GPS Position" icon={Crosshair} value={gps ? `${gps.lat.toFixed(3)}, ${gps.lon.toFixed(3)}` : "Not sharing"} sub={gps ? `±${gps.acc} m` : gpsBusy ? "Acquiring…" : "Tap to enable"} onClick={toggleGps} action={!!gps} />
            <Panel label="Weather" icon={Activity} value={temp != null ? `${Math.round(temp)}°` : "—"} sub={cond || "—"} />
            <Panel label="Lightning" icon={CloudLightning} value={lightningDist != null ? `${lightningDist} mi` : "Clear"} sub={lightningDist != null && lightningDist <= 10 ? "⚠ In range" : "Nearest strike"} danger={lightningDist != null && lightningDist <= 10} />
            <Panel label="Active Net" icon={Wifi} value={activeNet?.name || "None"} sub={activeNet?.frequency ? `${activeNet.frequency} MHz` : "No active net"} live={!!activeNet} />
            <Panel label="PTT Status" icon={Satellite} value="Standby" sub="Tap to transmit" />
            <Panel label="Battery" icon={battery?.charging ? BatteryCharging : Battery} value={battery != null ? `${battery.level}%` : "—"} sub={battery?.charging ? "Charging" : battery ? "Discharging" : ""} />
            <Panel label="Emergency" icon={Siren} value="SOS" sub="Hold 3s to alert" danger />
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 px-2 py-1.5 overflow-x-auto scrollbar-hide">
        <button onClick={() => setOpen((v) => !v)} className="p-1.5 rounded-full hover:bg-muted/60 text-muted-foreground shrink-0" aria-label="Toggle Mission Control">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 pr-1">Mission Control</span>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          <Chip icon={Radio} label="Repeater" value={community?.primary_repeater ? community.primary_repeater.split(" ")[0] : "—"} />
          {activeNet && <Chip icon={Wifi} label="Net" value="LIVE" color="text-emerald-400" active />}
          <Chip icon={Activity} label="WX" value={temp != null ? `${Math.round(temp)}°` : "—"} />
          <Chip icon={CloudLightning} label="Ltg" value={lightningDist != null ? `${lightningDist}mi` : "0"} color={lightningDist != null && lightningDist <= 10 ? "text-amber-400" : ""} />
          <Chip icon={Crosshair} label="GPS" value={gps ? "On" : "Off"} color={gps ? "text-emerald-400" : ""} onClick={toggleGps} active={!!gps} />
          <Chip icon={battery?.charging ? BatteryCharging : Battery} label="Batt" value={battery != null ? `${battery.level}%` : "—"} color={battery && battery.level <= 15 ? "text-red-400" : ""} />
        </div>
        <Link to="/alerts/create" className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 text-red-300 text-[11px] font-bold hover:bg-red-500/30 transition-colors shrink-0">
          <Siren className="w-3.5 h-3.5" /> SOS
        </Link>
      </div>
    </div>
  );
}

function Panel({ label, icon: Icon, value, sub, onClick, action, danger, live }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`text-left rounded-xl border p-2.5 ${danger ? "border-red-500/40 bg-red-500/10" : "border-border bg-background/40"} ${onClick ? "hover:brightness-125" : ""}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3.5 h-3.5 ${danger ? "text-red-300" : "text-muted-foreground"}`} />
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground truncate">{label}</span>
        {live && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mist-pulse-ring ml-auto" />}
      </div>
      <p className={`text-sm font-bold truncate ${danger ? "text-red-200" : "text-foreground"}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground truncate">{sub}</p>}
      {action && <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">Active</p>}
    </button>
  );
}