import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Radio, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Derives a 0–100 propagation score and label from weather data.
 * Higher pressure + low humidity + calm winds = better propagation.
 */
function calcPropScore(cur) {
  let score = 50;

  // Barometric pressure (hPa) — high pressure boosts score
  if (cur.pressure >= 1022) score += 25;
  else if (cur.pressure >= 1013) score += 10;
  else if (cur.pressure < 1000) score -= 20;

  // Humidity
  if (cur.humidity <= 50) score += 10;
  else if (cur.humidity >= 85) score -= 15;

  // Wind speed (mph)
  if (cur.wind_speed <= 10) score += 10;
  else if (cur.wind_speed >= 30) score -= 10;

  // Thunderstorm / heavy rain = bad
  const cond = (cur.condition || "").toLowerCase();
  if (cond.includes("thunder")) score -= 30;
  else if (cond.includes("rain") || cond.includes("drizzle")) score -= 10;

  return Math.max(0, Math.min(100, score));
}

function scoreToLabel(score) {
  if (score >= 80) return { label: "Excellent", color: "text-emerald-400", bar: "bg-emerald-400", ring: "border-emerald-400/40" };
  if (score >= 60) return { label: "Good",      color: "text-cyan-400",    bar: "bg-cyan-400",    ring: "border-cyan-400/40" };
  if (score >= 40) return { label: "Fair",       color: "text-amber-400",   bar: "bg-amber-400",   ring: "border-amber-400/40" };
  return                  { label: "Poor",       color: "text-red-400",     bar: "bg-red-400",     ring: "border-red-400/40" };
}

export default function PropagationGauge() {
  const { data: weather, isLoading: loading } = useQuery({
    queryKey: ["weather-data"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getWeatherData", {});
      return res.data;
    },
    staleTime: 15 * 60 * 1000,
  });

  const score = weather?.current ? calcPropScore(weather.current) : null;
  const meta = score !== null ? scoreToLabel(score) : null;

  // Arc gauge: 180° semicircle
  const radius = 44;
  const circumference = Math.PI * radius; // half circle
  const progress = score !== null ? (score / 100) * circumference : 0;

  return (
    <Link to="/weather" className="block">
      <div className={`relative p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-violet-500/30 transition-all ${meta ? meta.ring : ""}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold text-foreground">RF Propagation</span>
          </div>
          {loading && <RefreshCw className="w-3.5 h-3.5 text-muted-foreground animate-spin" />}
        </div>

        <div className="flex items-center gap-5">
          {/* Arc gauge */}
          <div className="relative shrink-0" style={{ width: 100, height: 56 }}>
            <svg width="100" height="56" viewBox="0 0 100 56">
              {/* Track */}
              <path
                d="M 8 54 A 44 44 0 0 1 92 54"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {/* Progress */}
              {meta && (
                <path
                  d="M 8 54 A 44 44 0 0 1 92 54"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${progress} ${circumference}`}
                  className={meta.color}
                />
              )}
            </svg>
            {/* Center score */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-0.5">
              <span className={`text-2xl font-black leading-none ${meta ? meta.color : "text-muted-foreground"}`}>
                {score !== null ? score : "--"}
              </span>
            </div>
          </div>

          {/* Label + bar */}
          <div className="flex-1 space-y-2">
            <div>
              <p className={`text-lg font-bold leading-none ${meta ? meta.color : "text-muted-foreground"}`}>
                {meta ? meta.label : "Loading"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Local conditions</p>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${meta ? meta.bar : "bg-muted"}`}
                style={{ width: `${score ?? 0}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">Tap for full report</p>
          </div>
        </div>
      </div>
    </Link>
  );
}