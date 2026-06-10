import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Cloud, Wind, Droplets, Gauge, Navigation, AlertTriangle, Radio } from "lucide-react";
import { Link } from "react-router-dom";

export default function WeatherSection() {
  const { data: weatherData, isLoading } = useQuery({
    queryKey: ["weather"],
    queryFn: () => base44.functions.invoke("getWeatherData", {}),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Cloud className="w-4 h-4 text-blue-400" />
            Weather & Tropical
          </h3>
        </div>
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const current = weatherData?.current;
  const tropical = weatherData?.tropical || [];

  return (
    <div className="space-y-3">
      {/* Current Weather */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-transparent border border-blue-500/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Cloud className="w-4 h-4 text-blue-400" />
            Current Weather
          </h3>
          {current?.city && (
            <span className="text-xs text-muted-foreground">{current.city}</span>
          )}
        </div>

        {current ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3">
              <img
                src={`https://openweathermap.org/img/wn/${current.icon}@2x.png`}
                alt={current.description}
                className="w-12 h-12"
              />
              <div>
                <p className="text-2xl font-bold text-foreground">{Math.round(current.temp)}°F</p>
                <p className="text-xs text-muted-foreground capitalize">{current.description}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Droplets className="w-3 h-3 text-blue-400" />
                <span>{current.humidity}% humidity</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Wind className="w-3 h-3 text-teal-400" />
                <span>{Math.round(current.windSpeed)} mph</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Gauge className="w-3 h-3 text-purple-400" />
                <span>{current.pressure} mb</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Weather data unavailable</p>
        )}
      </div>

      {/* Tropical Systems */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            Tropical Activity
          </h3>
          <Link
            to="https://www.nhc.noaa.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            NHC.gov →
          </Link>
        </div>

        {tropical.length > 0 ? (
          <div className="space-y-2">
            {tropical.map((system) => (
              <div
                key={system.name}
                className={`p-3 rounded-lg border ${
                  system.category >= 3
                    ? "bg-red-500/10 border-red-500/30"
                    : system.category >= 1
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-blue-500/10 border-blue-500/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={`w-4 h-4 ${
                        system.category >= 3
                          ? "text-red-400"
                          : system.category >= 1
                          ? "text-amber-400"
                          : "text-blue-400"
                      }`}
                    />
                    <span className="text-sm font-bold text-foreground">
                      {system.name}
                      {system.category > 0 && ` (Cat ${system.category})`}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{system.type}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Wind className="w-3 h-3" />
                    <span>{system.windSpeed} mph</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    <span>{system.movement}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
              <Radio className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-foreground">No Active Systems</p>
            <p className="text-xs text-muted-foreground mt-0.5">Atlantic basin is quiet</p>
          </div>
        )}
      </div>
    </div>
  );
}