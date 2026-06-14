import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { CloudSun, Wind, Droplets, Thermometer, Eye, Gauge, RefreshCw } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StormTracker from "@/components/weather/StormTracker";

export default function Weather() {
  const { mybbUser } = useMyBBAuth();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("getWeatherData", {});
      if (res.data?.current) {
        setWeather(res.data);
        setLastUpdated(new Date());
      } else {
        setError("Unable to load weather data.");
      }
    } catch (e) {
      setError("Failed to fetch weather.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const current = weather?.current;

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Weather"
        showBack
        rightAction={
          <button onClick={fetchWeather} className="p-2 text-muted-foreground hover:text-foreground">
            <RefreshCw className="w-4 h-4" />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-5">
        {loading && (
          <div className="flex flex-col items-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Loading weather...</p>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-20">
            <CloudSun className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {current && !loading && (
          <>
            {/* Main temp card */}
            <div className="rounded-2xl bg-gradient-to-br from-violet-900/40 via-indigo-900/30 to-background border border-white/[0.07] p-6 text-center">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                {weather.location?.name}{weather.location?.region ? `, ${weather.location.region}` : ""}
              </p>
              <div className="text-6xl font-bold text-foreground my-3">
                {Math.round(current.temp_f)}°
              </div>
              <p className="text-sm text-muted-foreground capitalize">{current.condition?.text}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Feels like {Math.round(current.feelslike_f)}°F
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Wind, label: "Wind", value: `${Math.round(current.wind_mph)} mph ${current.wind_dir}`, color: "text-cyan-400" },
                { icon: Droplets, label: "Humidity", value: `${current.humidity}%`, color: "text-blue-400" },
                { icon: Eye, label: "Visibility", value: `${current.vis_miles} mi`, color: "text-violet-400" },
                { icon: Gauge, label: "Pressure", value: `${current.pressure_in} in`, color: "text-amber-400" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                  <div className={`w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className="text-sm font-semibold text-foreground">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {lastUpdated && (
              <p className="text-center text-[10px] text-muted-foreground">
                Updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </>
        )}

        {/* Storm Tracker */}
        <StormTracker />
      </div>
    </div>
  );
}