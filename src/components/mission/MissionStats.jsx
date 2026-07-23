import React, { useMemo } from "react";
import DurationTimer from "./DurationTimer";

const STAT_CARDS = [
  { key: "operators", label: "Total Operators" },
  { key: "visitors", label: "Visitors" },
  { key: "cities", label: "Cities" },
  { key: "longest", label: "Longest Contact" },
  { key: "avgDist", label: "Avg Distance" },
  { key: "duration", label: "Net Duration" },
];

export default function MissionStats({ checkins = [], session }) {
  const approved = checkins.filter((c) => c.approved !== false);

  const stats = useMemo(() => {
    const distances = approved.map((c) => c.distance).filter((d) => d != null);
    const cities = {};
    approved.forEach((c) => {
      const city = (c.location || "").split(",")[0].trim();
      if (city) cities[city] = (cities[city] || 0) + 1;
    });
    const topCities = Object.entries(cities).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxCity = topCities.length ? Math.max(...topCities.map((c) => c[1])) : 1;
    const first = approved[0];
    const last = approved[approved.length - 1];
    return {
      operators: approved.length,
      visitors: approved.filter((c) => c.status === "visitor").length,
      cities: Object.keys(cities).length,
      longest: distances.length ? Math.max(...distances) : null,
      avgDist: distances.length ? distances.reduce((a, b) => a + b, 0) / distances.length : null,
      first,
      last,
      topCities,
      maxCity,
    };
  }, [approved]);

  const values = {
    operators: stats.operators,
    visitors: stats.visitors,
    cities: stats.cities,
    longest: stats.longest != null ? `${Math.round(stats.longest)} mi` : "—",
    avgDist: stats.avgDist != null ? `${stats.avgDist.toFixed(1)} mi` : "—",
    duration: session ? <DurationTimer startedAt={session.started_at} pausedAt={session.paused_at} pausedTotal={session.paused_total} status={session.status} /> : "—",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2.5">
        {STAT_CARDS.map((c, i) => (
          <div key={c.key} className="mist-fade-up rounded-2xl bg-card/60 border border-white/[0.06] p-3 text-center" style={{ animationDelay: `${i * 40}ms` }}>
            <p className="text-lg font-black text-foreground tabular-nums leading-none">{values[c.key]}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {stats.first && stats.last && (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-card/60 border border-white/[0.06] p-3">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">First Check-in</p>
            <p className="text-sm font-semibold text-foreground mt-1">{stats.first.callsign}</p>
            <p className="text-[10px] text-muted-foreground">{stats.first.checked_in_at && new Date(stats.first.checked_in_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
          </div>
          <div className="rounded-2xl bg-card/60 border border-white/[0.06] p-3">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Last Check-in</p>
            <p className="text-sm font-semibold text-foreground mt-1">{stats.last.callsign}</p>
            <p className="text-[10px] text-muted-foreground">{stats.last.checked_in_at && new Date(stats.last.checked_in_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-card/60 border border-white/[0.06] p-4">
        <p className="text-xs font-bold text-foreground mb-3">Top Cities</p>
        {stats.topCities.length === 0 ? (
          <p className="text-xs text-muted-foreground">No location data yet.</p>
        ) : (
          <div className="space-y-2">
            {stats.topCities.map(([city, count]) => (
              <div key={city} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-24 truncate">{city}</span>
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 ach-bar-fill" style={{ width: `${(count / stats.maxCity) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-foreground tabular-nums w-5 text-right">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}