import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, Sunrise, Sunset, Eye, Gauge } from "lucide-react";
import { Link } from "react-router-dom";

const weatherIcons = {
  Clear: Sun,
  Clouds: Cloud,
  Rain: CloudRain,
  Drizzle: CloudRain,
  Thunderstorm: CloudRain,
  Snow: Cloud,
  Mist: Cloud,
  Fog: Cloud,
};

export default function WeatherSection() {
  const { data: weather, isLoading, error, refetch } = useQuery({
    queryKey: ["weather"],
    queryFn: () => base44.functions.invoke("getWeatherData", {}),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    retry: 3,
  });

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !weather?.current) {
    return (
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
        <div className="text-center py-6">
          <Cloud className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground mb-2">Weather data unavailable</p>
          <button
            onClick={() => refetch()}
            className="text-xs text-violet-400 hover:text-violet-300 font-medium"
          >
            Try Again →
          </button>
        </div>
      </div>
    );
  }

  const { current, forecast, location } = weather;
  const WeatherIcon = weatherIcons[current.condition] || Cloud;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-violet-400" />
          Weather - {current.name || "Central Florida"}
        </h3>
      </div>

      <div className="space-y-3">
        {/* Current Weather */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <WeatherIcon className="w-7 h-7 text-violet-300" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{current.temp}°</p>
                <p className="text-xs text-muted-foreground capitalize">{current.description}</p>
                <p className="text-xs text-muted-foreground">Feels like {current.feels_like}°</p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center gap-1.5 justify-end text-xs text-muted-foreground">
                <Droplets className="w-3 h-3" />
                <span>{current.humidity}%</span>
              </div>
              <div className="flex items-center gap-1.5 justify-end text-xs text-muted-foreground">
                <Wind className="w-3 h-3" />
                <span>{current.wind_speed} mph</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5-Day Forecast */}
        {forecast && forecast.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">5-Day Forecast</h4>
            <div className="grid grid-cols-5 gap-2">
              {forecast.map((day, idx) => {
                const DayIcon = weatherIcons[day.condition] || Cloud;
                const date = new Date(day.date + "T00:00:00");
                const dayName = idx === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" });

                return (
                  <div
                    key={day.date}
                    className="flex flex-col items-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.07]"
                  >
                    <span className="text-[10px] text-muted-foreground mb-1">{dayName}</span>
                    <DayIcon className="w-4 h-4 text-violet-300 mb-1" />
                    <span className="text-xs font-bold text-foreground">{Math.round(day.temp_max)}°</span>
                    <span className="text-[10px] text-muted-foreground">{Math.round(day.temp_min)}°</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}