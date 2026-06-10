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
  const { data: weather, isLoading, error } = useQuery({
    queryKey: ["weather"],
    queryFn: () => base44.functions.invoke("getWeatherData", {}),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    retry: 2,
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

  if (error || !weather) {
    return (
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
        <p className="text-sm text-muted-foreground text-center py-4">Weather data unavailable</p>
      </div>
    );
  }

  const { current, forecast } = weather;
  const WeatherIcon = weatherIcons[current.condition] || Cloud;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-violet-400" />
          Weather - {current.name}
        </h3>
        <Link to="/weather" className="text-xs text-violet-400 font-medium hover:text-violet-300">
          Full Forecast →
        </Link>
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
    </div>
  );
}