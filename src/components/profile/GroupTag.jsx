import React from 'react';
import { ICON_MAP } from '@/components/achievements/iconMap';

export default function GroupTag({ group }) {
  const Icon = ICON_MAP[group.icon] || ICON_MAP.Shield;
  return (
    <div
      className="group-pill"
      style={{ background: group.gradient, color: group.textColor, boxShadow: group.glow }}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{group.name}</span>
    </div>
  );
}