import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  CloudSun, Wind, Droplets, Eye, Gauge, Sunrise, Sunset,
  RefreshCw, Thermometer, CloudRain, Cloud, Sun, Zap, Snowflake,
  Navigation, Radio, AlertTriangle, Radar, Layers, Map
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StormTracker from "@/components/weather/StormTracker";

// Radar layer options using RainViewer (free, no key needed) + NWS
const RADAR_LAYERS = [
  { id: "rainviewer", label: "Rain Radar", color: "text-blue-400" },
  { id: "nws_ref", label: "NWS Composite", color: "text-cyan-400" },
  { id: "nws_ir", label: "Satellite IR", color: "text-violet-400" },
];

function WeatherRadar({ lat, lon }) {
  const [activeLayer, setActiveLayer] = useState("rainviewer");
  const [timestamp, setTimestamp] = useState(Math.floor(Date.now() / 1000 / 600) * 600);
  const [radarTs, setRadarTs] = useState(null);
  const [mapKey, setMapKey] = useState(0);

  // Fetch latest RainViewer timestamps
  useEffect(() => {
    fetch("https://api.rainviewer.com/public/weather-maps.json")
      .then(r => r.json())
      .then(d => {
        const past = d?.radar?.past || [];
        if (past.length > 0) setRadarTs(past[past.length - 1].path);
      })
      .catch(() => {});
  }, []);

  const centerLat = lat || 28.5383;
  const centerLon = lon || -81.3792;
  const zoom = 7;

  // Build tile URL for different layers
  const getTileUrl = () => {
    if (activeLayer === "rainviewer" && radarTs) {
      return `https://tilecache.rainviewer.com${radarTs}/256/{z}/{x}/{y}/2/1_1.png`;
    }
    if (activeLayer === "nws_ref") {
      return "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png";
    }
    if (activeLayer === "nws_ir") {
      return "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/goes-east-vis-900913/{z}/{x}/{y}.png";
    }
    // fallback rainviewer without latest timestamp
    return "https://tilecache.rainviewer.com/v2/radar/now/256/{z}/{x}/{y}/2/1_1.png";
  };

  const tileUrl = getTileUrl();

  // Build a leaflet-style static map URL using OpenStreetMap + radar overlay via iframe
  const iframeSrc = `https://embed.windy.com/embed2.html?lat=${centerLat}&lon=${centerLon}&detailLat=${centerLat}&detailLon=${centerLon}&width=100%&height=100%&zoom=${zoom}&level=surface&overlay=rain&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=mph&metricTemp=%C2%B0F&radarRange=-1`;

  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.07] bg-black">
      {/* Layer selector */}
      <div className="flex items-center gap-1 px-3 py-2 bg-black/60 border-b border-white/[0.06]">
        <Radar className="w-3.5 h-3.5 text-blue-400 shrink-0 mr-1" />
        {RADAR_LAYERS.map(l => (
          <button
            key={l.id}
            onClick={() => setActiveLayer(l.id)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
              activeLayer === l.id
                ? `bg-blue-500/25 ${l.color} border border-blue-500/30`
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {l.label}
          </button>
        ))}
        <button
          onClick={() => setMapKey(k => k + 1)}
          className="ml-auto p-1 text-muted-foreground hover:text-foreground"
          title="Refresh radar"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* Radar iframe — Windy gives excellent animated radar */}
      <div className="relative w-full" style={{ height: 320 }}>
        {activeLayer === "rainviewer" ? (
          <iframe
            key={`windy-${mapKey}`}
            src={iframeSrc}
            className="w-full h-full border-0"
            title="Weather Radar"
            allow="fullscreen"
          />
        ) : activeLayer === "nws_ref" ? (
          <iframe
            key={`nws-${mapKey}`}
            src={`https://radar.weather.gov/station/KORL/standard`}
            className="w-full h-full border-0"
            title="NWS Radar"
            allow="fullscreen"
          />
        ) : (
          <iframe
            key={`sat-${mapKey}`}
            src={`https://www.star.nesdis.noaa.gov/GOES/sector.php?sat=G16&sector=se`}
            className="w-full h-full border-0"
            title="Satellite"
            allow="fullscreen"
          />
        )}

        {/* Overlay label */}
        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">
          <p className="text-[9px] text-muted-foreground">
            {activeLayer === "rainviewer" ? "Windy · Live animated radar" :
             activeLayer === "nws_ref" ? "NWS NEXRAD · KORL Orlando" :
             "GOES-16 · Satellite IR"}
          </p>
        </div>
      </div>
    </div>
  );
}

// Wind direction degrees → compass label
function degToCompass(deg) {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

// Beaufort scale for ham radio operators
function beaufortScale(mph) {
  if (mph < 1)  return { level: 0, label: "Calm" };
  if (mph < 4)  return { level: 1, label: "Light Air" };
  if (mph < 8)  return { level: 2, label: "Light Breeze" };
  if (mph < 13) return { level: 3, label: "Gentle Breeze" };
  if (mph < 19) return { level: 4, label: "Moderate Breeze" };
  if (mph < 25) return { level: 5, label: "Fresh Breeze" };
  if (mph < 32) return { level: 6, label: "Strong Breeze" };
  if (mph < 39) return { level: 7, label: "Near Gale" };
  if (mph < 47) return { level: 8, label: "Gale" };
  if (mph < 55) return { level: 9, label: "Strong Gale" };
  if (mph < 64) return { level: 10, label: "Storm" };
  if (mph < 73) return { level: 11, label: "Violent Storm" };
  return { level: 12, label: "Hurricane Force" };
}

// Pressure trend label
function pressureCondition(hpa) {
  if (hpa >= 1022) return { label: "High — Fair", color: "text-emerald-400" };
  if (hpa >= 1013) return { label: "Normal", color: "text-cyan-400" };
  if (hpa >= 1000) return { label: "Low — Unsettled", color: "text-amber-400" };
  return { label: "Very Low — Storm Risk", color: "text-red-400" };
}

// inHg from hPa
function hpaToInHg(hpa) {
  return (hpa * 0.02953).toFixed(2);
}

// Prop condition to icon/color
function conditionIcon(condition) {
  const c = (condition || "").toLowerCase();
  if (c.includes("thunder")) return { Icon: Zap,       color: "text-yellow-300" };
  if (c.includes("rain") || c.includes("drizzle")) return { Icon: CloudRain, color: "text-blue-400" };
  if (c.includes("snow"))   return { Icon: Snowflake,  color: "text-sky-300" };
  if (c.includes("cloud"))  return { Icon: Cloud,      color: "text-slate-400" };
  return { Icon: Sun, color: "text-yellow-400" };
}

// Day name from date string
function dayName(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

// Format unix timestamp to HH:MM AM/PM
function formatTime(unix) {
  return new Date(unix * 1000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

// Ham radio propagation hint based on conditions
function propagationHint(current) {
  const hints = [];
  const p = current.pressure;
  const { level } = beaufortScale(current.wind_speed);
  if (p >= 1018) hints.push({ icon: "📡", text: "High pressure — good HF propagation likely" });
  else if (p < 1000) hints.push({ icon: "⚡", text: "Low pressure system — possible QRM/QRN" });
  if (level >= 6) hints.push({ icon: "📻", text: "High winds — secure outdoor antennas" });
  if (current.humidity > 85) hints.push({ icon: "💧", text: "High humidity — check coax connectors" });
  if (hints.length === 0) hints.push({ icon: "✅", text: "Conditions look favorable for radio ops" });
  return hints;
}

export default function Weather() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("pending"); // pending | granted | denied | default
  const [coords, setCoords] = useState(null);
  const coordsRef = useRef(null);

  const fetchWeather = async (coords) => {
    setLoading(true);
    setError(null);
    try {
      const payload = coords ? { lat: coords.latitude, lon: coords.longitude } : {};
      const res = await base44.functions.invoke("getWeatherData", payload);
      if (res.data?.current) {
        setWeather(res.data);
        setLastUpdated(new Date());
      } else {
        setError(res.data?.error || "Unable to load weather data.");
      }
    } catch (e) {
      setError("Failed to fetch weather data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus("default");
      fetchWeather(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsStatus("granted");
        coordsRef.current = pos.coords;
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        fetchWeather(pos.coords);
      },
      () => {
        setGpsStatus("denied");
        fetchWeather(null);
      },
      { timeout: 8000 }
    );
  }, []);

  // Auto-refresh every 5 min using last known coords
  useEffect(() => {
    const interval = setInterval(() => fetchWeather(coordsRef.current), 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => fetchWeather(coordsRef.current);

  const cur = weather?.current;
  const forecast = weather?.forecast || [];
  const beaufort = cur ? beaufortScale(cur.wind_speed) : null;
  const pressInfo = cur ? pressureCondition(cur.pressure) : null;
  const hints = cur ? propagationHint(cur) : [];

  return (
    <div className="min-h-screen bg-background pb-28">
      <PageHeader
        title="Weather"
        showBack
        rightAction={
          <button onClick={handleRefresh} disabled={loading} className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-40">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4">

        {/* Loading */}
        {loading && !weather && (
          <div className="flex flex-col items-center py-24 gap-3">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Loading weather...</p>
          </div>
        )}

        {/* Error */}
        {error && !weather && (
          <div className="text-center py-24">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {/* GPS status pill */}
        {gpsStatus !== "pending" && (
          <div className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full w-fit ${
            gpsStatus === "granted"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
              : "bg-amber-500/15 text-amber-400 border border-amber-500/25"
          }`}>
            <Navigation className="w-3 h-3" />
            {gpsStatus === "granted" ? "Using your GPS location" : "Using default location (Orlando, FL)"}
          </div>
        )}

        {cur && (
          <>
            {/* ── Hero current conditions ── */}
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-violet-900/50 via-indigo-900/30 to-background p-6">
              <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl -translate-y-10 translate-x-10" />
              <div className="relative">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
                  {cur.name || "Current Location"}
                </p>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-7xl font-black text-foreground leading-none">{cur.temp}°</div>
                    <p className="text-sm text-muted-foreground mt-1 capitalize">{cur.description}</p>
                    <p className="text-xs text-muted-foreground">Feels like {cur.feels_like}°F</p>
                  </div>
                  <div className="text-right">
                    {(() => { const { Icon, color } = conditionIcon(cur.condition); return <Icon className={`w-16 h-16 ${color} opacity-80`} />; })()}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Sunrise / Sunset ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                  <Sunrise className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Sunrise</p>
                  <p className="text-sm font-bold text-foreground">{formatTime(cur.sunrise)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <div className="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
                  <Sunset className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Sunset</p>
                  <p className="text-sm font-bold text-foreground">{formatTime(cur.sunset)}</p>
                </div>
              </div>
            </div>

            {/* ── Detail stats grid ── */}
            <div className="grid grid-cols-2 gap-3">
              {/* Wind */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-muted-foreground font-medium">Wind</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{cur.wind_speed} <span className="text-sm font-normal text-muted-foreground">mph</span></p>
                <p className="text-xs text-cyan-400 font-medium">{degToCompass(cur.wind_deg)} · BFT {beaufort.level}</p>
                <p className="text-[10px] text-muted-foreground">{beaufort.label}</p>
              </div>

              {/* Humidity */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-muted-foreground font-medium">Humidity</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{cur.humidity}<span className="text-sm font-normal text-muted-foreground">%</span></p>
                {/* Humidity bar */}
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${cur.humidity}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground">{cur.humidity > 80 ? "High — check connectors" : cur.humidity > 60 ? "Moderate" : "Low"}</p>
              </div>

              {/* Barometric Pressure */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-4 h-4 text-violet-400" />
                  <span className="text-xs text-muted-foreground font-medium">Pressure</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{hpaToInHg(cur.pressure)} <span className="text-sm font-normal text-muted-foreground">inHg</span></p>
                <p className={`text-xs font-medium ${pressInfo.color}`}>{pressInfo.label}</p>
                <p className="text-[10px] text-muted-foreground">{cur.pressure} hPa</p>
              </div>

              {/* Visibility */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-muted-foreground font-medium">Visibility</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{cur.visibility} <span className="text-sm font-normal text-muted-foreground">km</span></p>
                <p className="text-xs text-emerald-400 font-medium">
                  {cur.visibility >= 10 ? "Excellent" : cur.visibility >= 5 ? "Good" : cur.visibility >= 2 ? "Moderate" : "Poor"}
                </p>
                <p className="text-[10px] text-muted-foreground">{(cur.visibility * 0.621371).toFixed(1)} miles</p>
              </div>
            </div>

            {/* ── Ham Radio Propagation Hints ── */}
            <div className="p-4 rounded-xl bg-violet-950/40 border border-violet-500/20 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Radio className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-semibold text-foreground">Radio Conditions</span>
              </div>
              {hints.map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="shrink-0">{h.icon}</span>
                  <span className="text-xs">{h.text}</span>
                </div>
              ))}
            </div>

            {/* ── Live Radar ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Radar className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-foreground">Live Radar</h3>
                <span className="text-[10px] text-emerald-400 font-medium px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">LIVE</span>
              </div>
              <WeatherRadar lat={coords?.lat} lon={coords?.lon} />
            </div>

            {/* ── 5-Day Forecast ── */}
            {forecast.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">5-Day Forecast</h3>
                <div className="space-y-2">
                  {forecast.map((day, i) => {
                    const { Icon, color } = conditionIcon(day.condition);
                    return (
                      <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                        <span className="text-sm font-medium text-foreground w-10">{i === 0 ? "Today" : dayName(day.date)}</span>
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-4 h-4 ${color}`} />
                          <span className="text-xs text-muted-foreground capitalize hidden sm:inline">{day.description}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <span className="text-foreground">{Math.round(day.temp_max)}°</span>
                          <span className="text-muted-foreground text-xs">{Math.round(day.temp_min)}°</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Last updated */}
            {lastUpdated && (
              <p className="text-center text-[10px] text-muted-foreground pb-2">
                Updated {lastUpdated.toLocaleTimeString()} · auto-refreshes every 15 min
              </p>
            )}
          </>
        )}

        {/* ── Storm Tracker ── */}
        <StormTracker />
      </div>
    </div>
  );
}