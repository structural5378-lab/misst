import React from 'react';

const STATS = [
  { key: 'achievement_score',     label: 'Score' },
  { key: 'net_checkins',           label: 'Check-ins' },
  { key: 'net_control_sessions',  label: 'Net Control' },
  { key: 'repeaters_visited',     label: 'Repeaters' },
  { key: 'miles_traveled',         label: 'Miles' },
  { key: 'emergency_activations',  label: 'Emergency' },
  { key: 'years_active',           label: 'Years' },
  { key: 'daily_login_streak',     label: 'Streak' },
];

export default function PrestigeStats({ stats = {} }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {STATS.map(({ key, label }) => (
        <div
          key={key}
          className="flex flex-col items-center py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]"
        >
          <span className="text-base font-bold text-foreground">
            {(stats[key] || 0).toLocaleString()}
          </span>
          <span className="text-[9px] text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}