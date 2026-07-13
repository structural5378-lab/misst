import React from 'react';
import { ICON_MAP } from './iconMap';
import { STATS_CONFIG } from '@/lib/achievementsData';

export default function StatsGrid({ stats = {} }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {STATS_CONFIG.map(({ key, label, icon }) => {
        const Icon = ICON_MAP[icon] || ICON_MAP.Award;
        const value = stats[key] ?? 0;
        return (
          <div key={key} className="flex flex-col items-center py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <Icon className="w-4 h-4 text-violet-400 mb-1" />
            <span className="text-lg font-bold text-foreground">{value.toLocaleString()}</span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
          </div>
        );
      })}
    </div>
  );
}